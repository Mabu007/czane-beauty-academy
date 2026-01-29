import React from 'react';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import * as RouterDOM from 'react-router-dom';

const { useLocation } = RouterDOM;

export const Footer: React.FC = () => {
  const location = useLocation();

  // Don't show Footer on Admin Dashboard
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-brand-dark text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div>
            <h3 className="text-2xl font-serif text-brand-gold mb-4">CZANE BEAUTY</h3>
            <p className="text-sm leading-relaxed mb-4">
              "Beauty is Enhancement. Master your craft with us."
              <br/>
              Serving with love, pride, consistency, and integrity since 2019.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-brand-gold mr-3 mt-1" />
                <p>108-109 Kubeka Street,<br/>Vosloorus</p>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-brand-gold mr-3" />
                <p>079 305 7899 / 079 843 3526</p>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-brand-gold mr-3" />
                <p>czane5506@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/#/courses" className="hover:text-brand-gold transition">Academy Courses</a></li>
              <li><a href="/#/spa" className="hover:text-brand-gold transition">Kids Spa Party</a></li>
              <li><a href="/#/login" className="hover:text-brand-gold transition">Student Portal</a></li>
            </ul>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-brand-gold"><Instagram /></a>
              <a href="#" className="text-gray-400 hover:text-brand-gold"><Facebook /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Czane Beauty and Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};