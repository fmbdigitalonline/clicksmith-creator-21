
import { useEffect, useState } from 'react';

interface TextCyclerProps {
  items: string[];
  interval?: number;
  className?: string;
}

export const TextCycler = ({ items, interval = 2000, className = '' }: TextCyclerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;

    const fadeTimeout = setInterval(() => {
      setIsVisible(false); // Start fade out
      
      // Wait for fade out animation to complete before changing text
      setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % items.length);
        setIsVisible(true); // Start fade in
      }, 200); // This matches the transition duration in the className

    }, interval);

    return () => {
      clearInterval(fadeTimeout);
    };
  }, [items.length, interval]);

  return (
    <span 
      className={`${className} transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {items[currentIndex]}
    </span>
  );
};
