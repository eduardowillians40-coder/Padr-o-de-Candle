import puppeteer from 'puppeteer';

export async function generatePDFFromHTML(htmlContent, options = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    ...options,
  });
  
  await browser.close();
  return pdfBuffer;
}

export function createReportHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; }
          .header { border-bottom: 2px solid #1E40AF; padding-bottom: 10px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1E40AF; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
          th { background-color: #F3F4F6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${data.reportTitle || 'Relatório'}</h1>
          <p>Data: ${data.issueDate || new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          ${data.content || '<p>Nenhum conteúdo disponível.</p>'}
        </div>
      </body>
    </html>
  `;
}