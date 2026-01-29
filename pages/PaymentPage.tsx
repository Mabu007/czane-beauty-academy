import React, { useEffect, useState } from 'react';
import * as RouterDOM from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { Course } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { payfastConfig } from '../services/payfastService';

const { useParams, Navigate } = RouterDOM;

export const PaymentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [user, loadingAuth] = useAuthState(auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const docRef = doc(db, "courses", courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loadingAuth || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;
  if (!user) return <Navigate to={`/auth?redirect=/payment/${courseId}`} />;
  if (!course) return <div className="text-center p-10">Course not found</div>;

  // Construct URLs (Assuming locally served or deployed url)
  const baseUrl = window.location.origin;
  const returnUrl = `${baseUrl}/#/payment/success?courseId=${course.id}`;
  const cancelUrl = `${baseUrl}/#/course/${course.id}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-900 text-white p-6 text-center">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-green-400"/>
            <h2 className="text-xl font-bold">Secure Checkout</h2>
            <p className="text-sm text-gray-400">Powered by PayFast</p>
        </div>
        
        <div className="p-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Order Summary</h3>
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900">{course.title}</h1>
                    <p className="text-sm text-gray-500">{course.level} Level</p>
                </div>
                <div className="text-2xl font-bold text-pink-600">R{course.price}</div>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Payer Details</label>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 border border-gray-200">
                    <p><span className="font-bold">Name:</span> {user.displayName || 'Student'}</p>
                    <p><span className="font-bold">Email:</span> {user.email}</p>
                </div>
            </div>

            <form action={payfastConfig.url} method="post">
                <input type="hidden" name="merchant_id" value={payfastConfig.merchantId} />
                <input type="hidden" name="merchant_key" value={payfastConfig.merchantKey} />
                <input type="hidden" name="amount" value={course.price.toFixed(2)} />
                <input type="hidden" name="item_name" value={course.title} />
                <input type="hidden" name="return_url" value={returnUrl} />
                <input type="hidden" name="cancel_url" value={cancelUrl} />
                <input type="hidden" name="email_address" value={user.email || ""} />
                <input type="hidden" name="name_first" value={user.displayName || ""} />
                
                <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-700 text-white font-bold py-4 rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 flex justify-center items-center">
                    Proceed to Payment <ArrowRight className="ml-2 w-5 h-5"/>
                </button>
            </form>
            
            <div className="mt-4 flex items-center justify-center text-xs text-gray-400">
                <Lock className="w-3 h-3 mr-1"/> SSL Encrypted Transaction
            </div>
        </div>
      </div>
    </div>
  );
};