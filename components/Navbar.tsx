import React, { useState, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import { Menu, X, User, LayoutDashboard, LogOut, BookOpen } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { getIsAdmin } from '../services/authService';

const { Link, useLocation, useNavigate } = RouterDOM;

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
        const adminStatus = await getIsAdmin(user);
        setIsAdmin(adminStatus);
    };
    checkStatus();
  }, [user]);

  // Don't show Navbar on Admin Dashboard or Student Dashboard (they have their own headers)
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/student')) return null;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Academy Courses', path: '/#courses' },
    { name: 'Kids Spa', path: '/spa' },
  ];

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    
    if (path === '/#courses') {
      if (location.pathname === '/') {
        // Already on home, just scroll
        const element = document.getElementById('courses');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate home with instruction to scroll
        navigate('/', { state: { scrollTo: 'courses' } });
      }
    } else {
      // Standard navigation
      navigate(path);
      window.scrollTo(0, 0); // Reset scroll for new pages
    }
  };

  const isTransparent = location.pathname === '/';
  
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'My Dashboard';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isTransparent ? 'bg-black/80 backdrop-blur-sm text-white' : 'bg-white text-gray-900 shadow-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2" onClick={() => window.scrollTo(0,0)}>
            <span className={`text-2xl font-serif font-bold tracking-wider ${isTransparent ? 'text-pink-500' : 'text-purple-800'}`}>CZANE</span>
            <span className="text-xs tracking-widest uppercase border-l pl-2 border-current opacity-70">Beauty &<br/>Academy</span>
          </Link>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-3 py-2 text-sm font-bold uppercase tracking-wide hover:text-pink-500 transition-colors bg-transparent border-none cursor-pointer`}
                >
                  {link.name}
                </button>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to={dashboardPath} className="px-4 py-2 bg-pink-600 text-white rounded-full font-bold hover:bg-pink-700 transition flex items-center text-sm">
                    {isAdmin ? <LayoutDashboard className="w-4 h-4 mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
                    {dashboardLabel}
                  </Link>
                </div>
              ) : (
                <Link to="/auth" className={`px-6 py-2 border-2 rounded-full font-bold hover:bg-pink-600 hover:border-pink-600 hover:text-white transition ${isTransparent ? 'border-white' : 'border-purple-800 text-purple-800'}`}>
                   Portal Login
                </Link>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-gray-700 hover:text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 text-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path)}
                className="block px-3 py-2 text-base font-bold hover:text-pink-500 w-full text-left bg-transparent border-none cursor-pointer text-white"
              >
                {link.name}
              </button>
            ))}
             {user ? (
                <Link to={dashboardPath} className="block px-3 py-2 text-pink-400 font-bold" onClick={() => setIsOpen(false)}>{dashboardLabel}</Link>
              ) : (
                <Link to="/auth" className="block px-3 py-2 text-pink-400 font-bold" onClick={() => setIsOpen(false)}>Login</Link>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};