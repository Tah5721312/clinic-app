import InvoiceDisplay from '@/components/InvoiceDisplay';

interface InvoiceDisplayPageProps {
  params: {
    id: string;
  };
}

export default function InvoiceDisplayPage({ params }: InvoiceDisplayPageProps) {
  return <InvoiceDisplay invoiceId={params.id} />;
}
