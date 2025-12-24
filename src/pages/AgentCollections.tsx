import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, CheckCircle2, Clock, Phone, IndianRupee, Search, ArrowUpDown } from 'lucide-react';
import { useSeatBookings, useAgents, SeatBooking } from '@/hooks/useSeatBookings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentWithCollections {
  id: string;
  name: string;
  phone?: string;
  bookings: SeatBooking[];
  totalPending: number;
  totalCollected: number;
  originalTotal: number;
}

type SortOption = 'pending-desc' | 'pending-asc' | 'name-asc' | 'name-desc' | 'collected-desc';

export default function AgentCollections() {
  const { user } = useAuth();
  const { seatBookings, loading, fetchSeatBookings } = useSeatBookings();
  const { agents } = useAgents();
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithCollections | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('pending-desc');

  // Group bookings by agent with pending collections
  const agentCollections = useMemo(() => {
    const agentMap = new Map<string, AgentWithCollections>();

    // Initialize with all agents that have bookings
    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId)
      .forEach((booking) => {
        const agentId = booking.agentId!;
        if (!agentMap.has(agentId)) {
          const agent = agents.find(a => a.id === agentId);
          agentMap.set(agentId, {
            id: agentId,
            name: booking.agentName || agent?.name || 'Unknown',
            phone: agent?.phone,
            bookings: [],
            totalPending: 0,
            totalCollected: 0,
            originalTotal: 0,
          });
        }

        const agentData = agentMap.get(agentId)!;
        const originalAmount = booking.originalAmountFromAgent || booking.amountFromAgent;
        agentData.bookings.push(booking);
        agentData.originalTotal += originalAmount;
        
        if (booking.agentCollectionStatus === 'pending') {
          agentData.totalPending += booking.amountFromAgent;
        } else {
          agentData.totalCollected += originalAmount;
        }
        
        // Add partial collection (original - remaining for pending items)
        if (booking.agentCollectionStatus === 'pending' && originalAmount > booking.amountFromAgent) {
          agentData.totalCollected += (originalAmount - booking.amountFromAgent);
        }
      });

    let results = Array.from(agentMap.values())
      .filter(a => a.totalPending > 0 || a.bookings.length > 0);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.phone?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'pending-desc':
        results.sort((a, b) => b.totalPending - a.totalPending);
        break;
      case 'pending-asc':
        results.sort((a, b) => a.totalPending - b.totalPending);
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'collected-desc':
        results.sort((a, b) => b.totalCollected - a.totalCollected);
        break;
    }
    
    return results;
  }, [seatBookings, agents, searchQuery, sortBy]);

  const summary = useMemo(() => {
    // Calculate from all agent bookings, not filtered ones
    let totalPending = 0;
    let totalCollected = 0;
    let agentsWithPending = 0;
    
    const agentPendingMap = new Map<string, number>();
    
    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId)
      .forEach((booking) => {
        const originalAmount = booking.originalAmountFromAgent || booking.amountFromAgent;
        
        if (booking.agentCollectionStatus === 'pending') {
          totalPending += booking.amountFromAgent;
          // Track partial collections
          if (originalAmount > booking.amountFromAgent) {
            totalCollected += (originalAmount - booking.amountFromAgent);
          }
          agentPendingMap.set(booking.agentId!, (agentPendingMap.get(booking.agentId!) || 0) + 1);
        } else {
          totalCollected += originalAmount;
        }
      });
    
    agentsWithPending = agentPendingMap.size;
    
    return { totalPending, totalCollected, agentsWithPending };
  }, [seatBookings]);

  const handleOpenPayment = (agent: AgentWithCollections) => {
    setSelectedAgent(agent);
    setPaymentAmount(agent.totalPending.toString());
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedAgent || !user) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedAgent.totalPending) {
      toast.error('Amount cannot exceed pending amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Get pending bookings sorted by date (oldest first)
      const pendingBookings = selectedAgent.bookings
        .filter(b => b.agentCollectionStatus === 'pending')
        .sort((a, b) => new Date(a.journeyDate).getTime() - new Date(b.journeyDate).getTime());

      let remainingAmount = amount;
      const fullyPaidBookingIds: string[] = [];
      const partialPaymentUpdates: { id: string; newAmountFromAgent: number }[] = [];

      // Process bookings - mark fully paid ones as collected, reduce amount for partial
      for (const booking of pendingBookings) {
        if (remainingAmount <= 0) break;
        
        if (remainingAmount >= booking.amountFromAgent) {
          // Fully paid - mark as collected
          fullyPaidBookingIds.push(booking.id);
          remainingAmount -= booking.amountFromAgent;
        } else {
          // Partial payment - reduce the pending amount
          const newAmountFromAgent = booking.amountFromAgent - remainingAmount;
          partialPaymentUpdates.push({ id: booking.id, newAmountFromAgent });
          remainingAmount = 0;
        }
      }

      // Update fully paid bookings as collected
      if (fullyPaidBookingIds.length > 0) {
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            agent_collection_status: 'collected',
            collected_at: new Date().toISOString(),
          })
          .in('id', fullyPaidBookingIds);

        if (error) throw error;
      }

      // Update partial payment bookings - reduce the amount_from_agent
      for (const update of partialPaymentUpdates) {
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            amount_from_agent: update.newAmountFromAgent,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success(`₹${amount.toFixed(0)} collected from ${selectedAgent.name}`);
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      fetchSeatBookings();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllCollected = async (agent: AgentWithCollections) => {
    if (!user) return;
    
    const pendingBookingIds = agent.bookings
      .filter(b => b.agentCollectionStatus === 'pending')
      .map(b => b.id);

    if (pendingBookingIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('seat_bookings')
        .update({
          agent_collection_status: 'collected',
          collected_at: new Date().toISOString(),
        })
        .in('id', pendingBookingIds);

      if (error) throw error;

      toast.success(`All collections marked as received from ${agent.name}`);
      fetchSeatBookings();
    } catch (error) {
      console.error('Error marking collected:', error);
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
            Track and collect pending amounts from agents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">₹{summary.totalPending.toFixed(0)}</div>
              <p className="text-xs text-amber-600/80 mt-1">from {summary.agentsWithPending} agents</p>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{summary.totalCollected.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentCollections.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agent by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending-desc">Pending: High to Low</SelectItem>
              <SelectItem value="pending-asc">Pending: Low to High</SelectItem>
              <SelectItem value="collected-desc">Collected: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent-wise Collections */}
        {agentCollections.length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {agentCollections.map((agent) => (
              <AccordionItem key={agent.id} value={agent.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{agent.name}</p>
                        {agent.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {agent.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {agent.totalPending > 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <Clock className="h-3 w-3 mr-1" />
                          ₹{agent.totalPending.toFixed(0)} pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          All clear
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {/* Actions */}
                    {agent.totalPending > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => handleOpenPayment(agent)} className="gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Receive Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleMarkAllCollected(agent)}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark All Collected
                        </Button>
                      </div>
                    )}

                    {/* Bookings Table */}
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Seat</TableHead>
                            <TableHead>Passenger</TableHead>
                            <TableHead className="text-right">Booking Amt</TableHead>
                            <TableHead className="text-right">To Collect</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agent.bookings
                            .sort((a, b) => new Date(b.journeyDate).getTime() - new Date(a.journeyDate).getTime())
                            .map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{format(new Date(booking.journeyDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>Seat {booking.seatNumber}</TableCell>
                              <TableCell>{booking.passengerName || '-'}</TableCell>
                              <TableCell className="text-right">₹{booking.bookingAmount.toFixed(0)}</TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{booking.amountFromAgent.toFixed(0)}
                              </TableCell>
                              <TableCell>
                                {booking.agentCollectionStatus === 'pending' ? (
                                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                                    Pending
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Collected
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Summary */}
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Bookings:</span>{' '}
                        <span className="font-medium">{agent.bookings.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Collected:</span>{' '}
                        <span className="font-medium text-green-600">₹{agent.totalCollected.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>{' '}
                        <span className="font-medium text-amber-600">₹{agent.totalPending.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No agent bookings found. Agent bookings will appear here once created in Seat Bookings.
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Receive Payment
              </DialogTitle>
              <DialogDescription>
                Collect payment from {selectedAgent?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedAgent && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-medium">{selectedAgent.name}</span>
                  </div>
                  {selectedAgent.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selectedAgent.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-600">
                    <span>Total Pending</span>
                    <span className="font-bold">₹{selectedAgent.totalPending.toFixed(0)}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Amount to Collect (₹)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedAgent.totalPending}
                  />
                  <div className="flex gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaymentAmount(selectedAgent.totalPending.toString())}
                    >
                      Full Amount
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaymentAmount((selectedAgent.totalPending / 2).toString())}
                    >
                      Half
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Collect ₹{parseFloat(paymentAmount) || 0}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
