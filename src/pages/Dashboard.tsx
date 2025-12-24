import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Ticket, 
  IndianRupee, 
  AlertCircle,
  Plus,
  CalendarIcon,
  Search,
  Download,
  Filter,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TicketTable } from '@/components/dashboard/TicketTable';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useSeatBookings, useAgents } from '@/hooks/useSeatBookings';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tickets, loading, fetchTickets, savePayment, deleteTicket } = useTickets();
  const { travels } = useTravels();
  const { seatBookings } = useSeatBookings();
  const { agents } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [paymentTicket, setPaymentTicket] = useState<TicketWithPayment | null>(null);

  // Calculate pending agent collections
  const pendingAgentCollections = useMemo(() => {
    const agentMap = new Map<string, { name: string; pending: number; bookingsCount: number }>();

    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId && b.agentCollectionStatus === 'pending')
      .forEach((booking) => {
        const agentId = booking.agentId!;
        if (!agentMap.has(agentId)) {
          const agent = agents.find(a => a.id === agentId);
          agentMap.set(agentId, {
            name: booking.agentName || agent?.name || 'Unknown',
            pending: 0,
            bookingsCount: 0,
          });
        }

        const agentData = agentMap.get(agentId)!;
        agentData.pending += booking.amountFromAgent;
        agentData.bookingsCount += 1;
      });

    return Array.from(agentMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.pending - a.pending);
  }, [seatBookings, agents]);

  const totalPendingFromAgents = useMemo(() => {
    return pendingAgentCollections.reduce((sum, a) => sum + a.pending, 0);
  }, [pendingAgentCollections]);

  // Memoize the date tickets to prevent infinite loops
  const dateTickets = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tickets.filter((ticket) => {
      const ticketDate = format(new Date(ticket.bookingDateTime), 'yyyy-MM-dd');
      return ticketDate === dateStr;
    });
  }, [tickets, selectedDate]);

  const stats = useMemo(() => calculateStats(dateTickets, travels), [dateTickets, travels]);

  // Calculate booked by summary with payment mode breakdown
  const bookedBySummary = useMemo(() => {
    const summary: Record<string, { count: number; total: number; paymentModes: Record<string, number> }> = {};
    dateTickets.forEach((ticket) => {
      const bookedBy = ticket.bookedBy || 'Unknown';
      const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;
      const paymentMode = ticket.paymentMode || 'Not Set';
      if (!summary[bookedBy]) {
        summary[bookedBy] = { count: 0, total: 0, paymentModes: {} };
      }
      summary[bookedBy].count += 1;
      summary[bookedBy].total += baseAmount;
      summary[bookedBy].paymentModes[paymentMode] = (summary[bookedBy].paymentModes[paymentMode] || 0) + baseAmount;
    });
    return Object.entries(summary).sort((a, b) => b[1].total - a[1].total);
  }, [dateTickets]);

  // Memoize filtered tickets
  const filteredTickets = useMemo(() => {
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
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Tickets for {format(selectedDate, 'EEE, dd MMM yyyy')}
              </p>
            </div>
            <Link to="/new-ticket" className="w-full sm:w-auto">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
          <StatCard
            title="Tickets Today"
            value={stats.totalTickets}
            icon={<Ticket className="h-5 w-5 sm:h-6 sm:w-6" />}
            trend={`${stats.paidCount} paid, ${stats.unpaidCount} unpaid`}
          />
          <StatCard
            title="Total Collection"
            value={`₹${stats.totalCollection.toLocaleString()}`}
            icon={<IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="success"
          />
          <StatCard
            title="Pending Amount"
            value={`₹${stats.totalUnpaid.toLocaleString()}`}
            icon={<AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="destructive"
          />
        </div>

        {/* Booked By Summary */}
        {bookedBySummary.length > 0 && (
          <div className="mb-6 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Booked By Summary</h3>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bookedBySummary.map(([name, data]) => (
                <div key={name} className="p-3 rounded-md bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground truncate">{name}</p>
                    <p className="font-semibold text-primary">₹{data.total.toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{data.count} ticket{data.count > 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(data.paymentModes).map(([mode, amount]) => (
                      <span key={mode} className="text-xs px-2 py-0.5 rounded bg-background border">
                        {mode}: ₹{amount.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Agent Collections */}
        {pendingAgentCollections.length > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Agent Collections
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/agent-collections')}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Total: ₹{totalPendingFromAgents.toLocaleString()} from {pendingAgentCollections.length} agent{pendingAgentCollections.length > 1 ? 's' : ''}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingAgentCollections.slice(0, 8).map((agent) => (
                  <div 
                    key={agent.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-white/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.bookingsCount} booking{agent.bookingsCount > 1 ? 's' : ''}</p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 shrink-0">
                      ₹{agent.pending.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
              {pendingAgentCollections.length > 8 && (
                <p className="text-sm text-center text-muted-foreground mt-3">
                  +{pendingAgentCollections.length - 8} more agents
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="flex-1 sm:w-[140px] sm:flex-none">
                <Filter className="h-4 w-4 mr-2" />
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

        {/* Ticket Table */}
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
