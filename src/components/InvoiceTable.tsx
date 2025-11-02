'use client';

import {
  Receipt,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,Printer,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Invoice } from '@/lib/types';
import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';
import { toastError } from '@/lib/toast';

interface InvoiceTableProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: number) => void;
  onPaymentUpdate?: (
    invoiceId: number,
    paidAmount: number,
    paymentMethod?: string
  ) => void;
  showPatientColumn?: boolean;
  showActions?: boolean;
}

export default function InvoiceTable({
  invoices,
  onEdit,
  onDelete,
  onPaymentUpdate,
  showPatientColumn = true,
  showActions = true,
}: InvoiceTableProps) {
  const router = useRouter();
  const [editingPayment, setEditingPayment] = useState<number | null>(null);
  const [paymentData, setPaymentData] = useState<{
    paid_amount: number;
    payment_method: string;
  }>({ paid_amount: 0, payment_method: '' });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePaymentEdit = (invoice: Invoice) => {
    setEditingPayment(invoice.INVOICE_ID);
    setPaymentData({
      paid_amount: invoice.PAID_AMOUNT,
      payment_method: invoice.PAYMENT_METHOD || '',
    });
  };

  const handlePaymentSave = async (invoiceId: number) => {
    try {
      const response = await fetch(
        `${DOMAIN}/api/invoices/${invoiceId}/payment`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment');
      }

      if (onPaymentUpdate) {
        onPaymentUpdate(
          invoiceId,
          paymentData.paid_amount,
          paymentData.payment_method
        );
      }

      setEditingPayment(null);
      setPaymentData({ paid_amount: 0, payment_method: '' });
    } catch (error) {
      console.error('Error updating payment:', error);
      toastError('Failed to update payment. Please try again.');
    }
  };

  const handlePaymentCancel = () => {
    setEditingPayment(null);
    setPaymentData({ paid_amount: 0, payment_method: '' });
  };

  if (invoices.length === 0) {
    return (
      <div className='text-center py-12'>
        <Receipt className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          No invoices found
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          Get started by creating a new invoice.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Desktop Table */}
      <div className='hidden lg:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg'>
        <table className='min-w-full divide-y divide-gray-300'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Invoice #
              </th>
              {showPatientColumn && (
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Patient
                </th>
              )}
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Date
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Amount
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Paid
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              {showActions && (
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {invoices.map((invoice) => (
              <tr key={invoice.INVOICE_ID} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <Receipt className='h-5 w-5 text-gray-400 mr-2' />
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {invoice.INVOICE_NUMBER}
                      </div>
                      {invoice.DOCTOR_NAME && (
                        <div className='text-sm text-gray-500'>
                          Dr. {invoice.DOCTOR_NAME}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {showPatientColumn && (
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <User className='h-5 w-5 text-gray-400 mr-2' />
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {invoice.PATIENT_NAME}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {invoice.PATIENT_PHONE}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <Calendar className='h-5 w-5 text-gray-400 mr-2' />
                    <div className='text-sm text-gray-900'>
                      {formatDate(invoice.INVOICE_DATE)}
                    </div>
                  </div>
                </td>

                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(invoice.TOTAL_AMOUNT)}
                  </div>
                  {invoice.DISCOUNT > 0 && (
                    <div className='text-sm text-gray-500'>
                      -{formatCurrency(invoice.DISCOUNT)} discount
                    </div>
                  )}
                </td>

                <td className='px-6 py-4 whitespace-nowrap'>
                  {editingPayment === invoice.INVOICE_ID ? (
                    <div className='space-y-2'>
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
                        className='w-24 px-2 py-1 text-sm border border-gray-300 rounded'
                      />
                      <select
                        value={paymentData.payment_method}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            payment_method: e.target.value,
                          }))
                        }
                        className='w-24 px-2 py-1 text-sm border border-gray-300 rounded'
                      >
                        <option value=''>Method</option>
                        <option value='cash'>Cash</option>
                        <option value='card'>Card</option>
                        <option value='bank_transfer'>Transfer</option>
                        <option value='insurance'>Insurance</option>
                      </select>
                      <div className='flex space-x-1'>
                        <button
                          onClick={() => handlePaymentSave(invoice.INVOICE_ID)}
                          className='text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600'
                        >
                          Save
                        </button>
                        <button
                          onClick={handlePaymentCancel}
                          className='text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className='text-sm text-gray-900'>
                        {formatCurrency(invoice.PAID_AMOUNT)}
                      </div>
                      {invoice.PAYMENT_METHOD && (
                        <div className='text-sm text-gray-500'>
                          {invoice.PAYMENT_METHOD}
                        </div>
                      )}
                      {invoice.REMAINING_AMOUNT &&
                        invoice.REMAINING_AMOUNT > 0 && (
                          <div className='text-sm text-red-600'>
                            Remaining: {formatCurrency(invoice.REMAINING_AMOUNT)}
                          </div>
                        )}
                    </div>
                  )}
                </td>

                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      invoice.PAYMENT_STATUS
                    )}`}
                  >
                    {getStatusText(invoice.PAYMENT_STATUS)}
                  </span>
                </td>

                {showActions && (
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end space-x-2'>
                      {invoice.PAYMENT_STATUS !== 'paid' && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='p-2'
                          onClick={() => handlePaymentEdit(invoice)}
                          title='Update Payment'
                        >
                          <CreditCard className='h-4 w-4' />
                        </Button>
                      )}

                      <Link href={`/invoices/${invoice.INVOICE_ID}`}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='p-2'
                          title='View Invoice'
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                      </Link>

                      {onEdit && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='p-2'
                          onClick={() => onEdit(invoice)}
                          title={invoice.PAYMENT_STATUS === 'paid' ? 'Cannot edit paid invoice' : 'Edit Invoice'}
                          disabled={invoice.PAYMENT_STATUS === 'paid'}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                      )}

                      <Button
                        variant='outline'
                        size='sm'
                        className='p-2'
                        title='Print Invoice'
                        onClick={() => router.push(`/invoices/${invoice.INVOICE_ID}/display`)}
                      >
                        <Printer className='h-4 w-4'/>
                      </Button>

                      {onDelete && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='p-2 text-red-600 hover:text-red-700'
                          onClick={() => onDelete(invoice.INVOICE_ID)}
                          title='Delete Invoice'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className='lg:hidden space-y-4'>
        {invoices.map((invoice) => (
          <div key={invoice.INVOICE_ID} className='bg-white rounded-lg shadow p-4 border border-gray-200'>
            {/* Header */}
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center'>
                <Receipt className='h-5 w-5 text-blue-600 mr-2' />
                <div>
                  <div className='font-semibold text-gray-900'>
                    {invoice.INVOICE_NUMBER}
                  </div>
                  {invoice.DOCTOR_NAME && (
                    <div className='text-sm text-gray-500'>
                      Dr. {invoice.DOCTOR_NAME}
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  invoice.PAYMENT_STATUS
                )}`}
              >
                {getStatusText(invoice.PAYMENT_STATUS)}
              </span>
            </div>

            {/* Patient Info */}
            {showPatientColumn && (
              <div className='flex items-center mb-3'>
                <User className='h-4 w-4 text-gray-400 mr-2' />
                <div>
                  <div className='text-sm font-medium text-gray-900'>
                    {invoice.PATIENT_NAME}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {invoice.PATIENT_PHONE}
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className='flex items-center mb-3'>
              <Calendar className='h-4 w-4 text-gray-400 mr-2' />
              <div className='text-sm text-gray-900'>
                {formatDate(invoice.INVOICE_DATE)}
              </div>
            </div>

            {/* Amount */}
            <div className='mb-3'>
              <div className='text-lg font-semibold text-gray-900'>
                {formatCurrency(invoice.TOTAL_AMOUNT)}
              </div>
              {invoice.DISCOUNT > 0 && (
                <div className='text-sm text-gray-500'>
                  -{formatCurrency(invoice.DISCOUNT)} discount
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className='mb-4'>
              {editingPayment === invoice.INVOICE_ID ? (
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Paid Amount
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
                      className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
                      className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Select Method</option>
                      <option value='cash'>Cash</option>
                      <option value='card'>Card</option>
                      <option value='bank_transfer'>Bank Transfer</option>
                      <option value='insurance'>Insurance</option>
                    </select>
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handlePaymentSave(invoice.INVOICE_ID)}
                      className='flex-1 bg-blue-500 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-600'
                    >
                      Save
                    </button>
                    <button
                      onClick={handlePaymentCancel}
                      className='flex-1 bg-gray-500 text-white px-3 py-2 text-sm rounded-md hover:bg-gray-600'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>Paid:</span>
                    <span className='text-sm text-gray-900'>
                      {formatCurrency(invoice.PAID_AMOUNT)}
                    </span>
                  </div>
                  {invoice.PAYMENT_METHOD && (
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-700'>Method:</span>
                      <span className='text-sm text-gray-900'>{invoice.PAYMENT_METHOD}</span>
                    </div>
                  )}
                  {invoice.REMAINING_AMOUNT && invoice.REMAINING_AMOUNT > 0 && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-red-600'>Remaining:</span>
                      <span className='text-sm text-red-600'>
                        {formatCurrency(invoice.REMAINING_AMOUNT)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex flex-wrap gap-2 pt-3 border-t border-gray-200'>
                {invoice.PAYMENT_STATUS !== 'paid' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Update Payment clicked for invoice:', invoice.INVOICE_ID);
                      handlePaymentEdit(invoice);
                    }}
                    className='flex items-center'
                  >
                    <CreditCard className='h-4 w-4 mr-1' />
                    Update Payment
                  </Button>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('View clicked for invoice:', invoice.INVOICE_ID);
                    router.push(`/invoices/${invoice.INVOICE_ID}`);
                  }}
                  className='flex items-center'
                >
                  <Eye className='h-4 w-4 mr-1' />
                  View
                </Button>

                {onEdit && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit clicked for invoice:', invoice.INVOICE_ID);
                      onEdit(invoice);
                    }}
                    className='flex items-center'
                    disabled={invoice.PAYMENT_STATUS === 'paid'}
                    title={invoice.PAYMENT_STATUS === 'paid' ? 'Cannot edit paid invoice' : 'Edit Invoice'}
                  >
                    <Edit className='h-4 w-4 mr-1' />
                    Edit
                  </Button>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Print clicked for invoice:', invoice.INVOICE_ID);
                    router.push(`/invoices/${invoice.INVOICE_ID}/display`);
                  }}
                  className='flex items-center'
                >
                  <Printer className='h-4 w-4 mr-1' />
                  Print
                </Button>

                {onDelete && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Delete clicked for invoice:', invoice.INVOICE_ID);
                      onDelete(invoice.INVOICE_ID);
                    }}
                    className='flex items-center text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='h-4 w-4 mr-1' />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
