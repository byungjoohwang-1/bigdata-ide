import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(totalSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 타이머 시작
  const start = useCallback(() => {
    setIsRunning(true);
    setIsExpired(false);
  }, []);

  // 타이머 정지
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // 타이머 리셋
  const reset = useCallback((newTotalSeconds?: number) => {
    setSecondsLeft(newTotalSeconds || totalSeconds);
    setIsRunning(false);
    setIsExpired(false);
  }, [totalSeconds]);

  // 타이머 로직
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft]);

  // 시간 포맷 (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    secondsLeft,
    isRunning,
    isExpired,
    formattedTime: formatTime(secondsLeft),
    start,
    pause,
    reset,
    percentage: (secondsLeft / totalSeconds) * 100
  };
}