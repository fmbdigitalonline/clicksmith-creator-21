import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

export const generatePDF = async (variant: any, imageUrl: string): Promise<Blob> => {
  try {
    const doc = new jsPDF();
    
    // Add headline
    doc.setFontSize(16);
    doc.text(variant.headline, 20, 20);
    
    // Add description
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(variant.description, 170);
    doc.text(splitText, 20, 40);
    
    // Add call to action if exists
    if (variant.callToAction) {
      doc.setFontSize(14);
      doc.text(variant.callToAction, 20, doc.internal.pageSize.height - 30);
    }
    
    // Add image
    if (imageUrl) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      const imgWidth = 170;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, 'JPEG', 20, 80, imgWidth, imgHeight);
    }
    
    // Return blob instead of saving
    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateWord = async (variant: any, imageUrl: string): Promise<Blob> => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: variant.headline,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: variant.description,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: variant.callToAction || '',
                bold: true,
                size: 28,
              }),
            ],
          }),
        ],
      }],
    });

    // Return blob instead of handling download
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