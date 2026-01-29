import React from 'react';
import * as RouterDOM from 'react-router-dom';
import { ArrowRight, Star, Heart, Award } from 'lucide-react';

const { Link } = RouterDOM;

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[600px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-black overflow-hidden">
          <img 
            src="https://picsum.photos/1920/1080?grayscale" 
            alt="Beauty Salon Background" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-brand-gold">
            Beauty is Enhancement
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8">
            Master your craft with Czane Beauty Academy. <br/>
            Accredited courses designed to empower.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/courses" className="bg-brand-gold text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-500 transition flex items-center justify-center">
              View Courses <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/spa" className="bg-transparent border-2 border-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-black transition">
              Kids Spa Packages
            </Link>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-brand-rose/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-rose">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Service with Love</h3>
              <p className="text-gray-600">We believe in nurturing talent and serving our clients with genuine care and integrity.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Accredited Quality</h3>
              <p className="text-gray-600">Our educational academy provides accredited courses to ensure your skills are recognized professionally.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Affordability</h3>
              <p className="text-gray-600">Our mission is to maintain affordability for aspiring professionals without compromising quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <img 
              src="https://picsum.photos/600/700" 
              alt="Zanele Masondo" 
              className="rounded-lg shadow-xl w-full object-cover h-[500px]"
            />
          </div>
          <div className="md:w-1/2">
            <h4 className="text-brand-gold font-bold uppercase tracking-widest mb-2">Established 2019</h4>
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">Meet the Visionary</h2>
            <h3 className="text-xl font-bold mb-4">Zanele Masondo</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Our vision is to be a leading academy where every student receives outstanding education and unwavering support. 
              At Czane Beauty and Academy, we don't just teach techniques; we build careers.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Whether you are looking to start a new career in beauty therapy or treat your little ones to a magical spa day, 
              we are dedicated to excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Spa Teaser */}
      <section className="py-20 bg-brand-rose/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-4">Kids Spa Parties</h2>
          <p className="text-xl text-gray-600 mb-8">Treat your little princess to a day of pampering.</p>
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-pink-600 mb-2">Starting at R200 per child</h3>
            <p className="mb-6 text-gray-500">Includes Manicures, Pedicures, Massage, Facials, Make-up, and Catering.</p>
            <Link to="/spa" className="inline-block px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
              View Packages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};