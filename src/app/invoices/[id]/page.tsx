'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Receipt,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';

import { Invoice } from '@/lib/types';
import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';
import { toastError } from '@/lib/toast';

export default function InvoiceViewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paid_amount: 0,
    payment_method: '',
  });

  const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${DOMAIN}/api/invoices/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Invoice not found');
          }
          throw new Error('Failed to fetch invoice');
        }

        const data = await response.json();
        setInvoice(data);
        setPaymentData({
          paid_amount: data.PAID_AMOUNT,
          payment_method: data.PAYMENT_METHOD || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handlePaymentUpdate = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(
        `${DOMAIN}/api/invoices/${invoice.INVOICE_ID}/payment`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update payment');
      }

      // Update the invoice data
      const updatedInvoice = {
        ...invoice,
        PAID_AMOUNT: paymentData.paid_amount,
        PAYMENT_METHOD: paymentData.payment_method,
        PAYMENT_STATUS: (paymentData.paid_amount >= invoice.TOTAL_AMOUNT
          ? 'paid'
          : paymentData.paid_amount > 0
          ? 'partial'
          : 'unpaid') as 'paid' | 'partial' | 'unpaid' | 'cancelled',
        REMAINING_AMOUNT: invoice.TOTAL_AMOUNT - paymentData.paid_amount,
      };

      setInvoice(updatedInvoice);
      setEditingPayment(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update payment');
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(
        `${DOMAIN}/api/invoices/${invoice.INVOICE_ID}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      router.push('/invoices');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className='space-y-4 sm:space-y-6'>
      {/* Header */}
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
            <Receipt className='h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mr-3' />
            <div>
              <h1 className='text-lg sm:text-2xl font-bold'>
                Invoice {invoice.INVOICE_NUMBER}
              </h1>
              <p className='text-sm sm:text-base '>Invoice Details</p>
            </div>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          {(invoice.PAYMENT_STATUS !== 'paid' || isSuperAdmin) && (
            <Button
              variant='outline'
              onClick={() => router.push(`/invoices/${invoice.INVOICE_ID}/edit`)}
              className='flex items-center justify-center'
            >
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </Button>
          )}
          {isSuperAdmin && (
            <Button
              variant='outline'
              onClick={handleDelete}
              className='flex items-center justify-center text-red-600 hover:text-red-700'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
        {/* Invoice Details */}
        <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
          {/* Basic Information */}
          <div className='card rounded-lg shadow p-4 sm:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Invoice Information
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Invoice Number
                </label>
                <p className='mt-1 text-sm text-gray-900'>
                  {invoice.INVOICE_NUMBER}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Invoice Date
                </label>
                <p className='mt-1 text-sm text-gray-900 flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' />
                  {formatDate(invoice.INVOICE_DATE)}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    invoice.PAYMENT_STATUS
                  )}`}
                >
                  {getStatusText(invoice.PAYMENT_STATUS)}
                </span>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Created By
                </label>
                <p className='mt-1 text-sm text-gray-900'>
                  {invoice.CREATED_BY_NAME || 'System'}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className='card rounded-lg shadow p-4 sm:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Patient Information
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Patient Name
                </label>
                <p className='mt-1 text-sm text-gray-900 flex items-center'>
                  <User className='h-4 w-4 mr-1' />
                  {invoice.PATIENT_NAME}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Phone
                </label>
                <p className='mt-1 text-sm text-gray-900'>
                  {invoice.PATIENT_PHONE}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Email
                </label>
                <p className='mt-1 text-sm text-gray-900'>
                  {invoice.PATIENT_EMAIL}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Information */}
          {invoice.APPOINTMENT_ID && (
            <div className='card rounded-lg shadow p-4 sm:p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Appointment Information
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-500'>
                    Doctor
                  </label>
                  <p className='mt-1 text-sm text-gray-900'>
                    {invoice.DOCTOR_NAME}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-500'>
                    Specialty
                  </label>
                  <p className='mt-1 text-sm text-gray-900'>
                    {invoice.DOCTOR_SPECIALTY}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-500'>
                    Appointment Date
                  </label>
                  <p className='mt-1 text-sm text-gray-900'>
                    {invoice.APPOINTMENT_DATE
                      ? formatDate(invoice.APPOINTMENT_DATE)
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.NOTES && (
            <div className='card rounded-lg shadow p-4 sm:p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Notes
              </h2>
              <p className='text-sm text-gray-900'>{invoice.NOTES}</p>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className='space-y-4 sm:space-y-6'>
          <div className='card rounded-lg shadow p-4 sm:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Payment Information
            </h2>

            {editingPayment ? (
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Paid Amount (EGP)
                  </label>
                  <input
                    type='number'
                    value={paymentData.paid_amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        paid_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min='0'
                    max={invoice.TOTAL_AMOUNT}
                    step='0.01'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Payment Method
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Select method</option>
                    <option value='cash'>Cash</option>
                    <option value='card'>Credit/Debit Card</option>
                    <option value='bank_transfer'>Bank Transfer</option>
                    <option value='insurance'>Insurance</option>
                    <option value='other'>Other</option>
                  </select>
                </div>

                <div className='flex flex-col sm:flex-row gap-2'>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={handlePaymentUpdate}
                    className='flex-1'
                  >
                    Save
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setEditingPayment(false)}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>
                    Amount:
                  </span>
                  <span className='text-sm text-gray-900'>
                    {formatCurrency((invoice.AMOUNT ?? 0))}
                  </span>
                </div>

                {invoice.DISCOUNT > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-sm font-medium text-gray-500'>
                      Discount:
                    </span>
                    <span className='text-sm text-red-600'>
                      -{formatCurrency(invoice.DISCOUNT)}
                    </span>
                  </div>
                )}

                <div className='border-t pt-2'>
                  <div className='flex justify-between'>
                    <span className='text-base font-semibold text-gray-900'>
                      Total:
                    </span>
                    <span className='text-base font-semibold text-gray-900'>
                      {formatCurrency((invoice.AMOUNT ?? 0) - invoice.DISCOUNT)}
                    </span>
                  </div>
                </div>

                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>
                    Paid:
                  </span>
                  <span className='text-sm text-gray-900'>
                    {formatCurrency(invoice.PAID_AMOUNT)}
                  </span>
                </div>

                {invoice.REMAINING_AMOUNT && invoice.REMAINING_AMOUNT > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-sm font-medium text-gray-500'>
                      Remaining:
                    </span>
                    <span className='text-sm text-red-600'>
                      {formatCurrency(invoice.REMAINING_AMOUNT)}
                    </span>
                  </div>
                )}

                {invoice.PAYMENT_METHOD && (
                  <div className='flex justify-between'>
                    <span className='text-sm font-medium text-gray-500'>
                      Method:
                    </span>
                    <span className='text-sm text-gray-900 capitalize'>
                      {invoice.PAYMENT_METHOD}
                    </span>
                  </div>
                )}

                {invoice.PAYMENT_DATE && (
                  <div className='flex justify-between'>
                    <span className='text-sm font-medium text-gray-500'>
                      Payment Date:
                    </span>
                    <span className='text-sm text-gray-900'>
                      {formatDate(invoice.PAYMENT_DATE)}
                    </span>
                  </div>
                )}

                {invoice.PAYMENT_STATUS !== 'paid' && (
                  <Button
                    variant='outline'
                    onClick={() => setEditingPayment(true)}
                    className='w-full flex items-center justify-center'
                  >
                    <CreditCard className='h-4 w-4 mr-2' />
                    Update Payment
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
