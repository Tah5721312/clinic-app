import InvoiceDisplay from '@/components/InvoiceDisplay';

interface InvoiceDisplayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceDisplayPage({ params }: InvoiceDisplayPageProps) {
  const { id } = await params;
  return <InvoiceDisplay invoiceId={id} />;
}
