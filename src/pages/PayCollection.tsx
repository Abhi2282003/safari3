import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useTickets, useTravels, useReceivers } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function PayCollection() {
  const { tickets, loading, savePayment, fetchTickets } = useTickets();
  const { travels } = useTravels();
  const { receivers } = useReceivers();
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null);
  const [paidBy, setPaidBy] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get commission for a travel
  const getCommission = (travelsName: string | undefined) => {
    if (!travelsName) return 10;
    const travel = travels.find(t => t.name === travelsName);
    return travel?.commissionPercent ?? 10;
  };

  // Calculate amount to pay after commission
  const calculatePayableAmount = (baseFare: number, commissionPercent: number) => {
    return baseFare - (baseFare * commissionPercent / 100);
  };

  // Group tickets by travel name and collection status
  const groupedTickets = useMemo(() => {
    if (!tickets) return { paid: {}, unpaid: {} };

    const paid: Record<string, typeof tickets> = {};
    const unpaid: Record<string, typeof tickets> = {};

    tickets.forEach((ticket) => {
      const travelsName = ticket.travelsName || 'No Travel Name';
      const isPaid = ticket.collectionStatus === 'Paid';

      if (isPaid) {
        if (!paid[travelsName]) paid[travelsName] = [];
        paid[travelsName].push(ticket);
      } else {
        if (!unpaid[travelsName]) unpaid[travelsName] = [];
        unpaid[travelsName].push(ticket);
      }
    });

    // Sort tickets within each group by journey date (newest first)
    Object.values(paid).forEach(arr => arr.sort((a, b) => 
      new Date(b.journeyDate).getTime() - new Date(a.journeyDate).getTime()
    ));
    Object.values(unpaid).forEach(arr => arr.sort((a, b) => 
      new Date(b.journeyDate).getTime() - new Date(a.journeyDate).getTime()
    ));

    return { paid, unpaid };
  }, [tickets]);

  const currentGroup = activeTab === 'paid' ? groupedTickets.paid : groupedTickets.unpaid;
  const travelNames = Object.keys(currentGroup).sort();

  // Calculate totals (using payable amounts)
  const totals = useMemo(() => {
    const calculateGroupTotal = (group: Record<string, typeof tickets>) => {
      return Object.entries(group).reduce((sum, [travelsName, ticketList]) => {
        const commission = getCommission(travelsName === 'No Travel Name' ? undefined : travelsName);
        return sum + ticketList.reduce((s, t) => s + calculatePayableAmount(t.amount || 0, commission), 0);
      }, 0);
    };

    const paidTotal = calculateGroupTotal(groupedTickets.paid);
    const unpaidTotal = calculateGroupTotal(groupedTickets.unpaid);
    const paidCount = Object.values(groupedTickets.paid).flat().length;
    const unpaidCount = Object.values(groupedTickets.unpaid).flat().length;
    return { paidTotal, unpaidTotal, paidCount, unpaidCount };
  }, [groupedTickets, travels]);

  const handlePayClick = (ticket: typeof tickets[0]) => {
    setSelectedTicket(ticket);
    setPaidBy('');
    setReceiverName('');
    setReceiverMobile('');
    setPaymentMode('Cash');
    setPayDialogOpen(true);
  };

  const handlePaySubmit = async () => {
    if (!selectedTicket || !paidBy || !receiverName.trim()) {
      toast.error('Please fill in Paid By and Receiver Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const commission = getCommission(selectedTicket.travelsName);
      const payableAmount = calculatePayableAmount(selectedTicket.amount || 0, commission);

      const receiverInfo = receiverMobile.trim() 
        ? `${receiverName.trim()} (${receiverMobile.trim()})` 
        : receiverName.trim();

      await savePayment({
        ticketId: selectedTicket.id,
        receivedByName: `${paidBy} | ${receiverInfo}`,
        paymentMode,
        paidAmount: payableAmount,
        paidAt: new Date().toISOString(),
      });

      toast.success('Payment recorded successfully');
      setPayDialogOpen(false);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pay Collection</h1>
          <p className="text-muted-foreground">Manage ticket payments grouped by travel name</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" />
                Unpaid Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive flex items-center">
                <IndianRupee className="h-5 w-5" />
                {totals.unpaidTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">{totals.unpaidCount} tickets pending</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Paid Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="h-5 w-5" />
                {totals.paidTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">{totals.paidCount} tickets collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'unpaid' | 'paid')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="unpaid" className="gap-2">
              <Clock className="h-4 w-4" />
              Unpaid ({totals.unpaidCount})
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid ({totals.paidCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {travelNames.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No {activeTab} tickets found
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {travelNames.map((travelsName) => {
                  const ticketList = currentGroup[travelsName];
                  const commission = getCommission(travelsName === 'No Travel Name' ? undefined : travelsName);
                  const groupTotal = ticketList.reduce((sum, t) => sum + calculatePayableAmount(t.amount || 0, commission), 0);

                  return (
                    <AccordionItem key={travelsName} value={travelsName} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{travelsName}</span>
                            <Badge variant="secondary">{ticketList.length} tickets</Badge>
                          </div>
                          <div className="flex items-center font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            {groupTotal.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ticket No</TableHead>
                                <TableHead>Journey Date</TableHead>
                                <TableHead className="text-right">Base Fare</TableHead>
                                <TableHead className="text-right">To Pay</TableHead>
                                {activeTab === 'paid' ? (
                                  <>
                                    <TableHead>Paid At</TableHead>
                                    <TableHead>Received By</TableHead>
                                  </>
                                ) : (
                                  <TableHead className="text-right">Action</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ticketList.map((ticket) => {
                                const payableAmount = calculatePayableAmount(ticket.amount || 0, commission);
                                return (
                                  <TableRow key={ticket.id}>
                                    <TableCell className="font-mono text-xs">{ticket.ticketNo}</TableCell>
                                    <TableCell>{format(new Date(ticket.journeyDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                      ₹{(ticket.amount || 0).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      ₹{payableAmount.toLocaleString('en-IN')}
                                    </TableCell>
                                    {activeTab === 'paid' ? (
                                      <>
                                        <TableCell className="text-xs">
                                          {ticket.payment?.paidAt 
                                            ? format(new Date(ticket.payment.paidAt), 'dd/MM/yyyy hh:mm a')
                                            : '-'}
                                        </TableCell>
                                        <TableCell>{ticket.payment?.receivedByName || '-'}</TableCell>
                                      </>
                                    ) : (
                                      <TableCell className="text-right">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handlePayClick(ticket)}
                                        >
                                          Pay
                                        </Button>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            {selectedTicket && (
              <DialogDescription>
                Mark ticket <span className="font-mono">{selectedTicket.ticketNo}</span> as paid
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedTicket && (() => {
            const commission = getCommission(selectedTicket.travelsName);
            const baseFare = selectedTicket.amount || 0;
            const commissionAmount = baseFare * commission / 100;
            const payableAmount = baseFare - commissionAmount;

            return (
              <div className="space-y-4">
                {/* Amount Breakdown Card */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Amount:</span>
                    <span>₹{baseFare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Commission ({selectedTicket.travelsName || 'default'}):
                    </span>
                    <span className="text-destructive">-₹{commissionAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Payable Amount:</span>
                    <span className="text-lg">₹{payableAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Paid By Dropdown */}
                <div className="space-y-2">
                  <Label>Paid By <span className="text-destructive">*</span></Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {receivers.filter(r => r.active).map((receiver) => (
                        <SelectItem key={receiver.id} value={receiver.name}>
                          {receiver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Receiver Name */}
                <div className="space-y-2">
                  <Label>Receiver Name <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="Who received the payment"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                  />
                </div>

                {/* Receiver Mobile */}
                <div className="space-y-2">
                  <Label>Receiver Mobile (Optional)</Label>
                  <Input 
                    placeholder="Receiver's mobile number"
                    value={receiverMobile}
                    onChange={(e) => setReceiverMobile(e.target.value)}
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as typeof paymentMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePaySubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
