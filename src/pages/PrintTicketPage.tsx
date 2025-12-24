import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PrintTicket } from '@/components/ticket/PrintTicket';
import { Button } from '@/components/ui/button';
import { getTicketById, getPaymentByTicketId, getSettings } from '@/lib/storage';
import { TicketWithPayment, CompanySettings } from '@/types/ticket';
import { useReactToPrint } from 'react-to-print';

export default function PrintTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketWithPayment | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const t = getTicketById(id);
    if (t) {
      const payment = getPaymentByTicketId(id);
      setTicket({ ...t, payment });
    }
    setSettings(getSettings());
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ticket-${ticket?.ticketNo}`,
  });

  if (!ticket || !settings) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Ticket not found</p>
          <Link to="/">
            <Button variant="link">Go to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 no-print">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/ticket/${id}`}>
                <Button variant="ghost" size="sm" className="mb-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Ticket
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Print Preview</h1>
              <p className="text-muted-foreground">
                Ticket: <span className="font-mono">{ticket.ticketNo}</span>
              </p>
            </div>
            <Button onClick={() => handlePrint()} size="lg" className="gap-2">
              <Printer className="h-5 w-5" />
              Print Ticket
            </Button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="bg-muted p-8 rounded-lg overflow-auto">
          <div className="bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
            <PrintTicket ref={printRef} ticket={ticket} settings={settings} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
