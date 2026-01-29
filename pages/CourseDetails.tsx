import React, { useEffect, useState } from 'react';
import * as RouterDOM from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs, setDoc } from 'firebase/firestore';
import { Course, Enrollment, CertificateTemplate, QuizQuestion, Lesson } from '../types';
import { generateCertificate } from '../services/certificateService';
import { ArrowLeft, Clock, BarChart, ChevronDown, ChevronUp, PlayCircle, FileText, File, HelpCircle, Lock, BookOpen, Users, GraduationCap, CreditCard, CheckCircle, Award, Download, AlertCircle, X, Loader2 } from 'lucide-react';

const { useParams, Link, useNavigate } = RouterDOM;

export const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  
  // Lesson Viewer State
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Quiz State
  const [activeQuizLesson, setActiveQuizLesson] = useState<{lessonId: string, questions: QuizQuestion[]} | null>(null);
  // Store answers as: index -> string (for text) or number (for index of choice)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Certificate State
  const [certGenerating, setCertGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Course
        let fetchedCourse: Course | null = null;
        try {
          const docRef = doc(db, "courses", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            fetchedCourse = { id: docSnap.id, ...docSnap.data() } as Course;
            setCourse(fetchedCourse);
            if(fetchedCourse.modules?.length > 0) {
              setOpenModules({ [fetchedCourse.modules[0].id]: true });
            }
          } else {
             setError("Course not found.");
          }
        } catch (courseErr: any) {
          if (courseErr.code === 'permission-denied') {
             console.warn("Permission denied for course details. Course might be in Draft mode.");
             setError("This course is currently not available to the public.");
          } else {
             console.error("Error fetching course details", courseErr);
             setError("Unable to load course details.");
          }
        }

        // 2. Fetch Enrollment (if logged in)
        if (user) {
          try {
            const q = query(
              collection(db, "enrollments"), 
              where("userId", "==", user.uid),
              where("courseId", "==", id)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const enrollData = snapshot.docs[0].data() as Enrollment;
              setEnrollment({ ...enrollData, id: snapshot.docs[0].id });
            }
          } catch (enrollErr) {
            console.error("Error fetching enrollment status", enrollErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnroll = () => {
    if (course) navigate(`/payment/${course.id}`);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!enrollment) return;
    if (enrollment.completedLessons?.includes(lessonId)) return;

    try {
        const enrolRef = doc(db, "enrollments", enrollment.id);
        await updateDoc(enrolRef, {
            completedLessons: arrayUnion(lessonId)
        });
        setEnrollment(prev => prev ? { ...prev, completedLessons: [...(prev.completedLessons || []), lessonId] } : null);
    } catch (e) {
        console.error("Error marking complete", e);
    }
  };

  const startQuiz = (lessonId: string, questions: QuizQuestion[]) => {
    setActiveQuizLesson({ lessonId, questions });
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleQuizSubmit = async () => {
    if (!activeQuizLesson || !enrollment) return;
    
    let correct = 0;
    activeQuizLesson.questions.forEach((q, idx) => {
        const answer = quizAnswers[idx];
        
        if (q.type === 'short-answer') {
            if (typeof answer === 'string' && answer.trim().length > 0) {
                 if (typeof q.correctAnswer === 'string' && q.correctAnswer.length > 0) {
                     if(answer.toLowerCase().includes(q.correctAnswer.toLowerCase()) || q.correctAnswer.toLowerCase().includes(answer.toLowerCase())) {
                         correct++;
                     } else {
                         correct++;
                     }
                 } else {
                     correct++;
                 }
            }
        } else {
            // Multiple Choice
            if (answer === q.correctAnswer) correct++;
        }
    });

    setQuizScore(correct);
    setQuizSubmitted(true);
    
    // Save Result if Passed (e.g. > 50%)
    const passed = (correct / activeQuizLesson.questions.length) >= 0.5;
    
    if (passed) {
        const resultKey = `quizResults.${activeQuizLesson.lessonId}`;
        const enrolRef = doc(db, "enrollments", enrollment.id);
        
        // Update Quiz Result & Mark Lesson Complete
        await updateDoc(enrolRef, {
            [resultKey]: {
                lessonId: activeQuizLesson.lessonId,
                score: correct,
                totalQuestions: activeQuizLesson.questions.length,
                dateTaken: new Date().toISOString(),
                passed: true
            },
            completedLessons: arrayUnion(activeQuizLesson.lessonId)
        });

        // Update local state
        setEnrollment(prev => {
           if(!prev) return null;
           const newResults = { ...(prev.quizResults || {}) };
           newResults[activeQuizLesson.lessonId] = {
                lessonId: activeQuizLesson.lessonId,
                score: correct,
                totalQuestions: activeQuizLesson.questions.length,
                dateTaken: new Date().toISOString(),
                passed: true
           };
           return { 
               ...prev, 
               completedLessons: [...(prev.completedLessons || []), activeQuizLesson.lessonId],
               quizResults: newResults
           };
        });
    }
  };

  const handleDownloadCertificate = async () => {
    if(!course || !user) return;
    setCertGenerating(true);
    try {
        // Fetch template
        const tplSnap = await getDoc(doc(db, "settings", "certificateTemplate"));
        const template = tplSnap.exists() ? tplSnap.data() as CertificateTemplate : {
            id: 'default',
            academyName: 'Czane Beauty Academy',
            backgroundUrl: '',
            titleColor: '#D4AF37',
            textColor: '#000',
            signatureText: 'Zanele Masondo'
        };

        const dataUrl = await generateCertificate(
            user.displayName || 'Student',
            course.title,
            new Date().toLocaleDateString(),
            template
        );

        // Trigger Download
        const link = document.createElement('a');
        link.download = `Certificate - ${course.title}.png`;
        link.href = dataUrl;
        link.click();
        
        // Mark as issued if not already
        if(enrollment && !enrollment.certificateIssued) {
             await updateDoc(doc(db, "enrollments", enrollment.id), { certificateIssued: true });
        }

    } catch (e) {
        console.error("Cert gen failed", e);
        alert("Failed to generate certificate. Please contact admin.");
    } finally {
        setCertGenerating(false);
    }
  };

  // --- Calculation ---
  const totalLessons = course?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
  const completedCount = enrollment?.completedLessons?.length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCourseComplete = progressPercent === 100;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;
  
  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Content Unavailable</h3>
            <p className="text-gray-500 mb-6">{error || "Course details could not be loaded."}</p>
            <Link to="/#courses" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-bold hover:bg-black transition">
                Back to Courses
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-purple-800 mb-6 font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="relative h-64 md:h-80">
             <img 
                src={course.image || `https://picsum.photos/seed/${course.id}/1200/600`}
                alt={course.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 inline-block">
                        {course.level}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2 text-shadow">{course.title}</h1>
                  </div>
                  {!enrollment && <div className="text-3xl font-bold text-yellow-400">R {course.price}</div>}
                </div>
              </div>
          </div>

          {/* Progress Bar for Enrolled Students */}
          {enrollment && (
            <div className="bg-gray-100 p-6 border-b border-gray-200">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-700">Your Progress</h3>
                  <span className="text-pink-600 font-bold">{progressPercent}% Completed</span>
               </div>
               <div className="w-full bg-gray-300 rounded-full h-3">
                  <div className="bg-pink-600 h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }}></div>
               </div>
               {isCourseComplete && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                     <div className="flex items-center text-green-800 font-bold">
                        <Award className="w-6 h-6 mr-2 text-green-600"/>
                        Congratulations! You have completed this course.
                     </div>
                     <button 
                       onClick={handleDownloadCertificate}
                       disabled={certGenerating}
                       className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition flex items-center shadow-lg"
                     >
                        {certGenerating ? 'Generating...' : <><Download className="w-4 h-4 mr-2"/> Download Certificate</>}
                     </button>
                  </div>
               )}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Main Content */}
            <div className="lg:col-span-2 p-8 border-r border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">About this Course</h2>
                <p className="text-gray-600 leading-relaxed mb-10 text-lg">
                    {course.description}
                </p>
                
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-pink-600"/> Course Curriculum
                </h3>

                <div className="space-y-4">
                  {course.modules?.map((module, idx) => (
                    <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <span className="font-bold text-gray-800">Module {idx + 1}: {module.title}</span>
                        {openModules[module.id] ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                      </button>
                      
                      {openModules[module.id] && (
                        <div className="bg-white divide-y divide-gray-100">
                          {module.lessons.map((lesson, lIdx) => {
                            const isLocked = !enrollment;
                            const isCompleted = enrollment?.completedLessons?.includes(lesson.id);
                            
                            return (
                              <div key={lesson.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition group ${isCompleted ? 'bg-green-50/50' : ''}`}>
                                 <div className="flex items-center gap-3 mb-2 md:mb-0">
                                    {isCompleted ? <CheckCircle className="text-green-500 w-5 h-5"/> : (
                                        lesson.type === 'video' ? <PlayCircle size={18} className="text-blue-500"/> :
                                        lesson.type === 'quiz' || lesson.type === 'exam' ? <HelpCircle size={18} className="text-orange-500"/> :
                                        <FileText size={18} className="text-gray-500"/>
                                    )}
                                    <span className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{lesson.title}</span>
                                 </div>
                                 
                                 {isLocked ? (
                                     <Lock size={14} className="text-gray-300"/>
                                 ) : (
                                     <div className="flex items-center gap-2">
                                         {/* Action Button */}
                                         {(lesson.type === 'quiz' || lesson.type === 'exam') ? (
                                            <button 
                                                onClick={() => startQuiz(lesson.id, lesson.quizData || [])}
                                                className={`text-xs px-3 py-1 rounded-full font-bold border transition ${isCompleted ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100'}`}
                                            >
                                                {isCompleted ? `Retake ${lesson.type === 'exam' ? 'Exam' : 'Quiz'}` : `Take ${lesson.type === 'exam' ? 'Exam' : 'Quiz'}`}
                                            </button>
                                         ) : (
                                            <button 
                                                onClick={() => {
                                                  markLessonComplete(lesson.id);
                                                  setActiveLesson(lesson);
                                                }}
                                                className="text-xs px-3 py-1 rounded-full font-bold border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                            >
                                                View Content
                                            </button>
                                         )}
                                     </div>
                                 )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 p-8 bg-gray-50">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                    <h3 className="font-bold text-gray-900 mb-4">Course Features</h3>
                    <ul className="space-y-4 text-sm text-gray-600 mb-8">
                        <li className="flex items-center"><Clock className="w-4 h-4 mr-3 text-pink-500" /> Self-paced learning</li>
                        <li className="flex items-center"><BarChart className="w-4 h-4 mr-3 text-pink-500" /> {course.level} Level</li>
                        <li className="flex items-center"><FileText className="w-4 h-4 mr-3 text-pink-500" /> Accredited Certification</li>
                        <li className="flex items-center"><Users className="w-4 h-4 mr-3 text-pink-500" /> Instructor Support</li>
                    </ul>
                    
                    {!enrollment && (
                        <>
                        <button 
                        onClick={handleEnroll}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform active:scale-95 flex items-center justify-center"
                        >
                            <CreditCard className="w-4 h-4 mr-2"/> Enroll Now (R{course.price})
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">Secure Payment via PayFast</p>
                        </>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* LESSON CONTENT MODAL */}
      {activeLesson && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        {activeLesson.type === 'video' && <PlayCircle className="w-5 h-5 mr-2 text-blue-500"/>}
                        {activeLesson.type === 'text' && <FileText className="w-5 h-5 mr-2 text-gray-500"/>}
                        {activeLesson.type === 'pdf' && <File className="w-5 h-5 mr-2 text-red-500"/>}
                        {activeLesson.title}
                    </h3>
                    <button onClick={() => setActiveLesson(null)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-0 overflow-y-auto bg-black/5 flex-grow relative">
                    {activeLesson.type === 'video' && (
                        <div className="w-full h-full min-h-[50vh] flex items-center justify-center bg-black">
                             {activeLesson.content && (activeLesson.content.includes('youtube.com') || activeLesson.content.includes('youtu.be')) ? (
                                <iframe 
                                  src={activeLesson.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                  className="w-full h-full aspect-video" 
                                  allowFullScreen 
                                  title="Video Content"
                                />
                             ) : (
                                <video 
                                    src={activeLesson.content} 
                                    controls 
                                    className="max-w-full max-h-[80vh] outline-none" 
                                    autoPlay
                                />
                             )}
                        </div>
                    )}
                    
                    {activeLesson.type === 'text' && (
                        <div className="p-8 prose prose-lg max-w-none bg-white min-h-full">
                           <div className="whitespace-pre-wrap">{activeLesson.content}</div>
                        </div>
                    )}

                    {activeLesson.type === 'pdf' && (
                         <div className="w-full h-full min-h-[70vh] bg-gray-100">
                             <iframe src={activeLesson.content} className="w-full h-full" title={activeLesson.title} />
                         </div>
                    )}
                </div>
                 {activeLesson.type === 'pdf' && (
                    <div className="p-4 bg-gray-50 border-t text-right">
                        <a href={activeLesson.content} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline text-sm font-bold">
                            <Download className="w-4 h-4 mr-2"/> Download PDF
                        </a>
                    </div>
                 )}
            </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {activeQuizLesson && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">Knowledge Check</h3>
                    <button onClick={() => setActiveQuizLesson(null)} className="text-gray-400 hover:text-gray-600"><X/></button>
                </div>
                
                <div className="p-8 space-y-8">
                    {!quizSubmitted ? (
                        <>
                            {activeQuizLesson.questions.map((q, idx) => (
                                <div key={idx}>
                                    <p className="font-bold text-gray-800 mb-3">{idx + 1}. {q.question}</p>
                                    <div className="pl-4">
                                        {q.type === 'short-answer' ? (
                                            <textarea 
                                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                                                rows={3}
                                                placeholder="Type your answer here..."
                                                value={quizAnswers[idx] as string || ''}
                                                onChange={(e) => setQuizAnswers({...quizAnswers, [idx]: e.target.value})}
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {q.options?.map((opt, oIdx) => (
                                                    <label key={oIdx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${quizAnswers[idx] === oIdx ? 'bg-pink-50 border-pink-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                                        <input 
                                                            type="radio" 
                                                            name={`q-${idx}`} 
                                                            className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                                            checked={quizAnswers[idx] === oIdx}
                                                            onChange={() => setQuizAnswers({...quizAnswers, [idx]: oIdx})}
                                                        />
                                                        <span className="ml-3 text-sm text-gray-700">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={handleQuizSubmit}
                                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg mt-4"
                            >
                                Submit Answers
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                             <div className="mb-6">
                                {(quizScore / activeQuizLesson.questions.length) >= 0.5 ? (
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                        <Award size={40}/>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                                        <AlertCircle size={40}/>
                                    </div>
                                )}
                             </div>
                             
                             <h4 className="text-2xl font-bold mb-2">
                                You scored {Math.round((quizScore / activeQuizLesson.questions.length) * 100)}%
                             </h4>
                             <p className="text-gray-500 mb-8">
                                {(quizScore / activeQuizLesson.questions.length) >= 0.5 
                                    ? "Great job! This lesson is marked as complete." 
                                    : "Don't worry, review the material and try again."}
                             </p>
                             
                             <button onClick={() => setActiveQuizLesson(null)} className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition">
                                Continue Course
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};