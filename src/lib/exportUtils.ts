import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Appointment } from './types';

/**
 * Export appointments to PDF with Arabic support using HTML
 */
export async function exportAppointmentsToPDF(
  appointments: Appointment[],
  filename: string = 'appointments.pdf'
) {
  // Sort appointments by schedule (date) first, then by doctor_id
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.SCHEDULE).getTime();
    const dateB = new Date(b.SCHEDULE).getTime();
    
    // First sort by schedule (date)
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // If same date, sort by doctor_id
    return (a.DOCTOR_ID || 0) - (b.DOCTOR_ID || 0);
  });

  // Create HTML table with Arabic support
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, 'Arabic UI Text', sans-serif;
          direction: rtl;
          padding: 30px;
          background-color: #f9fafb;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid #3b82f6;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .info {
          text-align: right;
          margin-bottom: 25px;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.8;
        }
        .info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 12px 8px;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          border: 1px solid #1e40af;
          white-space: nowrap;
        }
        td {
          padding: 10px 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
          font-size: 11px;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:nth-child(odd) {
          background-color: #ffffff;
        }
        tr:hover {
          background-color: #eff6ff;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          display: inline-block;
        }
        .status-scheduled {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .payment-paid {
          background-color: #d1fae5;
          color: #065f46;
        }
        .payment-unpaid {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .invoice-yes {
          color: #059669;
          font-weight: 600;
        }
        .invoice-no {
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير المواعيد</h1>
      </div>
      <div class="info">
        <p><strong>تاريخ الإنشاء:</strong> ${new Date().toLocaleString('ar-EG', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</p>
        <p><strong>إجمالي المواعيد:</strong> ${sortedAppointments.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>الرقم</th>
            <th>المريض</th>
            <th>الطبيب</th>
            <th>التاريخ</th>
            <th>الوقت</th>
            <th>الحالة</th>
            <th>حالة الدفع</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
            <th>فاتورة</th>
          </tr>
        </thead>
        <tbody>
          ${sortedAppointments.map((apt) => {
            const scheduleDate = new Date(apt.SCHEDULE);
            const statusClass = apt.STATUS === 'scheduled' ? 'status-scheduled' : 
                               apt.STATUS === 'pending' ? 'status-pending' : 
                               'status-cancelled';
            const paymentClass = apt.PAYMENT_STATUS === 'paid' ? 'payment-paid' : 'payment-unpaid';
            const statusText = apt.STATUS === 'scheduled' ? 'مجدول' : 
                             apt.STATUS === 'pending' ? 'قيد الانتظار' : 
                             apt.STATUS === 'cancelled' ? 'ملغي' : apt.STATUS || 'N/A';
            const paymentText = apt.PAYMENT_STATUS === 'paid' ? 'مدفوع' : 
                               apt.PAYMENT_STATUS === 'partial' ? 'جزئي' : 
                               apt.PAYMENT_STATUS === 'unpaid' ? 'غير مدفوع' : 
                               apt.PAYMENT_STATUS || 'غير مدفوع';
            
            return `
            <tr>
              <td>${apt.APPOINTMENT_ID}</td>
              <td>${apt.PATIENT_NAME || `ID: ${apt.PATIENT_ID}`}</td>
              <td>${apt.DOCTOR_NAME || `ID: ${apt.DOCTOR_ID}`}</td>
              <td>${scheduleDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              <td>${scheduleDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
              <td><span class="status-badge ${statusClass}">${statusText}</span></td>
              <td><span class="status-badge ${paymentClass}">${paymentText}</span></td>
              <td>${apt.PAYMENT_AMOUNT || '0'} ج.م</td>
              <td>${apt.PAYMENT_METHOD || 'N/A'}</td>
              <td class="${apt.HAS_INVOICE ? 'invoice-yes' : 'invoice-no'}">${apt.HAS_INVOICE ? 'نعم' : 'لا'}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container.querySelector('body') || container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Calculate PDF dimensions
    const imgWidth = 297; // A4 width in mm (landscape)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('l', 'mm', 'a4');

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Handle multiple pages if needed
    let heightLeft = imgHeight;
    let position = 0;

    if (heightLeft > 210) { // A4 height in mm
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 210;
      }
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.removeChild(container);
    // Fallback to basic PDF without images
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Appointments Report', 14, 15);
    doc.save(filename);
  }
}

/**
 * Export appointments to Excel
 */
export function exportAppointmentsToExcel(
  appointments: Appointment[],
  filename: string = 'appointments.xlsx'
) {
  // Prepare data
  const data = appointments.map((apt) => ({
    ID: apt.APPOINTMENT_ID,
    Patient: apt.PATIENT_NAME || `ID: ${apt.PATIENT_ID}`,
    'Patient ID': apt.PATIENT_ID,
    Doctor: apt.DOCTOR_NAME || `ID: ${apt.DOCTOR_ID}`,
    'Doctor ID': apt.DOCTOR_ID,
    Schedule: new Date(apt.SCHEDULE).toLocaleDateString('ar-EG'),
    Time: new Date(apt.SCHEDULE).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    Status: apt.STATUS || 'N/A',
    'Payment Status': apt.PAYMENT_STATUS || 'unpaid',
    Amount: apt.PAYMENT_AMOUNT || 0,
    'Payment Method': apt.PAYMENT_METHOD || 'N/A',
    Invoice: apt.HAS_INVOICE ? 'Yes' : 'No',
    'Invoice Number': apt.INVOICE_NUMBER || 'N/A',
    Reason: apt.REASON || 'N/A',
    Note: apt.NOTE || 'N/A',
    'Appointment Type': apt.APPOINTMENT_TYPE || 'consultation',
  }));

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

  // Auto-size columns
  const colWidths = [
    { wch: 8 }, // ID
    { wch: 25 }, // Patient
    { wch: 10 }, // Patient ID
    { wch: 25 }, // Doctor
    { wch: 10 }, // Doctor ID
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 12 }, // Status
    { wch: 15 }, // Payment Status
    { wch: 10 }, // Amount
    { wch: 15 }, // Payment Method
    { wch: 8 }, // Invoice
    { wch: 15 }, // Invoice Number
    { wch: 30 }, // Reason
    { wch: 30 }, // Note
    { wch: 15 }, // Appointment Type
  ];
  ws['!cols'] = colWidths;

  // Write file
  XLSX.writeFile(wb, filename);
}

/**
 * Export patients to PDF
 */
export function exportPatientsToPDF(
  patients: any[],
  filename: string = 'patients.pdf'
) {
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Patients Report', 14, 15);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('ar-EG')}`, 14, 22);
  doc.text(`Total Patients: ${patients.length}`, 14, 28);

  const tableData = patients.map((patient) => [
    patient.PATIENT_ID?.toString() || 'N/A',
    patient.NAME || 'N/A',
    patient.EMAIL || 'N/A',
    patient.PHONE || 'N/A',
    patient.IDENTIFICATIONNUMBER || 'N/A',
    patient.AGE?.toString() || 'N/A',
    patient.GENDER || 'N/A',
    patient.ADDRESS || 'N/A',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['ID', 'Name', 'Email', 'Phone', 'ID Number', 'Age', 'Gender', 'Address']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 35 },
  });

  doc.save(filename);
}

/**
 * Export patients to Excel
 */
export function exportPatientsToExcel(
  patients: any[],
  filename: string = 'patients.xlsx'
) {
  const data = patients.map((patient) => ({
    ID: patient.PATIENT_ID || 'N/A',
    Name: patient.NAME || 'N/A',
    Email: patient.EMAIL || 'N/A',
    Phone: patient.PHONE || 'N/A',
    'ID Number': patient.IDENTIFICATIONNUMBER || 'N/A',
    Age: patient.AGE || 'N/A',
    Gender: patient.GENDER || 'N/A',
    Address: patient.ADDRESS || 'N/A',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patients');

  XLSX.writeFile(wb, filename);
}

/**
 * Export invoices to PDF
 */
export function exportInvoicesToPDF(
  invoices: any[],
  filename: string = 'invoices.pdf'
) {
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Invoices Report', 14, 15);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('ar-EG')}`, 14, 22);
  doc.text(`Total Invoices: ${invoices.length}`, 14, 28);

  const tableData = invoices.map((invoice) => [
    invoice.INVOICE_ID?.toString() || 'N/A',
    invoice.INVOICE_NUMBER || 'N/A',
    invoice.PATIENT_NAME || 'N/A',
    invoice.DOCTOR_NAME || 'N/A',
    invoice.APPOINTMENT_ID?.toString() || 'N/A',
    new Date(invoice.INVOICE_DATE).toLocaleDateString('ar-EG') || 'N/A',
    invoice.TOTAL_AMOUNT?.toString() || '0',
    invoice.PAYMENT_STATUS || 'N/A',
    invoice.PAYMENT_METHOD || 'N/A',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [
      ['ID', 'Invoice #', 'Patient', 'Doctor', 'Appointment ID', 'Date', 'Amount', 'Payment Status', 'Payment Method'],
    ],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 35 },
  });

  doc.save(filename);
}

/**
 * Export invoices to Excel
 */
export function exportInvoicesToExcel(
  invoices: any[],
  filename: string = 'invoices.xlsx'
) {
  const data = invoices.map((invoice) => ({
    ID: invoice.INVOICE_ID || 'N/A',
    'Invoice Number': invoice.INVOICE_NUMBER || 'N/A',
    Patient: invoice.PATIENT_NAME || 'N/A',
    Doctor: invoice.DOCTOR_NAME || 'N/A',
    'Appointment ID': invoice.APPOINTMENT_ID || 'N/A',
    Date: new Date(invoice.INVOICE_DATE).toLocaleDateString('ar-EG') || 'N/A',
    Amount: invoice.TOTAL_AMOUNT || 0,
    'Payment Status': invoice.PAYMENT_STATUS || 'N/A',
    'Payment Method': invoice.PAYMENT_METHOD || 'N/A',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

  XLSX.writeFile(wb, filename);
}

