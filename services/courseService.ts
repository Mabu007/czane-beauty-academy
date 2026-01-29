import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../types';

const COLLECTION_NAME = 'courses';

export const courseService = {
  getAllPublished: async (): Promise<Course[]> => {
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'PUBLISHED'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  },

  getAll: async (): Promise<Course[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  },

  getById: async (id: string): Promise<Course | null> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Course;
    }
    return null;
  },

  create: async (course: Omit<Course, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...course,
      createdAt: new Date()
    });
    return docRef.id;
  },

  update: async (id: string, data: Partial<Course>): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};