import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function Tickets() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tickets, loading, fetchTickets, savePayment, deleteTicket } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [paymentTicket, setPaymentTicket] = useState<TicketWithPayment | null>(null);

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

  const handleExport = () => {
    const headers = ['Ticket No', 'Booking Time', 'Journey Date', 'Tours To', 'Passenger', 'Phone', 'Tourists', 'Amount', 'Status', 'Received By'];
    const rows = filteredTickets.map(t => [
      t.ticketNo,
      format(new Date(t.bookingDateTime), 'hh:mm a'),
      format(new Date(t.journeyDate), 'dd/MM/yyyy'),
      t.toursTo,
      t.passengerName,
      t.passengerPhone,
      t.noOfTourist,
      t.amount,
      t.collectionStatus,
      t.payment?.receivedByName || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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
              {filteredTickets.length} tickets for {format(selectedDate, 'EEE, dd MMM yyyy')}
            </p>
          </div>
          <Link to="/new-ticket" className="w-full sm:w-auto">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
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

        {/* Ticket Table/Cards */}
        <TicketTable 
          tickets={filteredTickets} 
          onRefresh={fetchTickets}
          onMarkPaid={(ticket) => setPaymentTicket(ticket)}
          onDeleteTicket={deleteTicket}
        />

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
