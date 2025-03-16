
import { generatePDF, generateWord } from './documentGenerators';

export const convertToFormat = async (imageUrl: string, format: 'jpg' | 'png'): Promise<Blob> => {
  try {
    // First fetch the image to handle CORS and ensure it's available
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; BoltAdConverter/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
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
              // Clean up the object URL
              URL.revokeObjectURL(objectUrl);
            },
            `image/${format}`,
            0.95
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image: ' + error));
      };

      img.src = objectUrl;
    });
  } catch (error) {
    console.error('Error converting image:', error);
    throw error;
  }
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
