import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Ticket, 
  IndianRupee, 
  AlertCircle,
  Plus,
  CalendarIcon,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
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
import { useTickets, useTravels, calculateStats, TicketWithPayment } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tickets, loading, getTicketsByDate, fetchTickets, savePayment } = useTickets();
  const { travels } = useTravels();
  const [filteredTickets, setFilteredTickets] = useState<TicketWithPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [paymentTicket, setPaymentTicket] = useState<TicketWithPayment | null>(null);

  const dateTickets = getTicketsByDate(selectedDate);
  const stats = calculateStats(dateTickets, travels);

  useEffect(() => {
    let result = [...dateTickets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.ticketNo.toLowerCase().includes(query) ||
        ticket.passengerName.toLowerCase().includes(query) ||
        ticket.passengerPhone.includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.collectionStatus === statusFilter);
    }

    // Sort by booking time descending (most recent first)
    result.sort((a, b) => 
      new Date(b.bookingDateTime).getTime() - new Date(a.bookingDateTime).getTime()
    );

    setFilteredTickets(result);
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
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
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
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Tickets for {format(selectedDate, 'EEEE, dd MMMM yyyy')}
              </p>
            </div>
            <Link to="/new-ticket">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Tickets Today"
            value={stats.totalTickets}
            icon={<Ticket className="h-6 w-6" />}
            trend={`${stats.paidCount} paid, ${stats.unpaidCount} unpaid`}
          />
          <StatCard
            title="Total Collection"
            value={`₹${stats.totalCollection.toLocaleString()}`}
            icon={<IndianRupee className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Pending Amount"
            value={`₹${stats.totalUnpaid.toLocaleString()}`}
            icon={<AlertCircle className="h-6 w-6" />}
            variant="destructive"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticket, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Ticket Table */}
        <TicketTable 
          tickets={filteredTickets} 
          onRefresh={fetchTickets}
          onMarkPaid={(ticket) => setPaymentTicket(ticket)}
        />

        {/* Payment Dialog */}
        <PaymentDialog
          ticket={paymentTicket}
          open={!!paymentTicket}
          onOpenChange={(open) => !open && setPaymentTicket(null)}
          onSuccess={fetchTickets}
        />
      </div>
    </Layout>
  );
}
