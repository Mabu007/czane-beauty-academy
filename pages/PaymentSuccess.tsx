import React, { useEffect, useState } from 'react';
import * as RouterDOM from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle, Loader2 } from 'lucide-react';

const { useSearchParams, Link } = RouterDOM;

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [user] = useAuthState(auth);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const enrollUser = async () => {
      if (!user || !courseId) return;

      try {
        // Check if already enrolled to prevent duplicates on refresh
        const q = query(
          collection(db, 'enrollments'),
          where('userId', '==', user.uid),
          where('courseId', '==', courseId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Create Enrollment Record
          await addDoc(collection(db, 'enrollments'), {
            userId: user.uid,
            courseId: courseId,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            completedLessons: [],
            paymentStatus: 'PAID',
            paymentMethod: 'PAYFAST'
          });
        }
        setStatus('success');
      } catch (error) {
        console.error("Enrollment error:", error);
        setStatus('error');
      }
    };

    if (user && courseId) {
      enrollUser();
    }
  }, [user, courseId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-pink-600 animate-spin mx-auto mb-4"/>
            <h2 className="text-xl font-bold">Verifying Payment...</h2>
            <p className="text-gray-500">Please wait while we confirm your enrollment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600"/>
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">You have been successfully enrolled in the course. Welcome to the academy!</p>
            <Link to={`/course/${courseId}`} className="block w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition">
              Start Learning Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
             <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
             <p className="text-gray-500 mb-4">We received your payment but couldn't enroll you automatically.</p>
             <p className="text-sm text-gray-400">Please contact support with your email.</p>
             <Link to="/" className="mt-4 inline-block text-pink-600 font-bold">Go Home</Link>
          </>
        )}
      </div>
    </div>
  );
};