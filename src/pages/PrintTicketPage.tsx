import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PrintTicket } from '@/components/ticket/PrintTicket';
import { PrintOnPrePrintedTicket } from '@/components/ticket/PrintOnPrePrintedTicket';
import { Button } from '@/components/ui/button';
import { TicketWithPayment, CompanySettings, Ticket, Payment } from '@/types/ticket';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PrintTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketWithPayment | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [printMode, setPrintMode] = useState<'normal' | 'preprinted'>('normal');
  const printRef = useRef<HTMLDivElement>(null);
  const prePrintedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (ticketError) throw ticketError;

        if (ticketData) {
          // Fetch payment for this ticket
          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('ticket_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          const transformedTicket: Ticket = {
            id: ticketData.id,
            ticketNo: ticketData.ticket_no,
            bookingDateTime: ticketData.booking_date_time,
            journeyDate: ticketData.journey_date,
            passengerName: ticketData.passenger_name,
            passengerPhone: ticketData.passenger_phone,
            pickup: ticketData.passenger_address || undefined,
            toursTo: ticketData.tours_to,
            noOfTourist: ticketData.no_of_tourist,
            seatNo: ticketData.seat_no || undefined,
            repTime: ticketData.rep_time || undefined,
            depTime: ticketData.dep_time || undefined,
            amount: Number(ticketData.amount),
            surcharges: ticketData.surcharges ? Number(ticketData.surcharges) : undefined,
            travelsName: ticketData.travels_name || undefined,
            busName: ticketData.bus_name || undefined,
            busNo: ticketData.bus_no || undefined,
            branch: ticketData.branch || undefined,
            bookedBy: ticketData.booked_by || undefined,
            withFamily: ticketData.with_family || false,
            collectionStatus: ticketData.collection_status as 'Paid' | 'Unpaid',
          };

          const payment: Payment | undefined = paymentData ? {
            id: paymentData.id,
            ticketId: paymentData.ticket_id,
            receivedByName: paymentData.received_by_name,
            paymentMode: paymentData.payment_mode as 'Cash' | 'UPI' | 'Card' | 'Other',
            paidAmount: Number(paymentData.paid_amount),
            paidAt: paymentData.paid_at,
          } : undefined;

          setTicket({ ...transformedTicket, payment });
        }

        // Fetch company settings - first try Supabase, then fallback to localStorage
        const { data: settingsData } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsData) {
          setSettings({
            name: settingsData.name,
            address: settingsData.address || '',
            phone: settingsData.phone || '',
            logoUrl: settingsData.logo_url || undefined,
            footerNote: settingsData.footer_note || 'Wish you a Happy Journey!',
            ticketWidth: settingsData.ticket_width || 280,
            ticketHeight: settingsData.ticket_height || 140,
          });
        } else {
          // Default settings if none exist in database
          setSettings({
            name: 'ROYAL TRAVELS',
            address: '',
            phone: '',
            footerNote: 'Wish you a Happy Journey!',
            ticketWidth: 280,
            ticketHeight: 140,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchedAt(new Date());
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ticket-${ticket?.ticketNo}`,
  });

  const handlePrePrintedPrint = useReactToPrint({
    contentRef: prePrintedRef,
    documentTitle: `Ticket-${ticket?.ticketNo}-PrePrinted`,
  });

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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
              {fetchedAt && (
                <p className="text-xs text-muted-foreground">
                  Synced: {fetchedAt.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePrint()} 
                size="lg" 
                className="gap-2"
                variant={printMode === 'normal' ? 'default' : 'outline'}
              >
                <Printer className="h-5 w-5" />
                Print Ticket
              </Button>
              <Button 
                onClick={() => handlePrePrintedPrint()} 
                size="lg" 
                variant="secondary"
                className="gap-2"
              >
                <FileText className="h-5 w-5" />
                Print on Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Print Mode Toggle */}
        <div className="mb-4 no-print flex gap-2">
          <Button
            variant={printMode === 'normal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPrintMode('normal')}
          >
            Normal Print
          </Button>
          <Button
            variant={printMode === 'preprinted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPrintMode('preprinted')}
          >
            Pre-printed Ticket (105mm x 175mm)
          </Button>
        </div>

        {/* Print Preview */}
        <div className="bg-muted p-8 rounded-lg overflow-auto">
          {printMode === 'normal' ? (
            <div className="bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
              <PrintTicket ref={printRef} ticket={ticket} settings={settings} />
            </div>
          ) : (
            <div 
              className="mx-auto border-2 border-dashed border-gray-400 bg-amber-50" 
              style={{ 
                width: '105mm', 
                height: '175mm',
                position: 'relative',
              }}
            >
              {/* Guide text for pre-printed mode */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-center p-4">
                <p className="text-xs text-gray-600">
                  Pre-printed ticket<br/>
                  105mm x 175mm
                </p>
              </div>
              <PrintOnPrePrintedTicket ref={prePrintedRef} ticket={ticket} />
            </div>
          )}
        </div>

        {/* Hidden print area for pre-printed ticket */}
        <div className="hidden">
          <PrintOnPrePrintedTicket ref={prePrintedRef} ticket={ticket} />
        </div>
      </div>
    </Layout>
  );
}
