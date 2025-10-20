'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import InvoiceForm from '@/components/InvoiceForm';
import Button from '@/components/buttons/Button';

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/invoices');
  };

  const handleCancel = () => {
    router.push('/invoices');
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
          <h1 className='text-2xl font-bold text-gray-900'>
            Create New Invoice
          </h1>
          <p className='text-gray-600'>Add a new invoice for a patient</p>
        </div>
      </div>

      {/* Invoice Form */}
      <InvoiceForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
