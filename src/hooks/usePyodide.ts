import { useState, useEffect } from 'react';
import { PythonRunner } from '../services/pythonRunner';

export function usePyodide() {
  const [runner, setRunner] = useState<PythonRunner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('초기화 중...');

  useEffect(() => {
    initPyodide();
  }, []);

  const initPyodide = async () => {
    try {
      setLoading(true);
      setProgress('Python 환경 초기화 중...');
      
      const pythonRunner = new PythonRunner();
      await pythonRunner.initialize((msg) => setProgress(msg));
      
      setRunner(pythonRunner);
      setError(null);
    } catch (err: any) {
      console.error('Pyodide 초기화 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { runner, loading, error, progress };
}