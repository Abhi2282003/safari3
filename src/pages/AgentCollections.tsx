import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, CheckCircle2, Clock, IndianRupee, Filter } from 'lucide-react';
import { useSeatBookings, useAgents } from '@/hooks/useSeatBookings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AgentCollections() {
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const { seatBookings, loading, markCollected } = useSeatBookings();
  const { agents } = useAgents();

  const agentBookings = useMemo(() => {
    return seatBookings.filter((b) => {
      if (b.bookingType !== 'agent') return false;
      if (filterAgent !== 'all' && b.agentId !== filterAgent) return false;
      if (filterStatus !== 'all' && b.agentCollectionStatus !== filterStatus) return false;
      return true;
    });
  }, [seatBookings, filterAgent, filterStatus]);

  const summary = useMemo(() => {
    const pending = seatBookings.filter(
      (b) => b.bookingType === 'agent' && b.agentCollectionStatus === 'pending'
    );
    const collected = seatBookings.filter(
      (b) => b.bookingType === 'agent' && b.agentCollectionStatus === 'collected'
    );

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, b) => sum + b.amountFromAgent, 0),
      collectedCount: collected.length,
      collectedAmount: collected.reduce((sum, b) => sum + b.amountFromAgent, 0),
    };
  }, [seatBookings]);

  const agentWiseSummary = useMemo(() => {
    const agentMap: { [key: string]: { name: string; pending: number; collected: number } } = {};

    seatBookings
      .filter((b) => b.bookingType === 'agent')
      .forEach((b) => {
        const agentId = b.agentId || 'unknown';
        if (!agentMap[agentId]) {
          agentMap[agentId] = {
            name: b.agentName || 'Unknown',
            pending: 0,
            collected: 0,
          };
        }
        if (b.agentCollectionStatus === 'pending') {
          agentMap[agentId].pending += b.amountFromAgent;
        } else {
          agentMap[agentId].collected += b.amountFromAgent;
        }
      });

    return Object.entries(agentMap).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [seatBookings]);

  const handleMarkCollected = async (id: string) => {
    try {
      await markCollected(id);
      toast.success('Marked as collected');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Agent Collections
          </h1>
          <p className="text-muted-foreground mt-1">
            Track pending and collected amounts from agents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">₹{summary.pendingAmount.toFixed(0)}</div>
              <p className="text-xs text-amber-600/80 mt-1">{summary.pendingCount} bookings</p>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{summary.collectedAmount.toFixed(0)}</div>
              <p className="text-xs text-green-600/80 mt-1">{summary.collectedCount} bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent-wise Summary */}
        {agentWiseSummary.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Agent-wise Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {agentWiseSummary.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      {agent.pending > 0 && (
                        <p className="text-sm text-amber-600">Pending: ₹{agent.pending.toFixed(0)}</p>
                      )}
                    </div>
                    {agent.pending > 0 ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Clear
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Bookings</CardTitle>
            <CardDescription>
              {agentBookings.length} bookings found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">To Collect</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{format(new Date(booking.journeyDate), 'dd MMM')}</TableCell>
                      <TableCell>Seat {booking.seatNumber}</TableCell>
                      <TableCell className="font-medium">{booking.agentName || 'Unknown'}</TableCell>
                      <TableCell>{booking.passengerName || '-'}</TableCell>
                      <TableCell className="text-right">₹{booking.bookingAmount.toFixed(0)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{booking.amountFromAgent.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        {booking.agentCollectionStatus === 'pending' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Collected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.agentCollectionStatus === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCollected(booking.id)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Collect
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {agentBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No agent bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
