import { generatePDF, generateWord } from './documentGenerators';

export const convertToFormat = async (imageUrl: string, format: 'jpg' | 'png'): Promise<Blob> => {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
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
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
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