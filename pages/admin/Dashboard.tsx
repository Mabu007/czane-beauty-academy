import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth'; // Specific imports for secondary app
import { collection, getDocs, orderBy, query, doc, setDoc, addDoc, where, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Course, UserProfile, Lesson, Enrollment, CertificateTemplate, QuizResult } from '../../types';
import { courseService } from '../../services/courseService';
import { generateCourseDescription, generateQuizQuestions, generateExamQuestions } from '../../services/geminiService';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { QuizBuilder } from '../../components/QuizBuilder';
import { generateCertificate } from '../../services/certificateService';
import { 
  Plus, BookOpen, Users, LogOut, Sparkles, Trash, Edit, Save, 
  Video, FileText, File, HelpCircle, Upload, ChevronDown, ChevronRight, X, GraduationCap,
  Eye, EyeOff, UserPlus, CheckCircle, Award, BarChart, ExternalLink, Lock, Download
} from 'lucide-react';
import * as RouterDOM from 'react-router-dom';

const { useNavigate } = RouterDOM;

const AdminDashboard: React.FC = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'certificates'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  
  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Student Detail View State
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  
  // Certificate Designer State
  const [certTemplate, setCertTemplate] = useState<CertificateTemplate>({
    id: 'default',
    academyName: 'Czane Beauty Academy',
    backgroundUrl: 'https://res.cloudinary.com/dlguuk8lt/image/upload/v1740000000/certificate-bg_placeholder.jpg', // You need a real URL
    titleColor: '#D4AF37', // Gold
    textColor: '#1a1a1a',
    signatureText: 'Zanele Masondo'
  });
  const [previewCert, setPreviewCert] = useState<string>('');

  // Form Data for Course
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '', description: '', price: 0, level: 'Beginner', status: 'DRAFT', image: '', modules: []
  });

  // Form Data for Student
  const [studentForm, setStudentForm] = useState({
    displayName: '',
    email: '',
    password: '',
  });
  
  // Manual Enrollment State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) navigate('/auth');
  }, [user, loadingAuth, navigate]);

  useEffect(() => {
    if (activeTab === 'courses') loadCourses();
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'certificates') loadCertificateTemplate();
  }, [activeTab]);

  const loadCourses = async () => {
    const data = await courseService.getAll();
    setCourses(data);
  };

  const loadStudents = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      // Ensure uid is populated from doc.id if missing in data
      const studentData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, uid: doc.id } as UserProfile;
      });
      setStudents(studentData);
    } catch (e) {
      console.error("Error loading students", e);
    }
  };

  const loadCertificateTemplate = async () => {
    try {
      const docRef = doc(db, "settings", "certificateTemplate");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCertTemplate(docSnap.data() as CertificateTemplate);
      }
      // Generate initial preview
      refreshCertPreview(docSnap.exists() ? docSnap.data() as CertificateTemplate : certTemplate);
    } catch (e) {
      console.error("Error loading cert template", e);
    }
  };

  const refreshCertPreview = async (template: CertificateTemplate) => {
    const dataUrl = await generateCertificate("Jane Doe", "Advanced Nail Technology", new Date().toLocaleDateString(), template);
    setPreviewCert(dataUrl);
  };

  // --- Student & Enrollment Logic ---

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingStudentId) {
          // Edit Mode - Only updates Firestore profile, not Auth credentials
          await updateDoc(doc(db, "users", editingStudentId), {
              email: studentForm.email,
              displayName: studentForm.displayName,
          });
          alert("Student profile updated.");
      } else {
        // Create Mode
        const tempApp = initializeApp({
            apiKey: "AIzaSyCvdz992gxjt3skwWmw63pnh8D28HAf9lQ", // From firebase.ts
            authDomain: "czane-c3786.firebaseapp.com",
            projectId: "czane-c3786",
        }, "SecondaryApp");

        const tempAuth = firebaseAuth.getAuth(tempApp);
        const userCred = await firebaseAuth.createUserWithEmailAndPassword(tempAuth, studentForm.email, studentForm.password);
        
        await setDoc(doc(db, "users", userCred.user.uid), {
            uid: userCred.user.uid,
            email: studentForm.email,
            displayName: studentForm.displayName,
            createdAt: new Date().toISOString(),
            isManual: true
        });
        await firebaseAuth.signOut(tempAuth);
        alert("Student account created successfully!");
      }

      setStudentForm({ displayName: '', email: '', password: ''});
      setEditingStudentId(null);
      setIsAddingStudent(false);
      loadStudents();

    } catch (error: any) {
      console.error("Error saving student", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditStudent = (student: UserProfile) => {
      setStudentForm({
          displayName: student.displayName || '',
          email: student.email,
          password: '', // Can't retrieve password, leave blank
      });
      setEditingStudentId(student.uid);
      setIsAddingStudent(true);
  };

  const handleDeleteStudent = async (uid: string) => {
      if (!uid) {
          alert("Error: User ID is missing.");
          return;
      }
      if (!window.confirm("Are you sure? This only deletes the database record, not the login credentials.")) return;
      try {
          await deleteDoc(doc(db, "users", uid));
          alert("Student record deleted.");
          loadStudents();
      } catch (e: any) {
          if (e.code === 'permission-denied') {
             alert("Access Denied: You do not have permission to delete students.");
          } else {
             console.error(e);
             alert("Error deleting student record.");
          }
      }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
        await courseService.delete(id);
        alert("Course deleted successfully.");
        loadCourses();
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            alert("Access Denied: You do not have permission to delete courses.");
        } else {
            console.error(e);
            alert("Failed to delete course.");
        }
    }
  };

  const openStudentDetail = async (student: UserProfile) => {
    setViewingStudent(student);
    // Fetch enrollments
    const q = query(collection(db, "enrollments"), where("userId", "==", student.uid));
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Enrollment));
    setStudentEnrollments(enrollments);
  };

  const handleManualEnroll = async () => {
    if (!selectedStudentId || !selectedCourseId) return alert("Select student and course");
    
    try {
       // Check if already enrolled
       const q = query(
         collection(db, "enrollments"), 
         where("userId", "==", selectedStudentId),
         where("courseId", "==", selectedCourseId)
       );
       const existing = await getDocs(q);
       if(!existing.empty) {
         alert("Student already enrolled in this course.");
         return;
       }

       const course = courses.find(c => c.id === selectedCourseId);

       await addDoc(collection(db, "enrollments"), {
         userId: selectedStudentId,
         courseId: selectedCourseId,
         enrolledAt: new Date().toISOString(),
         progress: 0,
         completedLessons: [],
         paymentStatus: 'MANUAL_ADMIN',
         amountPaid: course?.price || 0
       });

       alert("Student successfully enrolled!");
       setEnrollModalOpen(false);
       setSelectedCourseId("");
       if (selectedStudentId) {
         // Refresh detail view if open
         const s = students.find(u => u.uid === selectedStudentId);
         if(s) openStudentDetail(s);
       }
       setSelectedStudentId(null);
    } catch (error: any) {
       if (error.code === 'permission-denied') {
          alert("Access Denied: You cannot enroll students manually.");
       } else {
          console.error(error);
          alert("Enrollment failed");
       }
    }
  };

  // --- Certificate Logic ---

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "certificateTemplate"), certTemplate);
      alert("Template saved!");
    } catch (e: any) {
      if (e.code === 'permission-denied') {
          alert("Access Denied: You cannot edit certificate templates.");
      } else {
          console.error(e);
          alert("Error saving template");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (field: keyof CertificateTemplate, value: string) => {
    const updated = { ...certTemplate, [field]: value };
    setCertTemplate(updated);
    refreshCertPreview(updated);
  };

  // --- Course Actions (Existing) ---
  const handleGenerateAI = async () => {
    if (!formData.title) return alert("Enter a title first");
    setAiLoading(true);
    const desc = await generateCourseDescription(formData.title || '', "Beauty Therapy");
    setFormData(prev => ({ ...prev, description: desc }));
    setAiLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'lesson' | 'cert', lessonIndex?: number, moduleIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      
      if (target === 'cover') {
        setFormData(prev => ({ ...prev, image: url }));
      } else if (target === 'lesson' && lessonIndex !== undefined && moduleIndex !== undefined) {
        const newModules = [...(formData.modules || [])];
        newModules[moduleIndex].lessons[lessonIndex].content = url;
        setFormData(prev => ({ ...prev, modules: newModules }));
      } else if (target === 'cert') {
        handleTemplateChange('backgroundUrl', url);
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Data Sanitization: Remove undefined values before sending to Firestore
      // "Missing or insufficient permissions" often occurs if sending 'undefined' fields in older SDKs or specific strict configs,
      // but primarily it occurs due to Firestore Rules.
      // We clean the object to be safe.
      const cleanData = JSON.parse(JSON.stringify(formData));
      
      if (formData.id) {
        await courseService.update(formData.id, cleanData);
      } else {
        await courseService.create(cleanData as Course);
      }
      setIsEditing(false);
      resetForm();
      loadCourses();
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        alert("You do not have admin permissions to perform this action.");
      } else {
        console.error(err);
        alert("Failed to save. check console for details.");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', price: 0, level: 'Beginner', status: 'DRAFT', image: '', modules: [] });
  };

  // --- Curriculum Logic Helpers (Existing) ---
  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...(prev.modules || []), { id: Date.now().toString(), title: "New Module", lessons: [] }]
    }));
  };
  const addLesson = (moduleIndex: number, type: 'video' | 'text' | 'pdf' | 'quiz' | 'exam') => {
    const newModules = [...(formData.modules || [])];
    newModules[moduleIndex].lessons.push({
      id: Date.now().toString(),
      title: `New ${type === 'exam' ? 'Final Exam' : type}`,
      type,
      content: '',
      quizData: []
    });
    setFormData(prev => ({ ...prev, modules: newModules }));
  };
  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const newModules = [...(formData.modules || [])];
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    setFormData(prev => ({ ...prev, modules: newModules }));
  };
  const generateAssessment = async (moduleIndex: number, lessonIndex: number, type: 'quiz' | 'exam') => {
    setQuizLoading(true);
    try {
        const questions = type === 'quiz' 
            ? await generateQuizQuestions(formData.title || "Beauty", "Beginner")
            : await generateExamQuestions(formData.title || "Beauty Theory", "Advanced");
        const newModules = [...(formData.modules || [])];
        newModules[moduleIndex].lessons[lessonIndex].quizData = questions;
        setFormData(prev => ({ ...prev, modules: newModules }));
    } catch (e) {
        alert("Failed to generate questions.");
    } finally {
        setQuizLoading(false);
    }
  };
  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...(formData.modules || [])];
    newModules[moduleIndex].lessons.splice(lessonIndex, 1);
    setFormData(prev => ({ ...prev, modules: newModules }));
  };
  const removeModule = (index: number) => {
    const newModules = [...(formData.modules || [])];
    newModules.splice(index, 1);
    setFormData(prev => ({ ...prev, modules: newModules }));
  };
  const toggleStatus = () => {
      setFormData(prev => ({ ...prev, status: prev.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }));
  };

  const handleLogout = () => {
      firebaseAuth.signOut(auth);
      navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-purple-900 text-white flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold text-pink-400">Czane Admin</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('courses')} className={`flex items-center w-full px-4 py-3 rounded-lg transition ${activeTab === 'courses' ? 'bg-pink-600' : 'hover:bg-purple-800'}`}>
            <BookOpen className="w-5 h-5 mr-3" /> Courses
          </button>
          <button onClick={() => setActiveTab('students')} className={`flex items-center w-full px-4 py-3 rounded-lg transition ${activeTab === 'students' ? 'bg-pink-600' : 'hover:bg-purple-800'}`}>
            <Users className="w-5 h-5 mr-3" /> Students
          </button>
          <button onClick={() => setActiveTab('certificates')} className={`flex items-center w-full px-4 py-3 rounded-lg transition ${activeTab === 'certificates' ? 'bg-pink-600' : 'hover:bg-purple-800'}`}>
            <Award className="w-5 h-5 mr-3" /> Certificates
          </button>
        </nav>
        <div className="p-4 border-t border-purple-800">
          <button onClick={handleLogout} className="flex items-center text-pink-300 hover:text-white">
            <LogOut className="w-5 h-5 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto pb-20">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {activeTab === 'courses' && 'Course Management'}
            {activeTab === 'students' && 'Student Registry'}
            {activeTab === 'certificates' && 'Certificate Designer'}
          </h1>
          {activeTab === 'courses' && !isEditing && (
            <button onClick={() => { resetForm(); setIsEditing(true); }} className="flex items-center bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition shadow-md">
              <Plus className="w-5 h-5 mr-2" /> Add Course
            </button>
          )}
          {activeTab === 'students' && (
            <button onClick={() => { setIsAddingStudent(true); setEditingStudentId(null); setStudentForm({displayName:'',email:'',password:''}); }} className="flex items-center bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition shadow-md">
              <UserPlus className="w-5 h-5 mr-2" /> Add Student
            </button>
          )}
        </header>

        {activeTab === 'courses' && (
          <>
            {isEditing ? (
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{formData.id ? 'Edit Course' : 'Create New Course'}</h3>
                  <div className="flex items-center gap-4">
                      {/* Status Toggle */}
                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full cursor-pointer" onClick={toggleStatus}>
                          <div className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${formData.status === 'DRAFT' ? 'bg-gray-400 text-white' : 'text-gray-500'}`}>Draft</div>
                          <div className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${formData.status === 'PUBLISHED' ? 'bg-green-500 text-white' : 'text-gray-500'}`}>Published</div>
                      </div>
                      <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 p-2"><X className="w-6 h-6"/></button>
                  </div>
                </div>
                
                <form onSubmit={handleSaveCourse} className="space-y-8">
                  {/* Basic Info Card */}
                  <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Course Title</label>
                      <input className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-pink-500 transition" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Advanced Nail Tech" />
                    </div>
                    <div className="col-span-2 relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea className="w-full border rounded-lg p-3 h-28 outline-none focus:ring-2 focus:ring-pink-500 transition" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Course summary..." />
                      <button type="button" onClick={handleGenerateAI} disabled={aiLoading} className="absolute bottom-3 right-3 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center hover:bg-purple-200 transition">
                        <Sparkles className="w-3 h-3 mr-1" /> {aiLoading ? 'Thinking...' : 'AI Generate'}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price (ZAR)</label>
                      <input type="number" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-pink-500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image</label>
                      <div className="flex gap-2">
                        <input type="text" className="w-full border rounded-lg p-3 text-sm text-gray-500 bg-white" value={formData.image} placeholder="Image URL..." readOnly />
                         <label className="cursor-pointer bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-lg flex items-center border border-pink-200 transition">
                           <Upload className="w-4 h-4 text-pink-600" />
                           <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" />
                         </label>
                      </div>
                      {uploading && <span className="text-xs text-blue-500 font-medium mt-1 block">Uploading image...</span>}
                    </div>
                  </div>

                  {/* Curriculum Builder (Existing code reused) */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b pb-4">
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-pink-600"/> Curriculum</h4>
                        <button type="button" onClick={addModule} className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold flex items-center shadow transition">
                          <Plus className="w-4 h-4 mr-1"/> Add Module
                        </button>
                     </div>
                     
                     {formData.modules?.map((module, mIdx) => (
                       <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                         <div className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition" onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}>
                            <div className="flex items-center gap-3">
                              {expandedModule === module.id ? <ChevronDown size={18} className="text-gray-500"/> : <ChevronRight size={18} className="text-gray-500"/>}
                              <input 
                                className="bg-transparent font-bold text-gray-800 border-none focus:ring-0 p-0 text-lg w-full" 
                                value={module.title} 
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newMods = [...(formData.modules || [])];
                                  newMods[mIdx].title = e.target.value;
                                  setFormData({...formData, modules: newMods});
                                }}
                              />
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeModule(mIdx); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition"><Trash size={18}/></button>
                         </div>
                         
                         {expandedModule === module.id && (
                           <div className="p-4 bg-white space-y-3 border-t border-gray-200">
                             {module.lessons.map((lesson, lIdx) => (
                               <div key={lesson.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-3">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-3 w-full">
                                       {lesson.type === 'video' && <Video size={18} className="text-blue-500"/>}
                                       {lesson.type === 'text' && <FileText size={18} className="text-gray-500"/>}
                                       {lesson.type === 'pdf' && <File size={18} className="text-red-500"/>}
                                       {lesson.type === 'quiz' && <HelpCircle size={18} className="text-orange-500"/>}
                                       {lesson.type === 'exam' && <GraduationCap size={18} className="text-purple-600"/>}
                                       <input 
                                          className="font-medium text-sm bg-transparent border-b border-transparent focus:border-gray-400 outline-none w-full" 
                                          value={lesson.title} 
                                          onChange={(e) => updateLesson(mIdx, lIdx, 'title', e.target.value)}
                                       />
                                     </div>
                                     <button type="button" onClick={() => removeLesson(mIdx, lIdx)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                  </div>
                                  <div className="text-sm pl-0 md:pl-8">
                                    {(lesson.type === 'video' || lesson.type === 'pdf') && (
                                       <div className="flex gap-2 items-center">
                                          <input 
                                            placeholder={lesson.type === 'video' ? "Paste Video URL" : "Paste PDF URL"} 
                                            value={lesson.content}
                                            onChange={(e) => updateLesson(mIdx, lIdx, 'content', e.target.value)}
                                            className="flex-1 border rounded p-2 text-xs bg-white"
                                          />
                                          <label className="cursor-pointer bg-gray-200 px-3 py-1.5 rounded text-xs hover:bg-gray-300 font-medium">
                                            Upload
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'lesson', lIdx, mIdx)} accept={lesson.type === 'video' ? "video/*" : "application/pdf"} />
                                          </label>
                                       </div>
                                    )}
                                    {lesson.type === 'text' && (
                                       <textarea 
                                          placeholder="Enter lesson text content (Markdown supported)..." 
                                          className="w-full border rounded p-2 text-xs h-24 bg-white"
                                          value={lesson.content}
                                          onChange={(e) => updateLesson(mIdx, lIdx, 'content', e.target.value)}
                                       />
                                    )}
                                    {(lesson.type === 'quiz' || lesson.type === 'exam') && (
                                       <QuizBuilder 
                                            questions={lesson.quizData || []}
                                            onChange={(newQs) => updateLesson(mIdx, lIdx, 'quizData', newQs)}
                                            onGenerate={() => generateAssessment(mIdx, lIdx, lesson.type as 'quiz' | 'exam')}
                                            aiLoading={quizLoading}
                                            type={lesson.type as 'quiz' | 'exam'}
                                       />
                                    )}
                                  </div>
                               </div>
                             ))}
                             <div className="flex flex-wrap gap-2 justify-center pt-2">
                                <button type="button" onClick={() => addLesson(mIdx, 'text')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full flex gap-1 items-center transition"><FileText size={14}/> Text</button>
                                <button type="button" onClick={() => addLesson(mIdx, 'video')} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full flex gap-1 items-center transition"><Video size={14}/> Video</button>
                                <button type="button" onClick={() => addLesson(mIdx, 'pdf')} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-full flex gap-1 items-center transition"><File size={14}/> PDF</button>
                                <button type="button" onClick={() => addLesson(mIdx, 'quiz')} className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full flex gap-1 items-center transition"><HelpCircle size={14}/> Quiz</button>
                                <button type="button" onClick={() => addLesson(mIdx, 'exam')} className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex gap-1 items-center transition border border-purple-200"><GraduationCap size={14}/> Exam</button>
                             </div>
                           </div>
                         )}
                       </div>
                     ))}
                  </div>

                  <button type="submit" disabled={saving} className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl hover:bg-pink-700 transition flex justify-center items-center shadow-lg text-lg">
                    {saving ? <span className="animate-spin mr-2">⏳</span> : <Save className="w-5 h-5 mr-2" />}
                    Save Course
                  </button>
                </form>
              </div>
            ) : (
              // Course List View (Existing)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition p-5 border border-gray-100 flex flex-col h-full group">
                    <div className="h-44 bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                      <img src={course.image || 'https://via.placeholder.com/300'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-3 right-3 flex gap-2">
                         <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${course.status === 'PUBLISHED' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {course.status === 'PUBLISHED' ? <Eye size={12} className="inline mr-1"/> : <EyeOff size={12} className="inline mr-1"/>}
                            {course.status}
                         </span>
                      </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">{course.title}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                      <div className="text-lg font-bold text-pink-600">R{course.price}</div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setFormData(course); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition cursor-pointer relative z-10" title="Edit"><Edit className="w-5 h-5 pointer-events-none" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer relative z-10" title="Delete"><Trash className="w-5 h-5 pointer-events-none" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Registered Students</h3>
                <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{students.length} Total</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Joined</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                    <tr key={student.uid} className="hover:bg-pink-50/30 transition cursor-pointer" onClick={() => openStudentDetail(student)}>
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {student.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {student.displayName || 'Unnamed User'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{student.email}</td>
                        <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }} 
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition cursor-pointer relative z-10"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 pointer-events-none"/>
                          </button>
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.uid); }} 
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition cursor-pointer relative z-10"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4 pointer-events-none"/>
                          </button>
                          <button 
                            onClick={() => { setSelectedStudentId(student.uid); setEnrollModalOpen(true); }} 
                            className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-full font-bold transition flex items-center cursor-pointer relative z-10"
                          >
                            Enroll
                          </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
             </div>
           </div>
        )}

        {/* --- CERTIFICATES TAB --- */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-pink-500"/> Customize Template
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Academy Name</label>
                    <input className="w-full border rounded-lg p-3" value={certTemplate.academyName} onChange={e => handleTemplateChange('academyName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Signature Name</label>
                    <input className="w-full border rounded-lg p-3" value={certTemplate.signatureText} onChange={e => handleTemplateChange('signatureText', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Title Color</label>
                       <input type="color" className="w-full h-10 rounded cursor-pointer" value={certTemplate.titleColor} onChange={e => handleTemplateChange('titleColor', e.target.value)} />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Text Color</label>
                       <input type="color" className="w-full h-10 rounded cursor-pointer" value={certTemplate.textColor} onChange={e => handleTemplateChange('textColor', e.target.value)} />
                     </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Background Image</label>
                      <div className="flex gap-2">
                        <input className="w-full border rounded-lg p-3 text-xs" value={certTemplate.backgroundUrl} readOnly />
                        <label className="cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center">
                           <Upload className="w-4 h-4" />
                           <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'cert')} accept="image/*" />
                        </label>
                      </div>
                  </div>
                  <button onClick={handleSaveTemplate} disabled={saving} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 mt-4">
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
               <div className="flex justify-between w-full mb-4 items-center">
                   <h4 className="text-white text-sm font-bold uppercase tracking-widest">Live Preview</h4>
                   {previewCert && (
                       <a 
                          href={previewCert} 
                          download="certificate-template-preview.png"
                          className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded flex items-center transition"
                       >
                           <Download className="w-3 h-3 mr-1"/> Download Preview
                       </a>
                   )}
               </div>
               
               {previewCert ? (
                 <img src={previewCert} alt="Certificate Preview" className="w-full h-auto shadow-2xl rounded bg-white border-4 border-white" />
               ) : (
                 <div className="text-white">Loading preview...</div>
               )}
            </div>
          </div>
        )}

        {/* --- MODALS --- */}

        {/* Add/Edit Student Modal */}
        {isAddingStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold">{editingStudentId ? 'Edit Student Profile' : 'Register New Student'}</h3>
                   <button onClick={() => { setIsAddingStudent(false); setEditingStudentId(null); }} className="text-gray-400 hover:text-gray-600"><X/></button>
                </div>
                <form onSubmit={handleSaveStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Full Name</label>
                    <input className="w-full border rounded-lg p-3" value={studentForm.displayName} onChange={e => setStudentForm({...studentForm, displayName: e.target.value})} required placeholder="Student Name"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Email</label>
                    <input className="w-full border rounded-lg p-3" type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required placeholder="student@example.com"/>
                  </div>
                  {!editingStudentId && (
                    <div>
                        <label className="block text-sm font-bold mb-1">Create Password</label>
                        <div className="relative">
                            <input className="w-full border rounded-lg p-3" type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required placeholder="********"/>
                            <Lock className="absolute right-3 top-3.5 w-4 h-4 text-gray-400"/>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Student will use this to login.</p>
                    </div>
                  )}
                  {/* Removed Role Selector as role management requires backend admin SDK */}
                  <button type="submit" disabled={saving} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700">
                    {saving ? 'Saving...' : (editingStudentId ? 'Update Profile' : 'Create Account')}
                  </button>
                </form>
             </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {viewingStudent && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                    <div className="bg-purple-900 text-white p-6 sticky top-0 z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold font-serif">{viewingStudent.displayName}</h2>
                            <p className="text-purple-200 text-sm">{viewingStudent.email}</p>
                            <span className="inline-block mt-2 bg-purple-800 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                                Joined: {new Date(viewingStudent.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <button onClick={() => setViewingStudent(null)} className="text-purple-300 hover:text-white"><X size={24}/></button>
                    </div>
                    
                    <div className="p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg"><BookOpen className="w-5 h-5 mr-2 text-pink-600"/> Enrolled Courses & Progress</h3>
                        
                        <div className="space-y-6">
                            {studentEnrollments.length === 0 ? (
                                <p className="text-gray-500 italic">No active enrollments.</p>
                            ) : (
                                studentEnrollments.map(enrol => {
                                    const course = courses.find(c => c.id === enrol.courseId);
                                    if(!course) return null;
                                    
                                    // Calculate Stats
                                    const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
                                    const completedCount = enrol.completedLessons?.length || 0;
                                    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                                    
                                    return (
                                        <div key={enrol.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-bold text-lg text-gray-800">{course.title}</h4>
                                                {enrol.certificateIssued && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><Award className="w-3 h-3 mr-1"/> Certified</span>}
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{progressPercent}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-pink-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                                                </div>
                                            </div>

                                            {/* Activities/Quizzes */}
                                            {enrol.quizResults && Object.keys(enrol.quizResults).length > 0 && (
                                                <div className="mt-4 border-t border-gray-200 pt-3">
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Quiz Results</h5>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(enrol.quizResults).map(([lessonId, val]) => {
                                                            const result = val as QuizResult;
                                                            // Find lesson title (expensive lookup but okay for admin view)
                                                            let lessonTitle = lessonId;
                                                            course.modules.forEach(m => m.lessons.forEach(l => { if(l.id === lessonId) lessonTitle = l.title }));
                                                            
                                                            return (
                                                                <div key={lessonId} className={`p-2 rounded border text-xs flex justify-between ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                                    <span className="truncate w-3/4 font-medium">{lessonTitle}</span>
                                                                    <span className="font-bold">{result.score}/{result.totalQuestions}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Manual Enroll Modal (Reuse existing logic) */}
        {enrollModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold">Manual Enrollment</h3>
                   <button onClick={() => setEnrollModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X/></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Select Course to Unlock</label>
                    <select className="w-full border rounded-lg p-3" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} (R{c.price})</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleManualEnroll} 
                    disabled={!selectedCourseId}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2"/> Enroll Student
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">Use this for cash payments or scholarship grants.</p>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;