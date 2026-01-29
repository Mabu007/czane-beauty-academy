import React, { useState } from 'react';
import * as firebaseAuth from 'firebase/auth';
import { auth } from '../firebase';
import * as RouterDOM from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const { useNavigate } = RouterDOM;

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      // For simplicity in this demo, redirect to admin if specific email, else home
      if (email.includes('admin') || email.includes('czane')) {
          navigate('/admin');
      } else {
          navigate('/courses');
      }
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to access your portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
            <p>For demo purposes, use existing credentials or setup Auth in Firebase console.</p>
        </div>
      </div>
    </div>
  );
};