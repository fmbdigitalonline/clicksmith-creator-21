
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq: any;
  }
}

export const useFacebookPixel = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'PageView');
    }
  }, [location]);
};
