const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { httpError } = require('../middleware/errorMiddleware');
const money = (value) => `INR ${Number(value || 0).toFixed(2)}`;
const date = (value) => String(value || '').slice(0, 10).split('-').reverse().join('/');

function invoiceLogo(settings) {
  const stored = settings && settings.logo;
  if (stored) {
    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(stored);
    if (match) return Buffer.from(match[2], 'base64');
  }
  const defaultLogo = path.resolve(__dirname, '../../../client/public/logo.png');
  return fs.existsSync(defaultLogo) ? defaultLogo : null;
}

function createInvoicePdf(invoice, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const left = 42, right = 553;
    const company = settings || {};
    const logo = invoiceLogo(company);
    if (logo) doc.image(logo, left, 38, { fit: [64, 64] });
    doc.fontSize(22).fillColor('#10243b').text(company.company_name || 'VIDHI SALES', logo ? 116 : left, 42);
    doc.fontSize(10).fillColor('#526174');
    if (company.tagline) doc.text(company.tagline, logo ? 116 : left, 70, { width: logo ? 390 : 450 });
    if (company.phone) doc.text(`Phone: ${company.phone}`, logo ? 116 : left, company.tagline ? 86 : 70);
    doc.moveTo(left, 112).lineTo(right, 112).lineWidth(2).strokeColor('#f2c200').stroke();

    doc.fontSize(16).fillColor('#10243b').text('TAX INVOICE', left, 126, { align: 'center', width: right - left });
    doc.fontSize(10).fillColor('#1d2b3a');
    doc.text(`Invoice No: ${invoice.invoice_no}`, left, 158);
    doc.text(`Date: ${date(invoice.invoice_date)}`, left, 174);
    doc.text(`Payment: ${invoice.payment_method} - ${invoice.status}`, left, 190);
    doc.text('Bill To:', 330, 158);
    doc.text(invoice.customer_name || '', 330, 174, { width: 215 });
    if (invoice.address) doc.text(invoice.address, 330, 190, { width: 215 });
    if (invoice.phone) doc.text(`Phone: ${invoice.phone}`, 330, doc.y + 2);
    if (invoice.email) doc.text(`Email: ${invoice.email}`, 330, doc.y + 2);
    if (invoice.gstin) doc.text(`GSTIN: ${invoice.gstin}`, 330, doc.y + 2);

    let y = Math.max(doc.y, 222) + 18;
    const drawTableHeader = () => {
      doc.rect(left, y, right - left, 22).fill('#10243b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('#', left + 6, y + 7, { width: 20 });
      doc.text('Description', left + 28, y + 7, { width: 235 });
      doc.text('Qty', 365, y + 7, { width: 32, align: 'right' });
      doc.text('Price', 402, y + 7, { width: 60, align: 'right' });
      doc.text('GST', 465, y + 7, { width: 36, align: 'right' });
      doc.text('Amount', 504, y + 7, { width: 45, align: 'right' });
      y += 22;
      doc.fillColor('#1d2b3a').fontSize(9);
    };
    drawTableHeader();

    const items = invoice.items || [];
    items.forEach((item, index) => {
      const nameHeight = doc.heightOfString(item.name || '', { width: 235 });
      const rowHeight = Math.max(24, nameHeight + 10);
      if (y + rowHeight > 735) {
        doc.addPage();
        y = 42;
        drawTableHeader();
      }
      doc.text(String(index + 1), left + 6, y + 6, { width: 20 });
      doc.text(item.name || '', left + 28, y + 6, { width: 235 });
      doc.text(String(item.quantity), 365, y + 6, { width: 32, align: 'right' });
      doc.text(money(item.price), 402, y + 6, { width: 60, align: 'right' });
      doc.text(`${Number(item.gst_percent || 0)}%`, 465, y + 6, { width: 36, align: 'right' });
      doc.text(money(item.amount), 504, y + 6, { width: 45, align: 'right' });
      y += rowHeight;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor('#e1e7ef').stroke();
    });

    if (y + 150 > 760) {
      doc.addPage();
      y = 48;
    }
    y += 18;
    const totals = [
      ['Subtotal', invoice.subtotal],
      [`Discount (${Number(invoice.discount_percent || 0)}%)`, -Number(invoice.discount || 0)],
      [invoice.supply_type === 'Inter-State' ? 'IGST' : 'CGST', invoice.supply_type === 'Inter-State' ? invoice.tax : Number(invoice.tax || 0) / 2],
    ];
    if (invoice.supply_type !== 'Inter-State') totals.push(['SGST', Number(invoice.tax || 0) / 2]);
    totals.push(['Grand Total', invoice.total], ['Amount Paid', invoice.amount_paid], ['Balance Due', invoice.balance]);
    totals.forEach(([label, amount]) => {
      doc.fontSize(label === 'Grand Total' ? 12 : 10).fillColor(label === 'Grand Total' ? '#10243b' : '#1d2b3a');
      doc.text(label, 350, y, { width: 110 });
      doc.text(money(amount), 460, y, { width: 89, align: 'right' });
      y += label === 'Grand Total' ? 22 : 17;
    });
    if (company.bank_details) {
      y += 12;
      doc.fontSize(10).fillColor('#10243b').text('Bank Details', left, y);
      doc.fontSize(9).fillColor('#1d2b3a').text(company.bank_details, left, y + 14, { width: 260 });
    }
    if (company.footer_text) {
      doc.fontSize(9).fillColor('#526174').text(company.footer_text, left, 792, { width: right - left, align: 'center' });
    }
    doc.end();
  });
}

module.exports = { createInvoicePdf };
