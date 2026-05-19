import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import jsPDF from "jspdf";

export async function exportToDocs(
  title: string,
  content: string,
  filename?: string,
) {
  // Split content into paragraphs
  const paragraphs = content.split("\n").map((text) => {
    if (!text.trim()) return new Paragraph("");
    
    // Check if it's a heading (starts with # symbols)
    const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      return new Paragraph({
        text: headingText,
        heading: (["Heading1", "Heading2", "Heading3", "Heading4", "Heading5", "Heading6"] as any)[level - 1],
        thematicBreak: false,
      });
    }

    return new Paragraph(text);
  });

  // Add title as heading
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${filename || title}.docx`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  downloadBlob(blob, filename);
}

export function exportToPdf(
  title: string,
  content: string,
  filename?: string,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  
  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, margin);
  
  // Add content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const lines = content.split("\n");
  let yPosition = margin + 15;
  
  for (const line of lines) {
    if (!line.trim()) {
      yPosition += 5;
      continue;
    }
    
    // Check if it's a heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const sizes = [16, 14, 12, 11, 10, 9];
      
      // Add spacing before heading
      yPosition += 3;
      
      doc.setFontSize(sizes[level - 1]);
      doc.setFont("helvetica", "bold");
      
      const wrappedText = doc.splitTextToSize(headingText, maxWidth);
      doc.text(wrappedText, margin, yPosition);
      yPosition += wrappedText.length * 6 + 5;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    } else {
      // Regular text
      const wrappedText = doc.splitTextToSize(line, maxWidth);
      
      // Check if we need a new page
      if (yPosition + wrappedText.length * 5 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(wrappedText, margin, yPosition);
      yPosition += wrappedText.length * 5;
    }
  }
  
  doc.save(`${filename || title}.pdf`);
}
