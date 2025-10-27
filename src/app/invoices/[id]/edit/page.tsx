'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Invoice, CreateInvoiceDto } from '@/lib/types';
import InvoiceForm from '@/components/InvoiceForm';
import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSuccess = () => {
    router.push(`/invoices/${id}`);
  };

  const handleCancel = () => {
    router.push(`/invoices/${id}`);
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

  // Check if invoice is paid and prevent editing (unless super admin)
  const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;
  
  if (invoice.PAYMENT_STATUS === 'paid' && !isSuperAdmin) {
    return (
      <div className='text-center py-12'>
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          Cannot Edit Paid Invoice
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          This invoice has been fully paid and cannot be edited.
        </p>
        <div className='mt-6'>
          <Button
            variant='outline'
            onClick={() => router.push(`/invoices/${id}`)}
            className='flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Invoice
          </Button>
        </div>
      </div>
    );
  }

  const editData: CreateInvoiceDto & { invoice_id: number } = {
    patient_id: invoice.PATIENT_ID as number,
    appointment_id: invoice.APPOINTMENT_ID ?? undefined,
    amount: (invoice.AMOUNT ?? invoice.TOTAL_AMOUNT) as number,
    discount: invoice.DISCOUNT,
    notes: invoice.NOTES ?? undefined,
    payment_method: invoice.PAYMENT_METHOD ?? undefined,
    paid_amount: invoice.PAID_AMOUNT,
    invoice_id: invoice.INVOICE_ID,
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='mr-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <div>
          <h1 className='text-2xl font-bold '>Edit Invoice</h1>
          <p className=''>Update invoice details</p>
        </div>
      </div>

      {/* Invoice Form */}
      <InvoiceForm
        patientId={invoice.PATIENT_ID != null ? String(invoice.PATIENT_ID) : undefined}
        appointmentId={invoice.APPOINTMENT_ID != null ? String(invoice.APPOINTMENT_ID) : undefined}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        editData={editData}
      />
    </div>
  );
}
