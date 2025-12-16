import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Problem } from '../types/problem';

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const problemsRef = collection(db, 'problems');
      const q = query(problemsRef);
      
      const snapshot = await getDocs(q);
      const loadedProblems: Problem[] = [];
      
      snapshot.forEach((doc) => {
        loadedProblems.push({
          id: doc.id,
          ...doc.data()
        } as Problem);
      });
      
      setProblems(loadedProblems);
      setError(null);
    } catch (err: any) {
      console.error('문제 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { problems, loading, error, reload: loadProblems };
}