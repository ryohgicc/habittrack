import { useState, useEffect } from 'react';

export function useTimer(startTime: number | null, initialDuration: number = 0) {
  const [elapsed, setElapsed] = useState(() => (startTime ? Date.now() - startTime : 0));

  useEffect(() => {
    if (!startTime) {
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const totalDuration = startTime ? initialDuration + elapsed : initialDuration;
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return formatTime(totalDuration);
}
