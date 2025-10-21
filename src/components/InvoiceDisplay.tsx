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
            .invoice-container { max-width: none; margin: 0; padding: 0; }
            .invoice-header { border-radius: 0; }
          }
        </style>
      </head>
      <body class="bg-white">
        <div class="max-w-4xl mx-auto p-5">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-lg">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-4xl font-bold mb-2">فاتورة</h1>
                <p class="text-blue-100 text-lg">Invoice</p>
                <p class="text-blue-100 text-sm mt-2">رقم الفاتورة: ${invoice?.INVOICE_NUMBER}</p>
              </div>
              <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-2">عيادة الشفاء</h3>
                <p class="text-sm text-blue-100">Al-Shifa Clinic</p>
                <p class="text-sm text-blue-100 mt-1">📞 +20 1210927213</p>
                <p class="text-sm text-blue-100">✉️ info@alshifa-clinic.com</p>
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="bg-white p-8">
            <!-- Invoice Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">تاريخ الفاتورة</h3>
                <p class="text-gray-900">📅 ${formatDate(invoice?.INVOICE_DATE || new Date())}</p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">حالة الدفع</h3>
                <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(invoice?.PAYMENT_STATUS || 'unpaid')}">
                  ${getStatusText(invoice?.PAYMENT_STATUS || 'unpaid')}
                </span>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">أنشئ بواسطة</h3>
                <p class="text-gray-900">${invoice?.CREATED_BY_NAME || 'System'}</p>
              </div>
            </div>

            <!-- Patient Info -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">بيانات المريض</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">اسم المريض</label>
                  <p class="text-gray-900">👤 ${invoice?.PATIENT_NAME}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">رقم الهاتف</label>
                  <p class="text-gray-900">📞 ${invoice?.PATIENT_PHONE}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">البريد الإلكتروني</label>
                  <p class="text-gray-900">✉️ ${invoice?.PATIENT_EMAIL}</p>
                </div>
              </div>
            </div>

            ${invoice?.APPOINTMENT_ID ? `
            <!-- Appointment Info -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">بيانات الموعد</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">الطبيب</label>
                  <p class="text-gray-900">${invoice?.DOCTOR_NAME}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">التخصص</label>
                  <p class="text-gray-900">${invoice?.DOCTOR_SPECIALTY}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">تاريخ الموعد</label>
                  <p class="text-gray-900">${invoice?.APPOINTMENT_DATE ? formatDateTime(invoice.APPOINTMENT_DATE) : 'N/A'}</p>
                </div>
              </div>
            </div>
            ` : ''}

            <!-- Invoice Items -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">تفاصيل الفاتورة</h3>
              <div class="overflow-hidden border border-gray-200 rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                      <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                      <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                      <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المجموع</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${invoice?.APPOINTMENT_ID ? 'كشف طبي' : 'خدمة طبية'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">1</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${formatCurrency(invoice?.AMOUNT || 0)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${formatCurrency(invoice?.AMOUNT || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Payment Summary -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">ملخص الدفع</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">المبلغ الأساسي:</span>
                  <span class="text-sm font-medium text-gray-900">${formatCurrency(invoice?.AMOUNT || 0)}</span>
                </div>
                ${(invoice?.DISCOUNT || 0) > 0 ? `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">الخصم:</span>
                  <span class="text-sm font-medium text-red-600">-${formatCurrency(invoice?.DISCOUNT || 0)}</span>
                </div>
                ` : ''}
                <div class="border-t pt-3">
                  <div class="flex justify-between items-center">
                    <span class="text-base font-semibold text-gray-900">المجموع الكلي:</span>
                    <span class="text-lg font-bold text-blue-600">${formatCurrency((invoice?.AMOUNT || 0) - (invoice?.DISCOUNT || 0))}</span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">المبلغ المدفوع:</span>
                  <span class="text-sm font-medium text-green-600">${formatCurrency(invoice?.PAID_AMOUNT || 0)}</span>
                </div>
                ${invoice?.REMAINING_AMOUNT && invoice.REMAINING_AMOUNT > 0 ? `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">المبلغ المتبقي:</span>
                  <span class="text-sm font-medium text-red-600">${formatCurrency(invoice.REMAINING_AMOUNT)}</span>
                </div>
                ` : ''}
                ${invoice?.PAYMENT_METHOD ? `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">طريقة الدفع:</span>
                  <span class="text-sm font-medium text-gray-900">${invoice.PAYMENT_METHOD}</span>
                </div>
                ` : ''}
                ${invoice?.PAYMENT_DATE ? `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">تاريخ الدفع:</span>
                  <span class="text-sm font-medium text-gray-900">${formatDate(invoice.PAYMENT_DATE)}</span>
                </div>
                ` : ''}
              </div>
            </div>

            ${invoice?.NOTES ? `
            <!-- Notes -->
            <div class="mt-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">ملاحظات</h3>
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-sm text-gray-700">📝 ${invoice.NOTES}</p>
              </div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="mt-12 pt-8 border-t border-gray-200">
              <div class="text-center text-sm text-gray-500">
                <p>شكراً لاختياركم عيادة الشفاء</p>
                <p class="mt-1">Thank you for choosing Al-Shifa Clinic</p>
                <p class="mt-2">للاستفسارات: +20 1210927213 | info@alshifa-clinic.com</p>
              </div>
            </div>
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
          alert('Please allow popups for this site to print');
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
      alert('Error generating print. Please try again.');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = new Blob([generateInvoiceHTML()], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoice?.INVOICE_NUMBER || 'Unknown'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
                Download
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
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-8'>
            <div className='flex flex-col lg:flex-row justify-between items-start gap-6'>
              <div className='flex-1'>
                <h1 className='text-2xl sm:text-3xl font-bold mb-2'>فاتورة</h1>
                <p className='text-blue-100 text-base sm:text-lg'>Invoice</p>
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

          {/* Invoice Details */}
          <div className='p-4 sm:p-6 lg:p-8'>
            {/* Invoice Info */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
              <div>
                <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  تاريخ الفاتورة
                </h3>
                <div className='flex items-center text-gray-900'>
                  <Calendar className='h-4 w-4 mr-2' />
                  {formatDate(invoice?.INVOICE_DATE || new Date())}
                </div>
              </div>
              <div>
                <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  حالة الدفع
                </h3>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(
                    invoice?.PAYMENT_STATUS || 'unpaid'
                  )}`}
                >
                  {getStatusText(invoice?.PAYMENT_STATUS || 'unpaid')}
                </span>
              </div>
              <div>
                <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  أنشئ بواسطة
                </h3>
                <p className='text-gray-900'>{invoice?.CREATED_BY_NAME || 'System'}</p>
              </div>
            </div>

            {/* Patient Information */}
            <div className='mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 border-b pb-2'>
                بيانات المريض
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    اسم المريض
                  </label>
                  <div className='flex items-center text-gray-900'>
                    <User className='h-4 w-4 mr-2' />
                    {invoice?.PATIENT_NAME}
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    رقم الهاتف
                  </label>
                  <div className='flex items-center text-gray-900'>
                    <Phone className='h-4 w-4 mr-2' />
                    {invoice?.PATIENT_PHONE}
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    البريد الإلكتروني
                  </label>
                  <div className='flex items-center text-gray-900'>
                    <Mail className='h-4 w-4 mr-2' />
                    {invoice?.PATIENT_EMAIL}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            {invoice?.APPOINTMENT_ID && (
              <div className='mb-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 border-b pb-2'>
                  بيانات الموعد
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-500 mb-1'>
                      الطبيب
                    </label>
                    <p className='text-gray-900'>{invoice?.DOCTOR_NAME}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-500 mb-1'>
                      التخصص
                    </label>
                    <p className='text-gray-900'>{invoice?.DOCTOR_SPECIALTY}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-500 mb-1'>
                      تاريخ الموعد
                    </label>
                    <p className='text-gray-900'>
                      {invoice?.APPOINTMENT_DATE
                        ? formatDateTime(invoice.APPOINTMENT_DATE!)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className='mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 border-b pb-2'>
                تفاصيل الفاتورة
              </h3>
              
              {/* Desktop Table */}
              <div className='hidden sm:block overflow-hidden border border-gray-200 rounded-lg'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        الوصف
                      </th>
                      <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        الكمية
                      </th>
                      <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        السعر
                      </th>
                      <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        المجموع
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    <tr>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {invoice?.APPOINTMENT_ID ? 'كشف طبي' : 'خدمة طبية'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center'>
                        1
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center'>
                        {formatCurrency(invoice?.AMOUNT || 0)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center'>
                        {formatCurrency(invoice?.AMOUNT || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className='sm:hidden bg-gray-50 rounded-lg p-4 space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-500'>الوصف:</span>
                  <span className='text-sm text-gray-900'>
                    {invoice?.APPOINTMENT_ID ? 'كشف طبي' : 'خدمة طبية'}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-500'>الكمية:</span>
                  <span className='text-sm text-gray-900'>1</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-500'>السعر:</span>
                  <span className='text-sm text-gray-900'>
                    {formatCurrency(invoice?.AMOUNT || 0)}
                  </span>
                </div>
                <div className='flex justify-between items-center border-t pt-3'>
                  <span className='text-sm font-semibold text-gray-700'>المجموع:</span>
                  <span className='text-sm font-bold text-blue-600'>
                    {formatCurrency(invoice?.AMOUNT || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className='bg-gray-50 rounded-lg p-4 sm:p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                ملخص الدفع
              </h3>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>المبلغ الأساسي:</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatCurrency(invoice?.AMOUNT || 0)}
                  </span>
                </div>
                
                {(invoice?.DISCOUNT || 0) > 0 && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>الخصم:</span>
                    <span className='text-sm font-medium text-red-600'>
                      -{formatCurrency(invoice?.DISCOUNT || 0)}
                    </span>
                  </div>
                )}
                
                <div className='border-t pt-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm sm:text-base font-semibold text-gray-900'>
                      المجموع الكلي:
                    </span>
                    <span className='text-base sm:text-lg font-bold text-blue-600'>
                      {formatCurrency((invoice?.AMOUNT || 0) - (invoice?.DISCOUNT || 0))}
                    </span>
                  </div>
                </div>
                
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>المبلغ المدفوع:</span>
                  <span className='text-sm font-medium text-green-600'>
                    {formatCurrency(invoice?.PAID_AMOUNT || 0)}
                  </span>
                </div>
                
                {(invoice?.REMAINING_AMOUNT || 0) > 0 && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>المبلغ المتبقي:</span>
                    <span className='text-sm font-medium text-red-600'>
                      {formatCurrency(invoice?.REMAINING_AMOUNT || 0)}
                    </span>
                  </div>
                )}
                
                {invoice?.PAYMENT_METHOD && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>طريقة الدفع:</span>
                    <span className='text-sm font-medium text-gray-900 capitalize'>
                      {invoice?.PAYMENT_METHOD}
                    </span>
                  </div>
                )}
                
                {invoice?.PAYMENT_DATE && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>تاريخ الدفع:</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatDate(invoice?.PAYMENT_DATE || new Date())}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice?.NOTES && (
              <div className='mt-6 sm:mt-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 border-b pb-2'>
                  ملاحظات
                </h3>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4'>
                  <div className='flex items-start'>
                    <FileText className='h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0' />
                    <p className='text-sm text-gray-700'>{invoice?.NOTES}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className='mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200'>
              <div className='text-center text-xs sm:text-sm text-gray-500'>
                <p>شكراً لاختياركم عيادة الشفاء</p>
                <p className='mt-1'>Thank you for choosing Al-Shifa Clinic</p>
                <p className='mt-2 break-words'>
                  للاستفسارات: +20 1210927213 | info@alshifa-clinic.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
