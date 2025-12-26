import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Ticket, 
  IndianRupee, 
  AlertCircle,
  Plus,
  CalendarIcon,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTickets, useTravels, calculateStats } from '@/hooks/useTickets';
import { useSeatBookings, useAgents } from '@/hooks/useSeatBookings';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tickets, loading } = useTickets();
  const { travels } = useTravels();
  const { seatBookings } = useSeatBookings();
  const { agents } = useAgents();

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview for {format(selectedDate, 'EEE, dd MMM yyyy')}
            </p>
          </div>
          <Link to="/new-ticket" className="w-full sm:w-auto">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Pending Agent Collections */}
        {pendingAgentCollections.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
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
      </div>
    </Layout>
  );
}
