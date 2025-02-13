
import { useEffect, useState } from 'react';

interface TextCyclerProps {
  items: string[];
  interval?: number;
  className?: string;
}

export const TextCycler = ({ items, interval = 2000, className = '' }: TextCyclerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <span className={`${className} transition-opacity duration-200`}>
      {items[currentIndex]}
    </span>
  );
};
