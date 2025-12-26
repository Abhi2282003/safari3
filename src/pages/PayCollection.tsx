import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useTickets, useTravels, useReceivers } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { IndianRupee, CheckCircle, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PayCollection() {
  const { tickets, loading, savePayment, fetchTickets } = useTickets();
  const { travels } = useTravels();
  const { receivers } = useReceivers();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null);
  const [paidBy, setPaidBy] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Filter tickets by search query first
    const query = searchQuery.toLowerCase().trim();
    const filteredTickets = query
      ? tickets.filter(
          (t) =>
            t.ticketNo.toLowerCase().includes(query) ||
            t.passengerName.toLowerCase().includes(query) ||
            t.passengerPhone.includes(query)
        )
      : tickets;

    const paid: Record<string, typeof tickets> = {};
    const unpaid: Record<string, typeof tickets> = {};

    filteredTickets.forEach((ticket) => {
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
  }, [tickets, searchQuery]);

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Pay Collection</h1>
          <p className="text-sm text-muted-foreground">Manage ticket payments grouped by travel name</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticket no, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                <span className="hidden sm:inline">Unpaid Collection</span>
                <span className="sm:hidden">Unpaid</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive flex items-center">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                {totals.unpaidTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">{totals.unpaidCount} pending</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="hidden sm:inline">Paid Collection</span>
                <span className="sm:hidden">Paid</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                {totals.paidTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">{totals.paidCount} collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'unpaid' | 'paid')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unpaid" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              Unpaid ({totals.unpaidCount})
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    <AccordionItem key={travelsName} value={travelsName} className="border rounded-lg px-3 sm:px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full pr-2 sm:pr-4 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="font-semibold text-sm sm:text-base truncate">{travelsName}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">{ticketList.length}</Badge>
                          </div>
                          <div className="flex items-center font-semibold text-sm sm:text-base shrink-0">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                            {groupTotal.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        {/* Mobile Card View */}
                        {isMobile ? (
                          <div className="space-y-2">
                            {ticketList.map((ticket) => {
                              const payableAmount = calculatePayableAmount(ticket.amount || 0, commission);
                              return (
                                <div key={ticket.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-mono text-xs text-primary truncate">{ticket.ticketNo}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(new Date(ticket.journeyDate), 'dd/MM/yyyy')}
                                      </p>
                                    </div>
                                    {activeTab === 'unpaid' && (
                                      <Button 
                                        size="sm" 
                                        onClick={() => handlePayClick(ticket)}
                                        className="shrink-0 h-7 text-xs"
                                      >
                                        Pay
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Base: </span>
                                      <span>₹{(ticket.amount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="font-semibold">
                                      <span className="text-muted-foreground font-normal">To Pay: </span>
                                      ₹{payableAmount.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                  {activeTab === 'paid' && ticket.payment && (
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                      <p>Paid: {format(new Date(ticket.payment.paidAt), 'dd/MM/yy hh:mm a')}</p>
                                      <p className="truncate">By: {ticket.payment.receivedByName}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Desktop Table View */
                          <div className="w-full overflow-x-auto">
                            <table
                              className={`w-full text-sm ${activeTab === 'paid' ? 'min-w-[980px]' : 'min-w-[720px]'}`}
                            >
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Ticket No</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Journey Date</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground text-right whitespace-nowrap">Base Fare</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground text-right whitespace-nowrap">To Pay</th>
                                  {activeTab === 'paid' ? (
                                    <>
                                      <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Paid At</th>
                                      <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Received By</th>
                                    </>
                                  ) : (
                                    <th className="pb-2 px-3 font-medium text-muted-foreground text-right whitespace-nowrap">Action</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {ticketList.map((ticket) => {
                                  const payableAmount = calculatePayableAmount(ticket.amount || 0, commission);
                                  return (
                                    <tr key={ticket.id} className="border-b last:border-0">
                                      <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">{ticket.ticketNo}</td>
                                      <td className="py-2 px-3 whitespace-nowrap">{format(new Date(ticket.journeyDate), 'dd/MM/yyyy')}</td>
                                      <td className="py-2 px-3 text-right whitespace-nowrap">₹{(ticket.amount || 0).toLocaleString('en-IN')}</td>
                                      <td className="py-2 px-3 text-right font-medium whitespace-nowrap">₹{payableAmount.toLocaleString('en-IN')}</td>
                                      {activeTab === 'paid' ? (
                                        <>
                                          <td className="py-2 px-3 text-xs whitespace-nowrap">
                                            {ticket.payment?.paidAt
                                              ? format(new Date(ticket.payment.paidAt), 'dd/MM/yy hh:mm a')
                                              : '-'}
                                          </td>
                                          <td className="py-2 px-3 max-w-[220px] truncate">{ticket.payment?.receivedByName || '-'}</td>
                                        </>
                                      ) : (
                                        <td className="py-2 px-3 text-right">
                                          <Button size="sm" onClick={() => handlePayClick(ticket)}>
                                            Pay
                                          </Button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            {selectedTicket && (
              <DialogDescription className="break-all">
                Mark ticket <span className="font-mono text-xs">{selectedTicket.ticketNo}</span> as paid
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
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Amount:</span>
                    <span>₹{baseFare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      Commission ({selectedTicket.travelsName || 'default'}):
                    </span>
                    <span className="text-destructive shrink-0">-₹{commissionAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Payable Amount:</span>
                    <span className="text-base sm:text-lg">₹{payableAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Paid By Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm">Paid By <span className="text-destructive">*</span></Label>
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
                  <Label className="text-sm">Receiver Name <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="Who received the payment"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                  />
                </div>

                {/* Receiver Mobile */}
                <div className="space-y-2">
                  <Label className="text-sm">Receiver Mobile (Optional)</Label>
                  <Input 
                    placeholder="Receiver's mobile number"
                    value={receiverMobile}
                    onChange={(e) => setReceiverMobile(e.target.value)}
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label className="text-sm">Payment Mode</Label>
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
          <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setPayDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handlePaySubmit} 
              disabled={isSubmitting} 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
