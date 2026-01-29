import { CertificateTemplate } from "../types";

export const generateCertificate = async (
  studentName: string,
  courseName: string,
  date: string,
  template: CertificateTemplate
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // A4 Landscape dimensions at fairly high DPI
    canvas.width = 1123;
    canvas.height = 794;

    if (!ctx) {
      reject("Canvas not supported");
      return;
    }

    // Helper function to draw text (shared between image load success and failure)
    const drawTextContent = () => {
      ctx.textAlign = 'center';

      // Academy Name
      ctx.font = 'bold 50px "Playfair Display", serif';
      ctx.fillStyle = template.titleColor;
      ctx.fillText(template.academyName.toUpperCase(), canvas.width / 2, 150);

      // "Certificate of Completion"
      ctx.font = 'italic 40px "Playfair Display", serif';
      ctx.fillStyle = template.textColor;
      ctx.fillText("Certificate of Completion", canvas.width / 2, 220);

      // "This certifies that"
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText("This certifies that", canvas.width / 2, 300);

      // Student Name (Big)
      ctx.font = 'bold italic 80px "Playfair Display", serif';
      ctx.fillStyle = template.titleColor;
      ctx.fillText(studentName, canvas.width / 2, 390);

      // Underline
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 300, 410);
      ctx.lineTo(canvas.width / 2 + 300, 410);
      ctx.strokeStyle = template.titleColor;
      ctx.stroke();

      // "Has successfully completed the course"
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText("Has successfully completed the course", canvas.width / 2, 470);

      // Course Name
      ctx.font = 'bold 50px "Playfair Display", serif';
      ctx.fillStyle = template.textColor;
      ctx.fillText(courseName, canvas.width / 2, 540);

      // Date & Signature Area
      const bottomY = 680;
      
      // Date
      ctx.textAlign = 'left';
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#444';
      ctx.fillText(`Date: ${date}`, 150, bottomY);

      // Signature
      ctx.textAlign = 'right';
      ctx.font = 'italic 30px "Playfair Display", serif';
      ctx.fillStyle = template.titleColor;
      ctx.fillText(template.signatureText, canvas.width - 150, bottomY - 10);
      
      ctx.beginPath();
      ctx.moveTo(canvas.width - 400, bottomY);
      ctx.lineTo(canvas.width - 100, bottomY);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.font = '16px sans-serif';
      ctx.fillText("Instructor / Director", canvas.width - 150, bottomY + 25);
    };

    // Helper to draw fallback border if image is missing
    const drawFallbackBorder = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0,0, canvas.width, canvas.height);
      
      // Main Border
      ctx.strokeStyle = template.titleColor;
      ctx.lineWidth = 20;
      ctx.strokeRect(20,20, canvas.width-40, canvas.height-40);
      
      // Inner thin line
      ctx.lineWidth = 2;
      ctx.strokeRect(50,50, canvas.width-100, canvas.height-100);
    };

    if (template.backgroundUrl && template.backgroundUrl.trim() !== '') {
        const bgImage = new Image();
        bgImage.crossOrigin = "Anonymous";
        bgImage.src = template.backgroundUrl;

        bgImage.onload = () => {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            drawTextContent();
            resolve(canvas.toDataURL('image/png'));
        };

        bgImage.onerror = () => {
            console.warn("Certificate background failed to load, using fallback border.");
            drawFallbackBorder();
            drawTextContent();
            resolve(canvas.toDataURL('image/png'));
        };
    } else {
        // No image provided, draw border
        drawFallbackBorder();
        drawTextContent();
        resolve(canvas.toDataURL('image/png'));
    }
  });
};