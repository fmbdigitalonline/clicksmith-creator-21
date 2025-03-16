
import { generatePDF, generateWord } from './documentGenerators';

export const convertToFormat = async (imageUrl: string, format: 'jpg' | 'png'): Promise<Blob> => {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    // Set crossOrigin to anonymous to handle CORS
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      try {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image format'));
            }
          },
          `image/${format}`,
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      // If the anonymous CORS request fails, try without CORS
      // This will work for images from the same origin
      img.crossOrigin = "";
      img.src = imageUrl;
      reject(new Error('Failed to load image: ' + error));
    };

    // Add a cache-busting parameter to force a fresh request
    const cacheBustUrl = new URL(imageUrl, window.location.origin);
    cacheBustUrl.searchParams.append('t', Date.now().toString());
    img.src = cacheBustUrl.toString();
  });
};

export const convertImage = async (
  imageUrl: string, 
  format: 'jpg' | 'png' | 'pdf' | 'docx',
  variant: any
): Promise<Blob> => {
  if (format === 'pdf') {
    return generatePDF(variant, imageUrl);
  }
  if (format === 'docx') {
    return generateWord(variant, imageUrl);
  }
  return convertToFormat(imageUrl, format);
};
