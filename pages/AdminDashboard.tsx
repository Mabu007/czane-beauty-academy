import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Course } from '../types';
import { Plus, Trash, Sparkles, LogOut } from 'lucide-react';
import { generateCourseDescription } from '../services/geminiService';
import * as RouterDOM from 'react-router-dom';

const { useNavigate } = RouterDOM;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: 0,
    level: 'Beginner',
    status: 'DRAFT',
    image: '',
    modules: []
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const querySnapshot = await getDocs(collection(db, "courses"));
    const fetched: Course[] = [];
    querySnapshot.forEach((doc) => {
      fetched.push({ id: doc.id, ...doc.data() } as Course);
    });
    setCourses(fetched);
  };

  const handleGenerateDescription = async () => {
    if (!newCourse.title) return alert("Please enter a title first");
    setAiLoading(true);
    try {
      const desc = await generateCourseDescription(newCourse.title || '', "Beauty Therapy");
      setNewCourse({ ...newCourse, description: desc });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: new Date()
      });
      setNewCourse({ title: '', description: '', price: 0, level: 'Beginner', status: 'DRAFT', image: '', modules: [] });
      fetchCourses();
    } catch (error) {
      console.error("Error adding course: ", error);
      alert("Error adding course. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, "courses", id));
      fetchCourses();
    }
  };
  
  const handleLogout = () => {
      auth.signOut();
      navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Course Form */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Add New Course
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading}
                  className="mt-2 text-xs flex items-center text-purple-600 hover:text-purple-800 font-bold"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {aiLoading ? "Generating..." : "Generate with AI"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price (R)</label>
                    <input
                    type="number"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700">Status</label>
                     <select 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        value={newCourse.status}
                        onChange={(e) => setNewCourse({...newCourse, status: e.target.value as any})}
                     >
                         <option value="DRAFT">Draft</option>
                         <option value="PUBLISHED">Published</option>
                     </select>
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700">Level</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={newCourse.image}
                  onChange={(e) => setNewCourse({ ...newCourse, image: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-dark text-brand-gold font-bold py-2 px-4 rounded hover:bg-black transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Create Course'}
              </button>
            </form>
          </div>

          {/* Course List */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Existing Courses</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R{course.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => handleDelete(course.id)}
                            className="text-red-600 hover:text-red-900"
                        >
                            <Trash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                      <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No courses found. Add one to get started.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};