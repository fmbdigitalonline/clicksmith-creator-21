
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import jsPDF from 'jspdf';

export const generatePDF = async (variant: any, imageUrl: string): Promise<Blob> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Add headline
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    const headlineLines = doc.splitTextToSize(variant.headline, contentWidth);
    doc.text(headlineLines, margin, margin);
    
    let currentY = margin + (headlineLines.length * 10);
    
    // Add description (primary text)
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const descriptionLines = doc.splitTextToSize(variant.description, contentWidth);
    doc.text(descriptionLines, margin, currentY + 10);
    
    currentY += (descriptionLines.length * 8) + 20;
    
    // Add image
    if (imageUrl) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Calculate image dimensions to fit within content width while maintaining aspect ratio
      const imgAspectRatio = img.width / img.height;
      const imgWidth = contentWidth;
      const imgHeight = imgWidth / imgAspectRatio;
      
      doc.addImage(img, 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    }
    
    // Add call to action if exists
    if (variant.callToAction) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(variant.callToAction, margin, currentY + 10);
    }
    
    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateWord = async (variant: any, imageUrl: string): Promise<Blob> => {
  try {
    // First, fetch and convert the image to base64
    let imageBase64: string | undefined;
    if (imageUrl) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Headline
          new Paragraph({
            children: [
              new TextRun({
                text: variant.headline,
                bold: true,
                size: 32,
              }),
            ],
            spacing: {
              after: 400,
            },
          }),
          
          // Primary Text
          new Paragraph({
            children: [
              new TextRun({
                text: variant.description,
                size: 24,
              }),
            ],
            spacing: {
              after: 400,
            },
          }),
          
          // Image
          ...(imageBase64 ? [
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBase64.split(',')[1],
                  transformation: {
                    width: 500,
                    height: 300,
                  },
                  type: 'png',
                  fallback: {
                    width: 500,
                    height: 300,
                  }
                }),
              ],
              spacing: {
                after: 400,
              },
            }),
          ] : []),
          
          // Call to Action
          ...(variant.callToAction ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: variant.callToAction,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
          ] : []),
        ],
      }],
    });

    return await Packer.toBuffer(doc).then(buffer => {
      return new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    });
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
};
