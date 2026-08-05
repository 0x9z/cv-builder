/* ============================================
   PDF Export Engine
   Built by 0x9z | MIT License
   ============================================ */

const PDFEngine = (() => {
  /**
   * Generate and download PDF
   * Uses browser's built-in print functionality for clean A4 output
   */
  function downloadPDF(filename) {
    const previewEl = document.getElementById('cv-preview');
    const cv = CVState.getCV();
    
    if (!cv || !cv.fullName) {
      alert('⚠️ Please fill in at least your name before downloading.');
      return false;
    }

    // Generate filename if not provided
    const finalFilename = filename || `${cv.fullName.replace(/\s+/g, '_')}_CV.pdf`;

    // Store original transform
    const originalTransform = previewEl.style.transform;
    
    // Reset zoom to 100% for clean PDF
    previewEl.style.transform = 'scale(1)';

    // Trigger browser print dialog (user can save as PDF)
    window.print();

    // Restore original zoom
    setTimeout(() => {
      previewEl.style.transform = originalTransform || `scale(${PreviewEngine.getZoom() / 100})`;
    }, 500);

    return true;
  }

  /**
   * Generate PDF using html2pdf.js (alternative method - requires library)
   * Uncomment and include html2pdf.js CDN to use this instead
   */
  /*
  function downloadPDFAdvanced(filename) {
    const previewEl = document.getElementById('cv-preview');
    const cv = CVState.getCV();
    
    if (!cv || !cv.fullName) {
      alert('⚠️ Please fill in at least your name before downloading.');
      return false;
    }

    const finalFilename = filename || `${cv.fullName.replace(/\s+/g, '_')}_CV.pdf`;

    const opt = {
      margin: [0, 0, 0, 0],
      filename: finalFilename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Store original transform
    const originalTransform = previewEl.style.transform;
    previewEl.style.transform = 'scale(1)';

    html2pdf().set(opt).from(previewEl).save().then(() => {
      previewEl.style.transform = originalTransform || `scale(${PreviewEngine.getZoom() / 100})`;
    });

    return true;
  }
  */

  /**
   * Preview PDF in new tab
   */
  function previewPDF() {
    const previewEl = document.getElementById('cv-preview');
    const cv = CVState.getCV();
    
    if (!cv || !cv.fullName) {
      alert('⚠️ Please fill in at least your name before previewing.');
      return false;
    }

    // Store original transform
    const originalTransform = previewEl.style.transform;
    previewEl.style.transform = 'scale(1)';

    // Get the HTML content
    const htmlContent = previewEl.outerHTML;
    
    // Create a new window with just the CV content
    const previewWindow = window.open('', '_blank', 'width=900,height=700');
    if (!previewWindow) {
      alert('⚠️ Please allow pop-ups for this site to preview the CV.');
      previewEl.style.transform = originalTransform;
      return false;
    }

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>CV Preview - ${escapeHTML(cv.fullName)}</title>
        <link rel="stylesheet" href="css/templates.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #f0f0f0; 
            display: flex; 
            justify-content: center; 
            padding: 2rem;
            font-family: 'Georgia', serif;
          }
          .preview-page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            box-shadow: 0 4px 30px rgba(0,0,0,0.2);
          }
          @media print {
            body { background: #fff; padding: 0; }
            .preview-page { box-shadow: none; width: 100%; }
            @page { size: A4; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            document.querySelector('.preview-page').style.transform = 'scale(1)';
          };
        <\/script>
      </body>
      </html>
    `);
    previewWindow.document.close();

    // Restore original zoom
    previewEl.style.transform = originalTransform;

    return true;
  }

  /**
   * Escape HTML helper
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Validate CV before export
   */
  function validateBeforeExport() {
    const cv = CVState.getCV();
    const warnings = [];

    if (!cv.fullName || !cv.fullName.trim()) {
      warnings.push('Full name is missing');
    }
    if (!cv.email || !cv.email.trim()) {
      warnings.push('Email address is missing — important for employers to contact you');
    }
    if (!cv.summary || !cv.summary.trim()) {
      warnings.push('Professional summary is empty — a strong summary catches attention');
    }
    if (!cv.skills || cv.skills.length === 0) {
      warnings.push('No skills listed — skills sections are heavily scanned by ATS systems');
    }
    if (!cv.experience || cv.experience.length === 0) {
      warnings.push('No work experience listed');
    }

    return warnings;
  }

  /**
   * Show validation warnings and ask if user wants to continue
   */
  function exportWithValidation() {
    const warnings = validateBeforeExport();
    
    if (warnings.length > 0) {
      const message = warnings.map((w, i) => `${i + 1}. ${w}`).join('\n');
      const proceed = confirm(
        `⚠️ Your CV may be incomplete:\n\n${message}\n\nDo you want to continue anyway?`
      );
      if (!proceed) return false;
    }

    return downloadPDF();
  }

  // Public API
  return {
    downloadPDF,
    previewPDF,
    validateBeforeExport,
    exportWithValidation
  };
})();