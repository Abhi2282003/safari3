import { useState, useMemo, useEffect } from 'react';
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
import { Loader2, Users, CheckCircle2, Clock, Phone, IndianRupee, Search, ArrowUpDown, Bus, Wallet } from 'lucide-react';
import { useSeatBookings, useAgents, SeatBooking } from '@/hooks/useSeatBookings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentWithCollections {
  id: string;
  name: string;
  phone?: string;
  advanceBalance: number;
  bookings: SeatBooking[];
  totalPending: number;
  totalCollected: number;
  originalTotal: number;
}

type SortOption = 'pending-desc' | 'pending-asc' | 'name-asc' | 'name-desc' | 'collected-desc';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

export default function AgentCollections() {
  const { user } = useAuth();
  const { seatBookings, loading, fetchSeatBookings } = useSeatBookings();
  const { agents, fetchAgents } = useAgents();
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithCollections | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
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
            advanceBalance: (agent as any)?.advanceBalance || 0,
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

    // Show agents with pending collections OR advance balance
    let results = Array.from(agentMap.values())
      .filter(a => a.totalPending > 0 || a.advanceBalance > 0);
    
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
    let totalPending = 0;
    let totalCollected = 0;
    let agentsWithPending = 0;
    let totalAdvance = 0;
    
    const agentPendingMap = new Map<string, number>();
    
    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId)
      .forEach((booking) => {
        const originalAmount = booking.originalAmountFromAgent || booking.amountFromAgent;
        
        if (booking.agentCollectionStatus === 'pending') {
          totalPending += booking.amountFromAgent;
          if (originalAmount > booking.amountFromAgent) {
            totalCollected += (originalAmount - booking.amountFromAgent);
          }
          agentPendingMap.set(booking.agentId!, (agentPendingMap.get(booking.agentId!) || 0) + 1);
        } else {
          totalCollected += originalAmount;
        }
      });
    
    agentsWithPending = agentPendingMap.size;
    totalAdvance = agents.reduce((sum, a) => sum + ((a as any).advanceBalance || 0), 0);
    
    return { totalPending, totalCollected, agentsWithPending, totalAdvance };
  }, [seatBookings, agents]);

  const handleOpenPayment = (agent: AgentWithCollections) => {
    setSelectedAgent(agent);
    setPaymentAmount(agent.totalPending.toString());
    setReceivedBy('');
    setPaymentMode('Cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedAgent || !user) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!receivedBy.trim()) {
      toast.error('Please enter receiver name');
      return;
    }

    setIsProcessing(true);

    try {
      const effectivePending = selectedAgent.totalPending - selectedAgent.advanceBalance;
      const isAdvancePayment = amount > effectivePending;
      let amountToApply = amount;
      let newAdvanceBalance = selectedAgent.advanceBalance;

      // If there's existing advance, use it first
      if (selectedAgent.advanceBalance > 0) {
        amountToApply += selectedAgent.advanceBalance;
        newAdvanceBalance = 0;
      }

      // Get pending bookings sorted by date (oldest first)
      const pendingBookings = selectedAgent.bookings
        .filter(b => b.agentCollectionStatus === 'pending')
        .sort((a, b) => new Date(a.journeyDate).getTime() - new Date(b.journeyDate).getTime());

      let remainingAmount = amountToApply;
      const fullyPaidBookingIds: string[] = [];
      const partialPaymentUpdates: { id: string; newAmountFromAgent: number }[] = [];

      // Process bookings
      for (const booking of pendingBookings) {
        if (remainingAmount <= 0) break;
        
        if (remainingAmount >= booking.amountFromAgent) {
          fullyPaidBookingIds.push(booking.id);
          remainingAmount -= booking.amountFromAgent;
        } else {
          const newAmountFromAgent = booking.amountFromAgent - remainingAmount;
          partialPaymentUpdates.push({ id: booking.id, newAmountFromAgent });
          remainingAmount = 0;
        }
      }

      // If there's remaining amount after all bookings, it's advance
      if (remainingAmount > 0) {
        newAdvanceBalance = remainingAmount;
      }

      // Update fully paid bookings
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

      // Update partial payment bookings
      for (const update of partialPaymentUpdates) {
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            amount_from_agent: update.newAmountFromAgent,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update agent's advance balance
      const { error: agentError } = await supabase
        .from('agents')
        .update({ advance_balance: newAdvanceBalance })
        .eq('id', selectedAgent.id);

      if (agentError) throw agentError;

      // Record the payment
      const { error: paymentError } = await supabase
        .from('agent_collection_payments')
        .insert({
          user_id: user.id,
          agent_id: selectedAgent.id,
          amount_paid: amount,
          received_by: receivedBy.trim(),
          payment_mode: paymentMode,
          notes: paymentNotes.trim() || null,
        });

      if (paymentError) throw paymentError;

      const message = newAdvanceBalance > 0 
        ? `₹${amount.toFixed(0)} collected. Advance balance: ₹${newAdvanceBalance.toFixed(0)}`
        : `₹${amount.toFixed(0)} collected from ${selectedAgent.name}`;
      
      toast.success(message);
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setReceivedBy('');
      setPaymentNotes('');
      fetchSeatBookings();
      fetchAgents();
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Agent Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and collect pending amounts from agents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-amber-600">₹{summary.totalPending.toFixed(0)}</div>
              <p className="text-xs text-amber-600/80 mt-0.5">{summary.agentsWithPending} agents</p>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Collected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">₹{summary.totalCollected.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Advance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">₹{summary.totalAdvance.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{agentCollections.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agent..."
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
          <Accordion type="multiple" className="space-y-3">
            {agentCollections.map((agent) => (
              <AccordionItem key={agent.id} value={agent.id} className="border rounded-lg px-3 sm:px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{agent.name}</p>
                        {agent.phone && (
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {agent.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      {agent.advanceBalance > 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs hidden sm:flex">
                          <Wallet className="h-3 w-3 mr-1" />
                          ₹{agent.advanceBalance.toFixed(0)} adv
                        </Badge>
                      )}
                      {agent.totalPending > 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          ₹{agent.totalPending.toFixed(0)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Clear
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-3 space-y-4">
                    {/* Advance Balance Notice */}
                    {agent.advanceBalance > 0 && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Advance Balance: <strong>₹{agent.advanceBalance.toFixed(0)}</strong>
                          {agent.totalPending > 0 && (
                            <span className="text-xs">
                              (Net: ₹{Math.max(0, agent.totalPending - agent.advanceBalance).toFixed(0)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {(agent.totalPending > 0 || agent.advanceBalance > 0) && (
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => handleOpenPayment(agent)} className="gap-2" size="sm">
                          <IndianRupee className="h-4 w-4" />
                          Receive Payment
                        </Button>
                        {agent.totalPending > 0 && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleMarkAllCollected(agent)}
                            className="gap-2"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark All Collected
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Bookings Table */}
                    {agent.bookings.filter(b => b.agentCollectionStatus === 'pending').length > 0 && (
                      <div className="rounded-lg border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Bus</TableHead>
                              <TableHead className="text-xs">Seat</TableHead>
                              <TableHead className="text-right text-xs">Amount</TableHead>
                              <TableHead className="text-right text-xs">To Collect</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agent.bookings
                              .filter(b => b.agentCollectionStatus === 'pending')
                              .sort((a, b) => new Date(b.journeyDate).getTime() - new Date(a.journeyDate).getTime())
                              .map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell className="text-xs sm:text-sm">
                                  {format(new Date(booking.journeyDate), 'dd MMM')}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <div className="flex items-center gap-1">
                                    <Bus className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate max-w-[80px]">{booking.busName || '-'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm font-medium">#{booking.seatNumber}</TableCell>
                                <TableCell className="text-right text-xs sm:text-sm">₹{booking.bookingAmount.toFixed(0)}</TableCell>
                                <TableCell className="text-right text-xs sm:text-sm font-medium text-amber-600">
                                  ₹{booking.amountFromAgent.toFixed(0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Pending:</span>{' '}
                        <span className="font-medium">{agent.bookings.filter(b => b.agentCollectionStatus === 'pending').length} bookings</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>{' '}
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
          <DialogContent className="max-w-md">
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
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
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
                  {selectedAgent.advanceBalance > 0 && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Advance Balance</span>
                        <span className="font-bold">₹{selectedAgent.advanceBalance.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Net Payable</span>
                        <span className="font-bold">
                          ₹{Math.max(0, selectedAgent.totalPending - selectedAgent.advanceBalance).toFixed(0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label>Amount Received (₹) *</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount(selectedAgent.totalPending.toString())}
                      >
                        Full
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount(Math.max(0, selectedAgent.totalPending - selectedAgent.advanceBalance).toString())}
                      >
                        Net
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount((selectedAgent.totalPending / 2).toString())}
                      >
                        Half
                      </Button>
                    </div>
                    {parseFloat(paymentAmount) > selectedAgent.totalPending && (
                      <p className="text-xs text-blue-600 mt-2">
                        ₹{(parseFloat(paymentAmount) - selectedAgent.totalPending).toFixed(0)} will be saved as advance
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Received By *</Label>
                    <Input
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      placeholder="Enter receiver name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Any notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
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
