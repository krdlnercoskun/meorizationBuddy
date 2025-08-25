import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ComparisonResult, MemorizedText, PracticeSession } from '../types';

export class ExportService {
  static async exportToPDF(
    text: MemorizedText,
    session: PracticeSession,
    comparison: ComparisonResult
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text(text.title, margin, 30);

    // Session info
    pdf.setFontSize(12);
    pdf.text(`Practice Session: ${session.startTime.toLocaleDateString()}`, margin, 50);
    pdf.text(`Accuracy: ${Math.round(comparison.accuracy * 100)}%`, margin, 60);
    pdf.text(`Duration: ${Math.round(session.duration / 1000)}s`, margin, 70);

    // Statistics
    let yPos = 90;
    pdf.text('Statistics:', margin, yPos);
    yPos += 10;
    pdf.text(`Total Words: ${comparison.statistics.totalWords}`, margin + 10, yPos);
    yPos += 10;
    pdf.text(`Correct Words: ${comparison.statistics.correctWords}`, margin + 10, yPos);
    yPos += 10;
    pdf.text(`Errors: ${comparison.statistics.errorCount}`, margin + 10, yPos);
    yPos += 10;
    pdf.text(`Near Misses: ${comparison.statistics.nearMissCount}`, margin + 10, yPos);

    // Errors section
    if (comparison.errors.length > 0) {
      yPos += 20;
      pdf.text('Errors Found:', margin, yPos);
      
      comparison.errors.forEach((error, index) => {
        yPos += 10;
        if (yPos > 270) { // New page
          pdf.addPage();
          yPos = 30;
        }
        
        const errorText = `${index + 1}. Expected: "${error.expected}" | Actual: "${error.actual}"`;
        pdf.text(errorText, margin + 10, yPos);
      });
    }

    // Save the PDF
    pdf.save(`${text.title}_practice_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async exportHighlightedText(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for export');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    });

    // Download as PNG
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async exportSessionData(
    text: MemorizedText,
    sessions: PracticeSession[]
  ): Promise<void> {
    const data = {
      text,
      sessions,
      exportDate: new Date().toISOString(),
      summary: {
        totalSessions: sessions.length,
        averageAccuracy: sessions.length > 0 ? 
          sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length : 0,
        bestAccuracy: Math.max(...sessions.map(s => s.accuracy)),
        totalPracticeTime: sessions.reduce((sum, s) => sum + s.duration, 0)
      }
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${text.title}_sessions_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}