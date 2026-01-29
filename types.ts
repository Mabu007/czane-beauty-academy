export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[]; // Used for multiple-choice
  correctAnswer: number | string; // Index for MC, Text string for Short Answer (Model Answer)
}

export interface QuizResult {
  lessonId: string;
  score: number;
  totalQuestions: number;
  dateTaken: string;
  passed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'quiz' | 'exam';
  content?: string; // URL for video/pdf, or Markdown text
  quizData?: QuizQuestion[];
  duration?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  image: string;
  status: 'DRAFT' | 'PUBLISHED';
  modules: Module[]; 
  createdAt?: any;
  category?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: any;
  progress: number;
  completedLessons: string[]; // Array of lesson IDs
  quizResults?: Record<string, QuizResult>; // Map lessonId to result
  certificateIssued?: boolean;
  paymentStatus: 'PAID' | 'MANUAL_ADMIN';
  amountPaid?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'student';
  displayName?: string;
  createdAt: any;
  isManual?: boolean;
}

export interface CertificateTemplate {
  id: string;
  backgroundUrl: string;
  titleColor: string;
  textColor: string;
  signatureText: string;
  academyName: string;
  logoUrl?: string;
}