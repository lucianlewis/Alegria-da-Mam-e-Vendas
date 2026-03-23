let isPrinting = false;

export const printContent = (title: string, contentHtml: string) => {
  if (isPrinting) return;
  isPrinting = true;

  // Remove existing print section if any
  const existing = document.getElementById('print-section');
  if (existing) {
    document.body.removeChild(existing);
  }

  // Create new print section
  const printSection = document.createElement('div');
  printSection.id = 'print-section';
  printSection.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
      .print-container { 
        font-family: 'Inter', sans-serif; 
        padding: 40px; 
        color: #1a1a1a; 
        background-color: #fff;
        max-width: 500px;
        margin: 0 auto;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .app-header {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40px;
      }
      .logo-circle {
        width: 48px;
        height: 48px;
        background-color: #ff0080;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }
      .app-name {
        font-weight: 900;
        font-size: 24px;
        letter-spacing: -1px;
        color: #ff0080;
      }
      .card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 8px;
      }
      .main-value {
        font-size: 36px;
        font-weight: 900;
        color: #ff0080;
        margin-bottom: 24px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .info-item {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 12px;
      }
      .info-label {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 4px;
      }
      .info-value {
        font-size: 14px;
        font-weight: 700;
        color: #1a1a1a;
      }
      .row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 12px; 
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      .label { font-weight: 600; color: #64748b; font-size: 14px; }
      .value { font-weight: 800; color: #1a1a1a; font-size: 14px; }
      .footer {
        text-align: center;
        font-size: 10px;
        font-weight: 600;
        color: #94a3b8;
        margin-top: 40px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      @media print {
        .card { border: 1px solid #e2e8f0 !important; }
      }
    </style>
    <div class="print-container">
      <div class="app-header">
        <div class="logo-circle"></div>
        <div class="app-name">PipBase</div>
      </div>
      
      ${contentHtml}

      <div class="footer">
        ${new Date().toLocaleString()} • PipBase App
      </div>
    </div>
  `;
  document.body.appendChild(printSection);

  // Wait for fonts/styles to load
  setTimeout(() => {
    window.print();
    
    // Cleanup
    setTimeout(() => {
      if (document.body.contains(printSection)) {
        document.body.removeChild(printSection);
      }
      isPrinting = false;
    }, 1000);
  }, 1000);
};
