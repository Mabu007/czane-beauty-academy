import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Star, MapPin, Phone, Mail,
  Instagram, Facebook, Crown, Heart, ShieldCheck, Trophy, Users, Award, Loader2
} from 'lucide-react';

import { Course } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// --- Sub-components to keep the main render clean ---

const SectionHeader: React.FC<{ tag: string; title: string; light?: boolean }> = ({ tag, title, light }) => (
  <div className="text-center mb-16">
    <span className={`${light ? 'text-pink-400' : 'text-pink-600'} font-bold uppercase text-sm tracking-wider`}>
      {tag}
    </span>
    <h2 className={`text-4xl font-bold mt-2 font-serif ${light ? 'text-white' : 'text-purple-800'}`}>
      {title}
    </h2>
  </div>
);

// Loading spinner component for courses section
const CoursesLoading: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-20">
    <Loader2 className="w-12 h-12 text-pink-600 animate-spin mb-4" />
    <p className="text-gray-600 font-medium">Loading courses...</p>
  </div>
);

const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const location = useLocation() as any;

  useEffect(() => {
    // Check if we need to scroll to a specific section on load
    if (location.state && location.state.scrollTo) {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
            // Small timeout to ensure DOM is fully rendered
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            // Clean up state so it doesn't persist on refresh in a weird way
            window.history.replaceState({}, document.title);
        }
    }
  }, [location]);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        // Fetch only PUBLISHED courses
        const q = query(collection(db, 'courses'), where('status', '==', 'PUBLISHED'));
        const snapshot = await getDocs(q);
        if (isMounted) {
          setCourses(snapshot.docs.map(doc => ({ ...(doc.data() as Course), id: doc.id })));
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="bg-gray-50">
      {/* 1. HERO SECTION - Renders Immediately */}
      <section className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://res.cloudinary.com/dlguuk8lt/image/upload/v1753627454/background_images_yp2j4j.jpg')" }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif tracking-tight drop-shadow-lg">
            CZANE BEAUTY AND ACADEMY
          </h1>
          <p className="text-xl md:text-2xl text-pink-200 mb-10 drop-shadow-md">
            Beauty is Enhancement. Master your craft with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })} 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg cursor-pointer"
            >
              Explore Courses <ArrowRight size={20} />
            </button>
            <Link to="/auth" className="bg-white text-pink-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
              Student Portal
            </Link>
          </div>
          <div className="mt-6 text-sm text-gray-300">
            <Link to="/admin/dashboard" className="hover:text-pink-400 underline flex items-center justify-center gap-1">
               <ShieldCheck size={14} /> Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 2. COURSES SECTION - Shows loading state only in this section */}
      <section id="courses" className="py-20 container mx-auto px-6">
        <SectionHeader tag="Level Up Your Skills" title="Accredited Courses" />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            // Show loading spinner while fetching
            <CoursesLoading />
          ) : courses.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl shadow p-8">
                No courses are currently open for enrollment. Please check back soon!
            </p>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow group">
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={course.image || 'https://via.placeholder.com/300'} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                    loading="lazy" 
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-purple-700 shadow-sm">
                    {course.level}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{course.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="text-pink-600 font-bold text-2xl mb-4">R{course.price}</div>
                    <Link to={`/course/${course.id}`} className="block w-full text-center bg-gray-900 text-white py-3 rounded-lg hover:bg-pink-600 transition font-bold">
                      View Details & Enroll
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. KIDS SPA SECTION */}
      <section id="services" className="bg-gradient-to-br from-pink-50 to-purple-50 py-20">
        <div className="container mx-auto px-6">
          <SectionHeader tag="Pamper The Little Ones" title="Kids Spa Packages" />
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 relative min-h-[300px]">
              <img src="https://res.cloudinary.com/dlguuk8lt/image/upload/v1753967910/WhatsApp_Image_2025-07-31_at_2.52.25_PM_1_ldklz0.jpg" alt="Kids Spa" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-pink-500/10" />
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-pink-600 font-serif">Kids Spa Party</h3>
                <div className="bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-full">R200 <span className="text-xs font-normal">/ child</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: <Crown size={20} className="text-yellow-400"/>, text: "Kids Spa 1-4 Options Available" },
                  { icon: <Heart size={20} className="text-pink-400"/>, text: "Mani & Pedi with Massage" },
                  { icon: <Star size={20} className="text-purple-400"/>, text: "Kids Facial and Make-up" },
                  { icon: <CheckCircle size={20} className="text-green-400"/>, text: "Drink with Hot Dogs Included" }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">{item.icon}<span>{item.text}</span></li>
                ))}
              </ul>
              <Link to="/spa" className="block w-full text-center bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition shadow-lg">View All Packages</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT SECTION */}
      <section id="about" className="py-20 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:w-1/2 lg:sticky lg:top-24">
            <div className="relative">
              <img src="https://res.cloudinary.com/dlguuk8lt/image/upload/v1753627457/team2_kkg0lf.jpg" alt="Team" className="rounded-3xl shadow-2xl w-full object-cover" />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs border-l-4 border-pink-500 hidden md:block">
                <p className="font-serif italic text-gray-700">"We serve with love, pride, and consistency, always putting our students first."</p>
                <p className="text-sm font-bold text-pink-600 mt-2">- Zanele Masondo</p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <SectionHeader tag="Who We Are" title="About CZANE ACADEMY" />
            <p className="text-gray-600 leading-relaxed">
              CZANE BEAUTY AND ACADEMY is dedicated to empowering individuals with comprehensive beauty skills. 
              Our academy, based in Vosloorus, began its journey in 2019, proudly owned by <span className="font-bold text-gray-800">Zanele Masondo</span>.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-xl font-bold text-purple-800 mb-3 font-serif">Our Vision</h3>
                <p className="text-gray-600 text-sm">To be a leading academy where every student receives outstanding education and unwavering support.</p>
              </div>
              <div className="bg-pink-50 p-6 rounded-xl border border-pink-100">
                <h3 className="text-xl font-bold text-pink-800 mb-3 font-serif">Our Mission</h3>
                <p className="text-gray-600 text-sm">To serve with integrity and maintain affordability for aspiring professionals.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT SECTION */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <SectionHeader tag="Get In Touch" title="Contact Us" light />
              <div className="space-y-6">
                <ContactInfo icon={<MapPin className="text-pink-500" />} title="Our Location" desc="108-109 Kubeka Street, Vosloorus" />
                <ContactInfo icon={<Mail className="text-pink-500" />} title="Email Us" desc="czane5506@gmail.com" />
                <ContactInfo icon={<Phone className="text-pink-500" />} title="Call Us" desc="079 305 7899 / 079 843 3526" />
              </div>
            </div>
            <div className="bg-white text-gray-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 font-serif text-purple-800">Send a Message</h3>
              <form className="space-y-4">
                <Input label="Your Name" placeholder="John Doe" />
                <Input label="Email Address" type="email" placeholder="john@example.com" />
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                  <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="I'm interested in..." />
                </div>
                <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform active:scale-95">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Small Helper Components for the Form/Contact ---

const ContactInfo: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4">
    <div className="bg-gray-800 p-3 rounded-lg">{icon}</div>
    <div>
      <h4 className="font-bold text-lg">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </div>
  </div>
);

const Input: React.FC<{ label: string; type?: string; placeholder: string }> = ({ label, type = "text", placeholder }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
    <input type={type} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none" placeholder={placeholder} />
  </div>
);

export default LandingPage;