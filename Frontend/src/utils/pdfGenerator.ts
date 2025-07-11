import jsPDF from 'jspdf';

interface ConfigData {
  services: Array<{
    name: string;
    type: string;
    specs: string;
    monthlyPrice: number;
  }>;
  subtotal: number;
  vat: number;
  total: number;
}

export const generatePDF = (config: ConfigData, planType: 'monthly' | 'yearly', price: number) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Header
  doc.setFillColor(255, 107, 53); // Orange color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SCCC Cloud Quotation', margin, 25);
  
  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('en-GB');
  doc.text(`Date: ${currentDate}`, pageWidth - margin - 50, 25);
  
  // Plan Type
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`, margin, 60);
  
  // Configuration Details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Configuration Details', margin, 80);
  
  let yPosition = 95;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  config.services.forEach((service) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${service.name}`, margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const specLines = doc.splitTextToSize(service.specs, pageWidth - 2 * margin);
    doc.text(specLines, margin + 5, yPosition);
    yPosition += specLines.length * 5 + 5;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SAR ${service.monthlyPrice.toFixed(2)}/month`, margin + 5, yPosition);
    yPosition += 15;
  });
  
  // Pricing Summary
  yPosition += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Pricing Summary', margin, yPosition);
  yPosition += 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: SAR ${config.subtotal.toFixed(2)}`, margin, yPosition);
  yPosition += 10;
  doc.text(`VAT (15%): SAR ${config.vat.toFixed(2)}`, margin, yPosition);
  yPosition += 10;
  
  if (planType === 'yearly') {
    const monthlyTotal = config.total * 12;
    const discount = monthlyTotal * 0.1;
    doc.text(`Annual Total (without discount): SAR ${monthlyTotal.toFixed(2)}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Annual Discount (10%): -SAR ${discount.toFixed(2)}`, margin, yPosition);
    yPosition += 10;
  }
  
  // Total
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 107, 53);
  doc.text(`Total ${planType === 'yearly' ? 'Annual' : 'Monthly'} Cost: SAR ${price.toFixed(2)}`, margin, yPosition);
  
  // Features
  yPosition += 30;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Included Features', margin, yPosition);
  yPosition += 15;
  
  const features = [
    '24/7 Support',
    'Access to Cloud Dashboard',
    'Basic Monitoring Tools',
    'Email Support',
    'Standard SLA',
    'Monthly Usage Reports'
  ];
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  features.forEach(feature => {
    doc.text(`• ${feature}`, margin + 5, yPosition);
    yPosition += 8;
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('© 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor', margin, pageHeight - 20);
  doc.text('This quotation is valid for 30 days from the date of issue.', margin, pageHeight - 10);
  
  // Save the PDF
  const fileName = `SCCC_Cloud_Quotation_${planType}_${currentDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
