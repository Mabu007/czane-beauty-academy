import React, { useEffect, useState } from 'react';
import * as RouterDOM from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import LandingPage from './pages/LandingPage';
import { Spa } from './pages/Spa';
import { AuthPage } from './pages/AuthPage';
import AdminDashboard from './pages/admin/Dashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseDetails } from './pages/CourseDetails';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { checkAdminClaim } from './services/authService';
import { Loader2 } from 'lucide-react';

const { HashRouter, Routes, Route, Navigate } = RouterDOM;

// Basic route protection for any logged-in user
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  
  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
             <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
        </div>
      );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  
  return children;
};

// Strict route protection for Admins using Custom Claims
// This guard prevents the race condition where a logged-in admin is treated as a student
// because the claims hadn't loaded yet.
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [user, authLoading] = useAuthState(auth);
  // null = state unknown/loading, false = not admin, true = admin
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Wait for Firebase Auth to initialize
    if (authLoading) return;

    // 2. If no user, deny access immediately
    if (!user) {
      setIsAuthorized(false);
      return;
    }

    // 3. Check for 'admin' claim by forcing a token refresh
    // We cannot rely on cached tokens as permissions might have changed
    const verifyAdmin = async () => {
      const isAdmin = await checkAdminClaim(user);
      setIsAuthorized(isAdmin);
    };

    verifyAdmin();
  }, [user, authLoading]);

  // Show loading while auth initializes OR while verifying claims
  if (authLoading || isAuthorized === null) {
    return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
             <Loader2 className="animate-spin text-purple-600 w-10 h-10" />
             <p className="text-gray-500 font-bold">Verifying Permissions...</p>
        </div>
    );
  }
  
  // If verification failed
  if (!isAuthorized) {
      // If user is logged in but not admin, send to student dashboard
      if (user) return <Navigate to="/student/dashboard" replace />;
      // If not logged in, send to auth
      return <Navigate to="/auth" replace />;
  }
  
  // Access Granted
  return children;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route path="/spa" element={<Spa />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Redirect legacy login path */}
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/payment/:courseId" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
             {/* Redirect legacy admin path */}
             <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route 
              path="/student/dashboard" 
              element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;