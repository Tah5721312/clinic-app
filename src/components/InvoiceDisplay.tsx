'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Printer,
  ArrowLeft,
  Download,
  Calendar,
  User,
  CreditCard,
  FileText,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

import { Invoice } from '@/lib/types';
import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';
import { toastError, toastWarning } from '@/lib/toast';

interface InvoiceDisplayProps {
  invoiceId: string;
}

export default function InvoiceDisplay({ invoiceId }: InvoiceDisplayProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${DOMAIN}/api/invoices/${invoiceId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Invoice not found');
          }
          throw new Error('Failed to fetch invoice');
        }

        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateSimple = (date: Date | string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentPrintDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'partial':
        return 'مدفوعة جزئياً';
      case 'unpaid':
        return 'غير مدفوعة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  // Shared function to generate HTML content
  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice?.INVOICE_NUMBER}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; padding: 0; background: white; }
            * { page-break-inside: avoid !important; }
            @page { 
              size: A4;
              margin: 10mm; 
            }
          }
          body { font-size: 11px; }
          .compact-section { margin-bottom: 8px; }
          .compact-header { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        </style>
      </head>
      <body class="bg-white">
        <div class="max-w-4xl mx-auto p-3">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-lg mb-2">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold">فاتورة</h1>
                <p class="text-xs text-blue-100">Invoice #${invoice?.INVOICE_NUMBER}</p>
              </div>
              <div class="text-right text-xs">
                <h3 class="font-semibold">عيادة الشفاء</h3>
                <p class="text-blue-100">📞 +20 1210927213</p>
                <p class="text-blue-100">✉️ info@alshifa-clinic.com</p>
              </div>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-2 gap-3 mb-2">
            <!-- Right Column -->
            <div>
              <!-- Invoice Info -->
              <div class="compact-section border rounded p-2">
                <div class="compact-header border-b pb-1 mb-2">معلومات الفاتورة</div>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">التاريخ:</span>
                    <span>${formatDateSimple(invoice?.INVOICE_DATE || new Date())}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">الحالة:</span>
                    <span class="px-2 py-0.5 rounded text-xs ${getStatusColor(invoice?.PAYMENT_STATUS || 'unpaid')}">${getStatusText(invoice?.PAYMENT_STATUS || 'unpaid')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">أنشئ بواسطة:</span>
                    <span>${invoice?.CREATED_BY_NAME || 'System'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">تاريخ الطباعة:</span>
                    <span>${getCurrentPrintDate()}</span>
                  </div>
                </div>
              </div>

              <!-- Patient Info -->
              <div class="compact-section border rounded p-2">
                <div class="compact-header border-b pb-1 mb-2">بيانات المريض</div>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">الاسم:</span>
                    <span class="font-medium">${invoice?.PATIENT_NAME}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">الهاتف:</span>
                    <span>${invoice?.PATIENT_PHONE}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">البريد:</span>
                    <span class="text-xs">${invoice?.PATIENT_EMAIL}</span>
                  </div>
                </div>
              </div>

              ${invoice?.APPOINTMENT_ID ? `
              <!-- Appointment Info -->
              <div class="compact-section border rounded p-2">
                <div class="compact-header border-b pb-1 mb-2">بيانات الموعد</div>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">الطبيب:</span>
                    <span>${invoice?.DOCTOR_NAME}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">التخصص:</span>
                    <span>${invoice?.DOCTOR_SPECIALTY}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">التاريخ:</span>
                    <span class="text-xs">${invoice?.APPOINTMENT_DATE ? formatDateSimple(invoice.APPOINTMENT_DATE) : 'N/A'}</span>
                  </div>
                </div>
              </div>
              ` : ''}
            </div>

            <!-- Left Column -->
            <div>
              <!-- Invoice Items -->
              <div class="compact-section border rounded p-2">
                <div class="compact-header border-b pb-1 mb-2">تفاصيل الفاتورة</div>
                <table class="w-full text-xs">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-right p-1">الوصف</th>
                      <th class="text-center p-1">الكمية</th>
                      <th class="text-left p-1">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-t">
                      <td class="p-1">${invoice?.APPOINTMENT_ID ? 'كشف طبي' : 'خدمة طبية'}</td>
                      <td class="text-center p-1">1</td>
                      <td class="text-left p-1">${formatCurrency(invoice?.AMOUNT || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Payment Summary -->
              <div class="compact-section border rounded p-2 bg-gray-50">
                <div class="compact-header border-b pb-1 mb-2">ملخص الدفع</div>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">المبلغ الأساسي:</span>
                    <span>${formatCurrency(invoice?.AMOUNT || 0)}</span>
                  </div>
                  ${(invoice?.DISCOUNT || 0) > 0 ? `
                  <div class="flex justify-between">
                    <span class="text-gray-600">الخصم:</span>
                    <span class="text-red-600">-${formatCurrency(invoice?.DISCOUNT || 0)}</span>
                  </div>
                  ` : ''}
                  <div class="flex justify-between border-t pt-1 font-bold">
                    <span>المجموع الكلي:</span>
                    <span class="text-blue-600">${formatCurrency((invoice?.AMOUNT || 0) - (invoice?.DISCOUNT || 0))}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">المبلغ المدفوع:</span>
                    <span class="text-green-600">${formatCurrency(invoice?.PAID_AMOUNT || 0)}</span>
                  </div>
                  ${invoice?.REMAINING_AMOUNT && invoice.REMAINING_AMOUNT > 0 ? `
                  <div class="flex justify-between">
                    <span class="text-gray-600">المبلغ المتبقي:</span>
                    <span class="text-red-600">${formatCurrency(invoice.REMAINING_AMOUNT)}</span>
                  </div>
                  ` : ''}
                  ${invoice?.PAYMENT_METHOD ? `
                  <div class="flex justify-between">
                    <span class="text-gray-600">طريقة الدفع:</span>
                    <span>${invoice.PAYMENT_METHOD}</span>
                  </div>
                  ` : ''}
                </div>
              </div>

              ${invoice?.NOTES ? `
              <!-- Notes -->
              <div class="compact-section border rounded p-2 bg-yellow-50">
                <div class="compact-header border-b pb-1 mb-2">ملاحظات</div>
                <p class="text-xs text-gray-700">${invoice.NOTES}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center text-xs text-gray-500 border-t pt-2 mt-2">
            <p>شكراً لاختياركم عيادة الشفاء - Thank you for choosing Al-Shifa Clinic</p>
            <p class="mt-0.5">للاستفسارات: +20 1210927213 | info@alshifa-clinic.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices, use a more reliable approach
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (!printWindow) {
          // Fallback: try to print the current page
          window.print();
          return;
        }

        printWindow.document.write(generateInvoiceHTML());
        printWindow.document.close();

        // Add a small delay for mobile browsers
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (optional)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 1000);
      } else {
        // Desktop behavior
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toastWarning('Please allow popups for this site to print');
          return;
        }

        printWindow.document.write(generateInvoiceHTML());
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error generating print:', error);
      toastError('Error generating print. Please try again.');
    }
  };

  const handleDownload = async () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toastWarning('Please allow popups for this site to download PDF');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice?.INVOICE_NUMBER}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            @media print {
              * { page-break-inside: avoid !important; }
              body { margin: 0; padding: 0; background: white; }
              @page { 
                size: A4;
                margin: 10mm; 
              }
            }
            body { font-size: 11px; }
            .compact-section { margin-bottom: 8px; }
            .compact-header { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          ${generateInvoiceHTML()}
          <script>
            // Wait for content to load, then generate PDF
            setTimeout(() => {
              const element = document.body;
              const opt = {
                margin: 10,
                filename: 'Invoice_${invoice?.INVOICE_NUMBER || 'Unknown'}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              
              html2pdf().set(opt).from(element).save().then(() => {
                window.close();
              });
            }, 1000);
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toastError('Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='ml-2 text-gray-600'>Loading invoice...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='text-center py-12'>
        <Receipt className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          Invoice not found
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          {error || 'The invoice you are looking for does not exist.'}
        </p>
        <div className='mt-6'>
          <Button
            variant='outline'
            onClick={() => router.push('/invoices')}
            className='flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Print Controls - Hidden when printing */}
      <div className='print:hidden bg-white shadow-sm border-b sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div className='flex items-center flex-wrap'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                className='mr-4 mb-2 sm:mb-0'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
              <div className='flex items-center'>
                <Receipt className='h-6 w-6 text-blue-600 mr-2' />
                <h1 className='text-lg font-semibold text-gray-900'>
                  Invoice {invoice?.INVOICE_NUMBER}
                </h1>
              </div>
            </div>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
              <Button
                variant='outline'
                onClick={handleDownload}
                className='flex items-center justify-center'
              >
                <Download className='h-4 w-4 mr-2' />
                تحميل PDF
              </Button>
              <Button
                variant='primary'
                onClick={handlePrint}
                className='flex items-center justify-center'
              >
                <Printer className='h-4 w-4 mr-2' />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className='max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8'>
        <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
          {/* Invoice Header */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6'>
            <div className='flex flex-col lg:flex-row justify-between items-start gap-4'>
              <div className='flex-1'>
                <h1 className='text-2xl sm:text-3xl font-bold mb-2'>فاتورة</h1>
                <p className='text-blue-100 text-base'>Invoice</p>
                <p className='text-blue-100 text-sm mt-2'>
                  رقم الفاتورة: {invoice?.INVOICE_NUMBER}
                </p>
              </div>
              <div className='text-right w-full lg:w-auto'>
                <div className='bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4'>
                  <div className='flex items-center mb-2'>
                    <Building2 className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
                    <span className='font-semibold text-sm sm:text-base'>عيادة الشفاء</span>
                  </div>
                  <p className='text-xs sm:text-sm text-blue-100'>Al-Shifa Clinic</p>
                  <p className='text-xs sm:text-sm text-blue-100 mt-1'>
                    <Phone className='h-3 w-3 inline mr-1' />
                    +20 1210927213
                  </p>
                  <p className='text-xs sm:text-sm text-blue-100'>
                    <Mail className='h-3 w-3 inline mr-1' />
                    info@alshifa-clinic.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details - Two Column Layout for larger screens */}
          <div className='p-4 sm:p-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Right Column */}
              <div className='space-y-4'>
                {/* Invoice Info */}
                <div className='border rounded-lg p-4 bg-gray-50'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                    معلومات الفاتورة
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>تاريخ الفاتورة:</span>
                      <div className='flex items-center'>
                        <Calendar className='h-4 w-4 mr-1' />
                        {formatDateSimple(invoice?.INVOICE_DATE || new Date())}
                      </div>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>حالة الدفع:</span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          invoice?.PAYMENT_STATUS || 'unpaid'
                        )}`}
                      >
                        {getStatusText(invoice?.PAYMENT_STATUS || 'unpaid')}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>أنشئ بواسطة:</span>
                      <span>{invoice?.CREATED_BY_NAME || 'System'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>تاريخ الطباعة:</span>
                      <span>{getCurrentPrintDate()}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Information */}
                <div className='border rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                    بيانات المريض
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>اسم المريض:</span>
                      <div className='flex items-center font-medium'>
                        <User className='h-4 w-4 mr-1' />
                        {invoice?.PATIENT_NAME}
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>رقم الهاتف:</span>
                      <div className='flex items-center'>
                        <Phone className='h-4 w-4 mr-1' />
                        {invoice?.PATIENT_PHONE}
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>البريد الإلكتروني:</span>
                      <div className='flex items-center text-xs'>
                        <Mail className='h-4 w-4 mr-1' />
                        {invoice?.PATIENT_EMAIL}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                {invoice?.APPOINTMENT_ID && (
                  <div className='border rounded-lg p-4 bg-blue-50'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                      بيانات الموعد
                    </h3>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>الطبيب:</span>
                        <span className='font-medium'>{invoice?.DOCTOR_NAME}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>التخصص:</span>
                        <span>{invoice?.DOCTOR_SPECIALTY}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>تاريخ الموعد:</span>
                        <span className='text-xs'>
                          {invoice?.APPOINTMENT_DATE
                            ? formatDateSimple(invoice.APPOINTMENT_DATE)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Left Column */}
              <div className='space-y-4'>
                {/* Invoice Items */}
                <div className='border rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                    تفاصيل الفاتورة
                  </h3>
                  <table className='w-full text-sm'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='text-right p-2 text-xs'>الوصف</th>
                        <th className='text-center p-2 text-xs'>الكمية</th>
                        <th className='text-left p-2 text-xs'>المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='border-t'>
                        <td className='p-2'>
                          {invoice?.APPOINTMENT_ID ? 'كشف طبي' : 'خدمة طبية'}
                        </td>
                        <td className='text-center p-2'>1</td>
                        <td className='text-left p-2 font-medium'>
                          {formatCurrency(invoice?.AMOUNT || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payment Summary */}
                <div className='border rounded-lg p-4 bg-gray-50'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                    ملخص الدفع
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>المبلغ الأساسي:</span>
                      <span className='font-medium'>{formatCurrency(invoice?.AMOUNT || 0)}</span>
                    </div>
                    {(invoice?.DISCOUNT || 0) > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>الخصم:</span>
                        <span className='text-red-600 font-medium'>
                          -{formatCurrency(invoice?.DISCOUNT || 0)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between border-t pt-2 font-bold text-base'>
                      <span>المجموع الكلي:</span>
                      <span className='text-blue-600'>
                        {formatCurrency((invoice?.AMOUNT || 0) - (invoice?.DISCOUNT || 0))}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>المبلغ المدفوع:</span>
                      <span className='text-green-600 font-medium'>
                        {formatCurrency(invoice?.PAID_AMOUNT || 0)}
                      </span>
                    </div>
                    {(invoice?.REMAINING_AMOUNT || 0) > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>المبلغ المتبقي:</span>
                        <span className='text-red-600 font-medium'>
                          {formatCurrency(invoice?.REMAINING_AMOUNT || 0)}
                        </span>
                      </div>
                    )}
                    {invoice?.PAYMENT_METHOD && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>طريقة الدفع:</span>
                        <span className='capitalize'>{invoice.PAYMENT_METHOD}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {invoice?.NOTES && (
                  <div className='border rounded-lg p-4 bg-yellow-50 border-yellow-200'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3 border-b pb-2'>
                      ملاحظات
                    </h3>
                    <div className='flex items-start'>
                      <FileText className='h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0' />
                      <p className='text-sm text-gray-700'>{invoice.NOTES}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className='mt-6 pt-4 border-t border-gray-200'>
              <div className='text-center text-xs text-gray-500'>
                <p>شكراً لاختياركم عيادة الشفاء - Thank you for choosing Al-Shifa Clinic</p>
                <p className='mt-1'>للاستفسارات: +20 1210927213 | info@alshifa-clinic.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}