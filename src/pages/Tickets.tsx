import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Search,
  Download,
  Filter,
  CalendarIcon,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { TicketTable } from '@/components/dashboard/TicketTable';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import { BookedBySummary } from '@/components/dashboard/BookedBySummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTickets, TicketWithPayment } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';

interface PayEntry {
  id: string;
  user_id: string;
  ticket_no: string;
  travels_name: string;
  tours_to: string | null;
  booked_by: string | null;
  amount: number;
  collection_status: 'Paid' | 'Unpaid';
  paid_by: string | null;
  receiver_name: string | null;
  payment_mode: string | null;
  entry_payment_mode: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function Tickets() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tickets, loading, fetchTickets, savePayment, deleteTicket } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [paymentTicket, setPaymentTicket] = useState<TicketWithPayment | null>(null);
  const [entries, setEntries] = useState<PayEntry[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('staff_members').select('user_id, full_name, username');
      if (data) {
        const m: Record<string, string> = {};
        (data as any[]).forEach(s => { m[s.user_id] = s.full_name || s.username; });
        setStaffMap(m);
      }
    })();
  }, []);

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const start = new Date(dateStr + 'T00:00:00').toISOString();
    const end = new Date(dateStr + 'T23:59:59.999').toISOString();
    (async () => {
      const { data } = await (supabase as any)
        .from('pay_collection_entries')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });
      setEntries((data || []) as PayEntry[]);
    })();
  }, [selectedDate]);


  // Filter tickets by selected date
  const dateTickets = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tickets.filter((ticket) => {
      const ticketDate = format(new Date(ticket.bookingDateTime), 'yyyy-MM-dd');
      return ticketDate === dateStr;
    });
  }, [tickets, selectedDate]);

  // Apply search and status filters
  const filteredTickets = useMemo(() => {
    let result = [...dateTickets];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.ticketNo.toLowerCase().includes(query) ||
        ticket.passengerName.toLowerCase().includes(query) ||
        ticket.passengerPhone.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.collectionStatus === statusFilter);
    }

    result.sort((a, b) => 
      new Date(b.bookingDateTime).getTime() - new Date(a.bookingDateTime).getTime()
    );

    return result;
  }, [dateTickets, searchQuery, statusFilter]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.ticket_no.toLowerCase().includes(q) ||
        (e.travels_name || '').toLowerCase().includes(q) ||
        (e.booked_by || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.collection_status === statusFilter);
    }
    return result;
  }, [entries, searchQuery, statusFilter]);

  const entriesTotal = filteredEntries.reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleExport = () => {
    const headers = ['Ticket No', 'Booking Time', 'Travels', 'Destination', 'Booked By', 'Staff', 'Mode', 'Amount', 'Status', 'Receiver'];
    const rows = filteredEntries.map(e => [
      e.ticket_no,
      format(new Date(e.created_at), 'hh:mm a'),
      e.travels_name,
      e.tours_to || '',
      e.booked_by || '',
      staffMap[e.user_id] || '',
      e.entry_payment_mode || e.payment_mode || '',
      e.amount,
      e.collection_status,
      e.receiver_name || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading tickets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Tickets</h1>
            <p className="text-sm text-muted-foreground">
              {filteredEntries.length} tickets for {format(selectedDate, 'EEE, dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Date and Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter and Export Row */}
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="flex-1 sm:w-[140px] sm:flex-none">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport} className="gap-2 flex-1 sm:flex-none">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Booked By Summary for selected date */}
        <BookedBySummary
          tickets={filteredEntries.map(e => ({
            bookedBy: e.booked_by || '',
            amount: Number(e.amount || 0),
            paymentMode: e.entry_payment_mode || e.payment_mode || '',
          }))}
        />

        {/* Tickets list (from Pay Collection entries) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg">
                Tickets ({filteredEntries.length})
              </CardTitle>
              <div className="text-sm font-semibold text-primary">
                Total: ₹{entriesTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No booked entries for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg hover:bg-muted/40 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-primary">
                          {e.ticket_no}
                        </span>
                        <Badge
                          variant={e.collection_status === 'Paid' ? 'default' : 'secondary'}
                          className={e.collection_status === 'Paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {e.collection_status}
                        </Badge>
                        {e.entry_payment_mode && (
                          <Badge variant="outline">{e.entry_payment_mode}</Badge>
                        )}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">{e.travels_name}</span>
                        {e.tours_to && <span className="text-muted-foreground"> · {e.tours_to}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Booked by: {e.booked_by || '-'} · Staff: {staffMap[e.user_id] || '-'} · {format(new Date(e.created_at), 'hh:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{Number(e.amount).toLocaleString('en-IN')}</div>
                      {e.collection_status === 'Paid' && e.receiver_name && (
                        <div className="text-xs text-muted-foreground">
                          Recv: {e.receiver_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Payment Dialog */}
        <PaymentDialog
          ticket={paymentTicket}
          open={!!paymentTicket}
          onOpenChange={(open) => !open && setPaymentTicket(null)}
          onSubmit={async (paidBy, paymentMode, paidAmount) => {
            if (!paymentTicket) return;
            await savePayment({
              ticketId: paymentTicket.id,
              receivedByName: paidBy,
              paymentMode,
              paidAmount,
              paidAt: new Date().toISOString(),
            });
            setPaymentTicket(null);
          }}
        />
      </div>
    </Layout>
  );
}
