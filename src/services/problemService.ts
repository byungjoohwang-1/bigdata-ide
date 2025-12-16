import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Problem } from '../types/problem';

export class ProblemService {
  private collectionName = 'problems';

  async getAll(): Promise<Problem[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('exam', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Problem[];
  }

  async getById(id: string): Promise<Problem | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Problem;
  }

  async getByExam(examId: string): Promise<Problem[]> {
    const q = query(
      collection(db, this.collectionName),
      where('exam', '==', examId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Problem[];
  }
}