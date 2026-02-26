import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Star, MapPin, Phone, Mail,
  Instagram, Facebook, Crown, Heart, ShieldCheck, Trophy, Users, Award, Loader2, Sparkles, Quote,
  BookOpen
} from 'lucide-react';

import { Course } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// --- Sub-components to keep the main render clean ---

const SectionHeader: React.FC<{ tag: string; title: string; light?: boolean; center?: boolean }> = ({ tag, title, light, center = true }) => (
  <div className={`${center ? 'text-center' : 'text-left'} mb-16`}>
    <span className={`${light ? 'text-pink-400' : 'text-pink-600'} font-bold uppercase text-sm tracking-wider flex items-center ${center ? 'justify-center' : 'justify-start'} gap-2`}>
      <Sparkles className="w-4 h-4" /> {tag}
    </span>
    <h2 className={`text-4xl md:text-5xl font-bold mt-3 font-serif ${light ? 'text-white' : 'text-purple-900'}`}>
      {title}
    </h2>
    <div className={`h-1 w-24 bg-gradient-to-r from-pink-500 to-purple-600 mt-6 ${center ? 'mx-auto' : ''} rounded-full`}></div>
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
    <div className="bg-gray-50 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('https://res.cloudinary.com/dlguuk8lt/image/upload/v1753627454/background_images_yp2j4j.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-purple-900/90" />
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-32 md:py-48">
          <div className="inline-block animate-bounce mb-6">
             <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg">
                Welcome to Excellence
             </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 font-serif tracking-tight drop-shadow-2xl leading-tight">
            CZANE BEAUTY <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">AND ACADEMY</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Dedicated to empowering individuals with comprehensive beauty skills. 
            Join a community where passion meets profession.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })} 
                className="group bg-gradient-to-r from-pink-600 to-purple-600 text-white px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:shadow-pink-500/50 hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Explore Courses <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <Link to="/auth" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white hover:text-purple-900 transition-all shadow-lg">
              Student Portal
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
             <StatItem number="2019" label="Established" />
             <StatItem number="500+" label="Graduates" />
             <StatItem number="100%" label="Accredited" />
             <StatItem number="4.9" label="Student Rating" />
          </div>
        </div>
      </section>

      {/* 2. FEATURES / WHY CHOOSE US */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
           <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={<Award className="w-10 h-10 text-pink-600"/>}
                title="Accredited Certification"
                desc="Receive recognized qualifications that open doors to top salons and spas worldwide."
              />
              <FeatureCard 
                icon={<Users className="w-10 h-10 text-purple-600"/>}
                title="Expert Mentorship"
                desc="Learn directly from industry veterans who are passionate about your success."
              />
              <FeatureCard 
                icon={<Trophy className="w-10 h-10 text-yellow-500"/>}
                title="Practical Training"
                desc="Hands-on experience with premium products to ensure you are job-ready."
              />
           </div>
        </div>
      </section>

      {/* 3. ABOUT SECTION - EXTENDED */}
      <section id="about" className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-[2rem] rotate-6 group-hover:rotate-3 transition-transform duration-500 opacity-20"></div>
                <img 
                    src="https://res.cloudinary.com/dlguuk8lt/image/upload/v1753627457/team2_kkg0lf.jpg" 
                    alt="Czane Team" 
                    className="relative rounded-[2rem] shadow-2xl w-full object-cover aspect-[4/5] transform transition duration-500 group-hover:scale-[1.01]" 
                />
                <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-2xl shadow-xl max-w-sm border-t-4 border-pink-500 hidden md:block">
                  <Quote className="text-pink-300 w-10 h-10 mb-2" />
                  <p className="font-serif italic text-gray-700 text-lg mb-4">"We serve with love, pride, and consistency, always putting our students first."</p>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        {/* Placeholder for founder image if available, else generic */}
                        <img src="https://ui-avatars.com/api/?name=Zanele+Masondo&background=random" alt="Zanele" />
                     </div>
                     <div>
                        <p className="font-bold text-gray-900">Zanele Masondo</p>
                        <p className="text-xs text-pink-600 uppercase font-bold tracking-wide">Founder & Owner</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-8">
              <SectionHeader tag="Our Story" title="A Legacy of Beauty & Excellence" center={false} />
              
              <div className="prose prose-lg text-gray-600">
                <p className="text-xl font-medium text-gray-900 leading-relaxed">
                  CZANE BEAUTY AND ACADEMY is dedicated to empowering individuals with comprehensive beauty skills.
                </p>
                <p>
                  Our academy, based in <span className="text-pink-600 font-bold">Vosloorus</span>, began its journey in 2019, proudly owned by <span className="text-purple-700 font-bold">Zanele Masondo</span>. What started as a passion for beauty has grown into a beacon of hope and skill development for the community.
                </p>
                <p>
                  We believe that beauty is more than just skin deep—it's a career, a science, and an art form. Our curriculum is designed to take you from novice to professional, ensuring you leave with not just a certificate, but the confidence to start your own business or work in top-tier establishments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                 <div className="flex items-start gap-4">
                    <div className="bg-pink-100 p-3 rounded-lg text-pink-600"><Crown size={24}/></div>
                    <div>
                        <h4 className="font-bold text-gray-900">Premium Quality</h4>
                        <p className="text-sm text-gray-500">We use only the best international brands for training.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Heart size={24}/></div>
                    <div>
                        <h4 className="font-bold text-gray-900">Student Support</h4>
                        <p className="text-sm text-gray-500">Lifetime mentorship and business guidance post-graduation.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COURSES SECTION */}
      <section id="courses" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <SectionHeader tag="Start Your Career" title="Featured Courses" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              <CoursesLoading />
            ) : courses.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                  <h3 className="text-xl font-bold text-gray-800">Enrollment Closed</h3>
                  <p className="text-gray-500 mt-2">No courses are currently open. Please check back soon!</p>
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group border border-gray-100 overflow-hidden">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={course.image || 'https://via.placeholder.com/300'} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-purple-700 shadow-sm uppercase tracking-wide">
                      {course.level}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition">{course.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">R{course.price}</div>
                      <Link to={`/course/${course.id}`} className="bg-gray-900 text-white p-3 rounded-full hover:bg-pink-600 transition shadow-lg transform group-hover:rotate-45">
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. KIDS SPA SECTION */}
      <section id="services" className="py-24 bg-gradient-to-br from-pink-50 via-white to-purple-50 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">
             {/* Decorative blob */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

            <div className="lg:w-1/2 relative min-h-[400px]">
              <img src="https://res.cloudinary.com/dlguuk8lt/image/upload/v1753967910/WhatsApp_Image_2025-07-31_at_2.52.25_PM_1_ldklz0.jpg" alt="Kids Spa" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-900/40 to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                 <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2 inline-block">Popular</span>
                 <h3 className="text-4xl font-serif font-bold">Little Princess<br/>Pamper Parties</h3>
              </div>
            </div>
            
            <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative z-10">
              <SectionHeader tag="For The Little Ones" title="Kids Spa Packages" center={false} />
              
              <p className="text-gray-600 mb-8 text-lg">
                Create magical memories with our specialized spa parties. Safe, fun, and designed specifically for children.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                {[
                  { icon: <Crown className="text-yellow-500"/>, text: "Princess Packages" },
                  { icon: <Heart className="text-pink-500"/>, text: "Safe Cosmetics" },
                  { icon: <Star className="text-purple-500"/>, text: "Fun Activities" },
                  { icon: <CheckCircle className="text-green-500"/>, text: "Catering Included" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    {item.icon}
                    <span className="font-bold text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-6">
                  <div className="text-3xl font-bold text-pink-600">R200 <span className="text-sm text-gray-400 font-normal">/ child</span></div>
                  <Link to="/spa" className="flex-1 bg-gray-900 text-white text-center font-bold py-4 rounded-xl hover:bg-pink-600 transition shadow-xl">
                    View Packages
                  </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
           <SectionHeader tag="Success Stories" title="What Our Students Say" light />
           
           <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard 
                name="Thando M."
                role="Nail Tech Graduate"
                text="Czane Academy changed my life. The practical training gave me the confidence to open my own salon in Vosloorus."
                rating={5}
              />
              <TestimonialCard 
                name="Lerato K."
                role="Makeup Artist"
                text="Zanele is an amazing mentor. She doesn't just teach you skills, she teaches you how to be a professional."
                rating={5}
              />
              <TestimonialCard 
                name="Sipho N."
                role="Massage Therapist"
                text="The best investment I ever made. The accreditation helped me get a job at a top spa in Sandton."
                rating={5}
              />
           </div>
        </div>
      </section>

      {/* 7. CONTACT & FOOTER */}
      <footer id="contact" className="bg-black text-white pt-24 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            <div>
               <h2 className="text-4xl font-serif font-bold mb-6">Ready to start your journey?</h2>
               <p className="text-gray-400 text-lg mb-10 max-w-md">
                 Enroll today and take the first step towards a glamorous and successful career in the beauty industry.
               </p>
               
               <div className="space-y-6">
                 <ContactItem icon={<MapPin className="text-pink-500"/>} title="Visit Us" text="108-109 Kubeka Street, Vosloorus" />
                 <ContactItem icon={<Mail className="text-pink-500"/>} title="Email Us" text="czane5506@gmail.com" />
                 <ContactItem icon={<Phone className="text-pink-500"/>} title="Call Us" text="079 305 7899 / 079 843 3526" />
               </div>
            </div>

            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
               <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
               <form className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input className="bg-black border border-gray-800 rounded-lg p-4 focus:border-pink-500 outline-none transition" placeholder="Name" />
                    <input className="bg-black border border-gray-800 rounded-lg p-4 focus:border-pink-500 outline-none transition" placeholder="Phone" />
                 </div>
                 <input className="w-full bg-black border border-gray-800 rounded-lg p-4 focus:border-pink-500 outline-none transition" placeholder="Email Address" />
                 <textarea rows={4} className="w-full bg-black border border-gray-800 rounded-lg p-4 focus:border-pink-500 outline-none transition" placeholder="How can we help you?" />
                 <button className="w-full bg-pink-600 text-white font-bold py-4 rounded-lg hover:bg-pink-700 transition">Send Message</button>
               </form>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="text-2xl font-serif font-bold">CZANE ACADEMY</div>
             <div className="text-gray-500 text-sm">
               © {new Date().getFullYear()} Czane Beauty Academy. All rights reserved.
             </div>
             <div className="flex gap-4">
                <SocialIcon icon={<Instagram size={20}/>} />
                <SocialIcon icon={<Facebook size={20}/>} />
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Helper Components ---

const StatItem: React.FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{number}</div>
    <div className="text-pink-200 text-sm uppercase tracking-wider">{label}</div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition duration-300 border border-transparent hover:border-gray-100">
     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        {icon}
     </div>
     <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
     <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

const TestimonialCard: React.FC<{ name: string; role: string; text: string; rating: number }> = ({ name, role, text, rating }) => (
  <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
     <div className="flex gap-1 text-yellow-500 mb-4">
        {[...Array(rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
     </div>
     <p className="text-gray-300 mb-6 italic">"{text}"</p>
     <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
            {name[0]}
        </div>
        <div>
            <div className="font-bold text-white">{name}</div>
            <div className="text-xs text-pink-400">{role}</div>
        </div>
     </div>
  </div>
);

const ContactItem: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="flex items-center gap-4">
     <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
        {icon}
     </div>
     <div>
        <div className="text-gray-400 text-sm">{title}</div>
        <div className="text-white font-medium">{text}</div>
     </div>
  </div>
);

const SocialIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <a href="#" className="w-10 h-10 bg-gray-900 flex items-center justify-center rounded-full text-gray-400 hover:bg-pink-600 hover:text-white transition">
    {icon}
  </a>
);

export default LandingPage;