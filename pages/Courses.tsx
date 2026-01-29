import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../types';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';
import * as RouterDOM from 'react-router-dom';

const { Link } = RouterDOM;

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, "courses"), where("status", "==", "PUBLISHED"));
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching courses: ", error);
        // Fallback for demo if DB is empty
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Our Academy Courses</h1>
          <p className="text-xl text-gray-600">Accredited training to launch your beauty career.</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <h3 className="text-xl text-gray-500">No courses are currently open for enrollment. Please check back soon!</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                <div className="h-48 overflow-hidden bg-gray-200">
                  <img 
                    src={course.image || `https://picsum.photos/seed/${course.id}/400/300`} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                      course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {course.level}
                    </span>
                    <span className="text-lg font-bold text-brand-gold">R {course.price}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{course.description}</p>
                  
                  <div className="border-t pt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} Lessons
                    </div>
                    <Link 
                      to={`/course/${course.id}`} 
                      className="text-brand-dark font-bold hover:text-brand-gold flex items-center"
                    >
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};