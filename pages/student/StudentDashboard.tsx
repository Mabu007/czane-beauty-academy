import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Course, Enrollment, CertificateTemplate } from '../../types';
import { generateCertificate } from '../../services/certificateService';
import { LogOut, BookOpen, Clock, Award, PlayCircle, CheckCircle, Loader2, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import * as RouterDOM from 'react-router-dom';

const { Link, useNavigate } = RouterDOM;

interface EnrolledCourseData extends Course {
  enrollmentId: string;
  progress: number;
  completedLessons: string[];
  certificateIssued?: boolean;
  totalLessons: number;
}

export const StudentDashboard: React.FC = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) navigate('/auth');
  }, [user, loadingAuth, navigate]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      setError(null);
      
      try {
        const q = query(collection(db, "enrollments"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        const coursesData: EnrolledCourseData[] = [];

        for (const enrollmentDoc of snapshot.docs) {
          const enrollment = enrollmentDoc.data() as Enrollment;
          
          if (!enrollment.courseId) continue;

          try {
            const courseDoc = await getDoc(doc(db, "courses", enrollment.courseId));
            
            if (courseDoc.exists()) {
              const course = courseDoc.data() as Course;
              const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
              const completedCount = enrollment.completedLessons?.length || 0;
              const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
              coursesData.push({
                ...course,
                id: courseDoc.id,
                enrollmentId: enrollmentDoc.id,
                progress,
                completedLessons: enrollment.completedLessons || [],
                certificateIssued: enrollment.certificateIssued,
                totalLessons
              });
            }
          } catch (courseError) {
            console.warn(`Failed to load course ${enrollment.courseId} for enrollment ${enrollmentDoc.id}. This might be due to permissions (e.g. Draft course) or deletion.`, courseError);
            // Continue loop so other courses load
          }
        }
        setEnrolledCourses(coursesData);
      } catch (err: any) {
        console.error("Error fetching enrollments:", err);
        setError("We couldn't load your enrolled courses due to a permission issue. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAuth && user) {
        fetchEnrollments();
    }
  }, [user, loadingAuth]);

  const handleDownloadCertificate = async (course: EnrolledCourseData) => {
    if (!user) return;
    setGeneratingCertId(course.id);
    
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
      
      // Update issuance status if needed
      if(!course.certificateIssued) {
         await updateDoc(doc(db, "enrollments", course.enrollmentId), { certificateIssued: true });
         // Update local state to show 'Certified' immediately
         setEnrolledCourses(prev => prev.map(c => c.id === course.id ? {...c, certificateIssued: true} : c));
      }

    } catch (e) {
      console.error("Cert gen failed", e);
      alert("Failed to generate certificate. Please contact admin.");
    } finally {
      setGeneratingCertId(null);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/auth');
  };

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-purple-900 text-white pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">Welcome, {user?.displayName || 'Student'}</h1>
              <p className="text-purple-200">Track your learning progress and achievements.</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center text-sm font-bold bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-600 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{enrolledCourses.length}</div>
                  <div className="text-sm text-purple-200">Enrolled Courses</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {enrolledCourses.filter(c => c.progress === 100).length}
                  </div>
                  <div className="text-sm text-purple-200">Certifications Earned</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length}
                  </div>
                  <div className="text-sm text-purple-200">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-20">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <PlayCircle className="w-5 h-5 mr-2 text-pink-600" /> Your Courses
        </h2>

        {error ? (
           <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-red-100">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="w-8 h-8 text-red-400" />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">Error Loading Dashboard</h3>
             <p className="text-gray-500 mb-6">{error}</p>
             <Link to="/#courses" className="text-pink-600 font-bold hover:underline">
               Browse Available Courses
             </Link>
           </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-6">You haven't enrolled in any courses yet. Start your journey today!</p>
            <Link to="/#courses" className="bg-pink-600 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-700 transition">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrolledCourses.map(course => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition duration-300">
                <div className="h-40 bg-gray-200 relative">
                  <img 
                    src={course.image || 'https://via.placeholder.com/300'} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                  {course.progress === 100 && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> Completed
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-green-500' : 'bg-pink-500'}`} 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <Link 
                      to={`/course/${course.id}`} 
                      className="block w-full text-center bg-gray-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition text-sm flex items-center justify-center"
                    >
                      {course.progress === 0 ? 'Start Learning' : 'Continue Learning'} <ExternalLink className="w-3 h-3 ml-2"/>
                    </Link>

                    {course.progress === 100 && (
                      <button 
                        onClick={() => handleDownloadCertificate(course)}
                        disabled={generatingCertId === course.id}
                        className="w-full flex items-center justify-center border-2 border-green-500 text-green-700 py-2.5 rounded-lg font-bold hover:bg-green-50 transition text-sm"
                      >
                         {generatingCertId === course.id ? (
                           <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Generating...</>
                         ) : (
                           <><Download className="w-4 h-4 mr-2"/> Download Certificate</>
                         )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};