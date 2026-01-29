import React, { useState } from 'react';
import * as firebaseAuth from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as RouterDOM from 'react-router-dom';
import { Lock, Mail, ArrowRight, User as UserIcon, Loader2 } from 'lucide-react';
import { checkAdminClaim } from '../services/authService';

const { useNavigate } = RouterDOM;

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let user;
      
      if (isLogin) {
        // 1. Sign In
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } else {
        // 1. Register
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // 2. Update Profile Display Name
        await firebaseAuth.updateProfile(user, { displayName: name });

        // 3. Create User Document
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date().toISOString()
        });
      }
      
      // 4. Check Claims & Redirect
      // We explicitly check the claim here to decide the immediate route.
      // New registrations usually won't have the claim yet unless a Cloud Function runs instantly,
      // so they default to student dashboard.
      const isAdmin = await checkAdminClaim(user);

      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-serif font-bold text-purple-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Join Academy'}
          </h2>
          <p className="text-gray-500">
            {isLogin ? 'Sign in to access your dashboard' : 'Start your beauty journey today'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-gray-50 transition"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-gray-50 transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-gray-50 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] transition-transform duration-200 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 w-4 h-4" />
                </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-pink-600 hover:text-pink-800 font-semibold"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};