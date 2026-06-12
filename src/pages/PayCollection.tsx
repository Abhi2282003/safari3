import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTravels, useReceivers } from '@/hooks/useTickets';
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
import { IndianRupee, CheckCircle, Clock, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStaffMember } from '@/hooks/useStaffMember';

interface PayEntry {
  id: string;
  ticket_no: string;
  travels_name: string;
  tours_to: string | null;
  booked_by: string | null;
  amount: number;
  collection_status: 'Paid' | 'Unpaid';
  paid_by: string | null;
  receiver_name: string | null;
  receiver_mobile: string | null;
  payment_mode: string | null;
  entry_payment_mode: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function PayCollection() {
  const { user } = useAuth();
  const { travels } = useTravels();
  const { receivers } = useReceivers();
  const { isStaff } = useUserRole();
  const { staff } = useStaffMember();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [entries, setEntries] = useState<PayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket entry dialog
  const [entryOpen, setEntryOpen] = useState(false);
  const [eTicketNo, setETicketNo] = useState('');
  const [eTravels, setETravels] = useState('');
  const [eToursTo, setEToursTo] = useState('');
  const [eBookedBy, setEBookedBy] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eEntryMode, setEEntryMode] = useState<'Cash' | 'Online'>('Cash');
  const [savingEntry, setSavingEntry] = useState(false);

  // Search ticket dialog
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTicketNo, setSearchTicketNo] = useState('');
  const [searchResult, setSearchResult] = useState<PayEntry | null | 'notfound'>(null);

  // Pay dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayEntry | null>(null);
  const [paidBy, setPaidBy] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('pay_collection_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load entries');
    } else {
      setEntries((data as PayEntry[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-fill Booked By with staff full name when staff
  useEffect(() => {
    if (isStaff && staff?.full_name) {
      setEBookedBy(staff.full_name);
    }
  }, [isStaff, staff]);

  // Auto-open ticket entry dialog if ?entry=1
  useEffect(() => {
    if (searchParams.get('entry') === '1') {
      setEntryOpen(true);
      searchParams.delete('entry');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const getCommission = (travelsName: string | undefined) => {
    if (!travelsName) return 10;
    const travel = travels.find((t) => t.name === travelsName);
    return travel?.commissionPercent ?? 10;
  };

  const calculatePayableAmount = (baseFare: number, commissionPercent: number) =>
    baseFare - (baseFare * commissionPercent) / 100;

  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? entries.filter(
          (e) =>
            e.ticket_no.toLowerCase().includes(q) ||
            (e.booked_by || '').toLowerCase().includes(q) ||
            (e.tours_to || '').toLowerCase().includes(q)
        )
      : entries;

    const paid: Record<string, PayEntry[]> = {};
    const unpaid: Record<string, PayEntry[]> = {};
    filtered.forEach((e) => {
      const t = e.travels_name || 'No Travel Name';
      const bucket = e.collection_status === 'Paid' ? paid : unpaid;
      if (!bucket[t]) bucket[t] = [];
      bucket[t].push(e);
    });
    return { paid, unpaid };
  }, [entries, searchQuery]);

  const currentGroup = activeTab === 'paid' ? grouped.paid : grouped.unpaid;
  const travelNames = Object.keys(currentGroup).sort();

  const totals = useMemo(() => {
    const sumGroup = (g: Record<string, PayEntry[]>) =>
      Object.entries(g).reduce((sum, [tn, list]) => {
        const c = getCommission(tn === 'No Travel Name' ? undefined : tn);
        return sum + list.reduce((s, e) => s + calculatePayableAmount(e.amount || 0, c), 0);
      }, 0);
    return {
      paidTotal: sumGroup(grouped.paid),
      unpaidTotal: sumGroup(grouped.unpaid),
      paidCount: Object.values(grouped.paid).flat().length,
      unpaidCount: Object.values(grouped.unpaid).flat().length,
    };
  }, [grouped, travels]);

  const resetEntry = () => {
    setETicketNo('');
    setETravels('');
    setEToursTo('');
    setEBookedBy(isStaff && staff?.full_name ? staff.full_name : '');
    setEAmount('');
    setEEntryMode('Cash');
  };

  const handleSaveEntry = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    if (!eTicketNo.trim() || !eTravels || !eAmount) {
      toast.error('Ticket No, Travels Name and Amount are required');
      return;
    }
    setSavingEntry(true);
    const { error } = await (supabase as any).from('pay_collection_entries').insert({
      user_id: user.id,
      ticket_no: eTicketNo.trim(),
      travels_name: eTravels,
      tours_to: eToursTo.trim() || null,
      booked_by: eBookedBy.trim() || null,
      amount: Number(eAmount) || 0,
      collection_status: 'Unpaid',
      entry_payment_mode: eEntryMode,
    });
    setSavingEntry(false);
    if (error) {
      toast.error('Failed to save entry');
      return;
    }
    toast.success('Ticket entry added');
    setEntryOpen(false);
    resetEntry();
    fetchEntries();
  };

  const handleSearchTicket = async () => {
    const q = searchTicketNo.trim();
    if (!q) {
      toast.error('Enter ticket number');
      return;
    }
    const { data, error } = await (supabase as any)
      .from('pay_collection_entries')
      .select('*')
      .eq('ticket_no', q)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      toast.error('Search failed');
      return;
    }
    if (!data || data.length === 0) {
      setSearchResult('notfound');
    } else {
      setSearchResult(data[0] as PayEntry);
    }
  };

  const openPayFromSearch = (entry: PayEntry) => {
    setSearchOpen(false);
    setSearchTicketNo('');
    setSearchResult(null);
    handlePayClick(entry);
  };

  const handlePayClick = (entry: PayEntry) => {
    setSelectedEntry(entry);
    setPaidBy('');
    setReceiverName('');
    setReceiverMobile('');
    setPaymentMode('Cash');
    setPayDialogOpen(true);
  };

  const handlePaySubmit = async () => {
    if (!selectedEntry || !paidBy || !receiverName.trim()) {
      toast.error('Please fill in Paid By and Receiver Name');
      return;
    }
    setIsSubmitting(true);
    const { error } = await (supabase as any)
      .from('pay_collection_entries')
      .update({
        collection_status: 'Paid',
        paid_by: paidBy,
        receiver_name: receiverName.trim(),
        receiver_mobile: receiverMobile.trim() || null,
        payment_mode: paymentMode,
        paid_at: new Date().toISOString(),
      })
      .eq('id', selectedEntry.id);
    setIsSubmitting(false);
    if (error) {
      toast.error('Failed to record payment');
      return;
    }
    toast.success('Payment recorded');
    setPayDialogOpen(false);
    fetchEntries();
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

  // ===================== STAFF VIEW (mobile-first) =====================
  if (isStaff) {
    const result = searchResult && searchResult !== 'notfound' ? (searchResult as PayEntry) : null;
    const resultPaid = result?.collection_status === 'Paid';
    const resultCommission = result ? getCommission(result.travels_name) : 0;
    const resultPayable = result ? calculatePayableAmount(result.amount || 0, resultCommission) : 0;

    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pay Collection</h1>
            <p className="text-sm text-muted-foreground">Search a ticket to check its status</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ticket Number
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticket number"
                  value={searchTicketNo}
                  onChange={(e) => setSearchTicketNo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchTicket(); }}
                  className="h-12 text-base"
                  autoFocus
                />
                <Button onClick={handleSearchTicket} className="h-12 px-4 gap-1">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResult === 'notfound' && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">
                No ticket found with that number.
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className={resultPaid ? 'border-green-500/40' : 'border-amber-500/40'}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{result.ticket_no}</p>
                    <p className="font-semibold text-base truncate">{result.travels_name}</p>
                    {result.tours_to && (
                      <p className="text-xs text-muted-foreground truncate">{result.tours_to}</p>
                    )}
                  </div>
                  <Badge
                    className={resultPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                  >
                    {resultPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>

                {result.booked_by && (
                  <p className="text-xs text-muted-foreground">Booked by: <span className="text-foreground">{result.booked_by}</span></p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Amount</p>
                    <p className="text-base font-semibold flex items-center"><IndianRupee className="h-3.5 w-3.5" />{(result.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To Pay</p>
                    <p className="text-base font-semibold flex items-center justify-end"><IndianRupee className="h-3.5 w-3.5" />{resultPayable.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {resultPaid ? (
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2 space-y-0.5">
                    <p>Paid {result.paid_at && format(new Date(result.paid_at), 'dd MMM yyyy, hh:mm a')}</p>
                    {result.paid_by && <p>By: {result.paid_by}{result.receiver_name ? ` • ${result.receiver_name}` : ''}</p>}
                    {result.payment_mode && <p>Mode: {result.payment_mode}</p>}
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePayClick(result)}
                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                  >
                    Pay Now
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pay Dialog (shared) */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              {selectedEntry && (
                <DialogDescription className="break-all">
                  Mark ticket <span className="font-mono text-xs">{selectedEntry.ticket_no}</span> as paid
                </DialogDescription>
              )}
            </DialogHeader>
            {selectedEntry && (() => {
              const commission = getCommission(selectedEntry.travels_name);
              const baseFare = selectedEntry.amount || 0;
              const payable = baseFare - (baseFare * commission) / 100;
              return (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payable</span>
                    <span className="text-lg font-bold flex items-center"><IndianRupee className="h-4 w-4" />{payable.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Paid By *</Label>
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {receivers.filter((r) => r.active).map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Receiver Name *</Label>
                    <Input className="h-11" placeholder="Who received the payment" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Receiver Mobile</Label>
                    <Input className="h-11" inputMode="tel" placeholder="Optional" value={receiverMobile} onChange={(e) => setReceiverMobile(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as typeof paymentMode)}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
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
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button variant="outline" onClick={() => setPayDialogOpen(false)} className="w-full sm:w-auto h-11">Cancel</Button>
              <Button onClick={async () => { await handlePaySubmit(); setSearchResult(null); setSearchTicketNo(''); }} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto h-11">
                {isSubmitting ? 'Processing…' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }
  // =================== END STAFF VIEW ===================


  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Pay Collection</h1>
            <p className="text-sm text-muted-foreground">Manage ticket payments grouped by travels</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => { setSearchResult(null); setSearchTicketNo(''); setSearchOpen(true); }} variant="outline" className="gap-2 flex-1 sm:flex-none">
              <Search className="h-4 w-4" />
              Search Ticket
            </Button>
            <Button onClick={() => setEntryOpen(true)} className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Ticket Entry
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticket no, booked by, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

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
                  No {activeTab} entries found
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {travelNames.map((travelsName) => {
                  const list = currentGroup[travelsName];
                  const commission = getCommission(travelsName === 'No Travel Name' ? undefined : travelsName);
                  const groupTotal = list.reduce(
                    (sum, e) => sum + calculatePayableAmount(e.amount || 0, commission),
                    0
                  );

                  return (
                    <AccordionItem key={travelsName} value={travelsName} className="border rounded-lg px-3 sm:px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full pr-2 sm:pr-4 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="font-semibold text-sm sm:text-base truncate">{travelsName}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">{list.length}</Badge>
                          </div>
                          <div className="flex items-center font-semibold text-sm sm:text-base shrink-0">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                            {groupTotal.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        {isMobile ? (
                          <div className="space-y-2">
                            {list.map((entry) => {
                              const payable = calculatePayableAmount(entry.amount || 0, commission);
                              return (
                                <div key={entry.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-mono text-xs text-primary truncate">{entry.ticket_no}</p>
                                      {entry.tours_to && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.tours_to}</p>
                                      )}
                                      {entry.booked_by && (
                                        <p className="text-xs text-muted-foreground truncate">By: {entry.booked_by}</p>
                                      )}
                                    </div>
                                    {activeTab === 'unpaid' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handlePayClick(entry)}
                                        className="shrink-0 h-7 text-xs"
                                      >
                                        Pay
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Amount: </span>
                                      <span>₹{(entry.amount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="font-semibold">
                                      <span className="text-muted-foreground font-normal">To Pay: </span>
                                      ₹{payable.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                  {activeTab === 'paid' && entry.paid_at && (
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                      <p>Paid: {format(new Date(entry.paid_at), 'dd/MM/yy hh:mm a')}</p>
                                      <p className="truncate">
                                        By: {entry.paid_by}
                                        {entry.receiver_name ? ` | ${entry.receiver_name}` : ''}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="w-full overflow-x-auto">
                            <table
                              className={`w-full text-sm ${activeTab === 'paid' ? 'min-w-[1000px]' : 'min-w-[820px]'}`}
                            >
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Ticket No</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Tours To</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Booked By</th>
                                  <th className="pb-2 px-3 font-medium text-muted-foreground text-right whitespace-nowrap">Amount</th>
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
                                {list.map((entry) => {
                                  const payable = calculatePayableAmount(entry.amount || 0, commission);
                                  return (
                                    <tr key={entry.id} className="border-b last:border-0">
                                      <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">{entry.ticket_no}</td>
                                      <td className="py-2 px-3 whitespace-nowrap">{entry.tours_to || '-'}</td>
                                      <td className="py-2 px-3 whitespace-nowrap">{entry.booked_by || '-'}</td>
                                      <td className="py-2 px-3 text-right whitespace-nowrap">
                                        ₹{(entry.amount || 0).toLocaleString('en-IN')}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium whitespace-nowrap">
                                        ₹{payable.toLocaleString('en-IN')}
                                      </td>
                                      {activeTab === 'paid' ? (
                                        <>
                                          <td className="py-2 px-3 text-xs whitespace-nowrap">
                                            {entry.paid_at ? format(new Date(entry.paid_at), 'dd/MM/yy hh:mm a') : '-'}
                                          </td>
                                          <td className="py-2 px-3 max-w-[240px] truncate">
                                            {entry.paid_by || '-'}
                                            {entry.receiver_name ? ` | ${entry.receiver_name}` : ''}
                                          </td>
                                        </>
                                      ) : (
                                        <td className="py-2 px-3 text-right">
                                          <Button size="sm" onClick={() => handlePayClick(entry)}>
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

      {/* Ticket Entry Dialog */}
      <Dialog open={entryOpen} onOpenChange={(o) => { setEntryOpen(o); if (!o) resetEntry(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Ticket Entry</DialogTitle>
            <DialogDescription>Add a ticket to track its collection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ticket No <span className="text-destructive">*</span></Label>
              <Input value={eTicketNo} onChange={(e) => setETicketNo(e.target.value)} placeholder="Enter ticket number" />
            </div>
            <div className="space-y-2">
              <Label>Travels Name <span className="text-destructive">*</span></Label>
              <Select value={eTravels} onValueChange={setETravels}>
                <SelectTrigger>
                  <SelectValue placeholder="Select travels" />
                </SelectTrigger>
                <SelectContent>
                  {travels.filter((t) => t.active).map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tours To</Label>
              <Input value={eToursTo} onChange={(e) => setEToursTo(e.target.value)} placeholder="Destination" />
            </div>
            <div className="space-y-2">
              <Label>Booked By</Label>
              {isStaff ? (
                <Input value={eBookedBy} readOnly className="bg-muted" />
              ) : (
                <Select value={eBookedBy} onValueChange={setEBookedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivers.filter((r) => r.active).map((r) => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                inputMode="decimal"
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode <span className="text-destructive">*</span></Label>
              <Select value={eEntryMode} onValueChange={(v) => setEEntryMode(v as 'Cash' | 'Online')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setEntryOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} disabled={savingEntry} className="w-full sm:w-auto">
              {savingEntry ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            {selectedEntry && (
              <DialogDescription className="break-all">
                Mark ticket <span className="font-mono text-xs">{selectedEntry.ticket_no}</span> as paid
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedEntry && (() => {
            const commission = getCommission(selectedEntry.travels_name);
            const baseFare = selectedEntry.amount || 0;
            const commissionAmount = (baseFare * commission) / 100;
            const payable = baseFare - commissionAmount;
            return (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>₹{baseFare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      Commission ({selectedEntry.travels_name}):
                    </span>
                    <span className="text-destructive shrink-0">-₹{commissionAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Payable Amount:</span>
                    <span className="text-base sm:text-lg">₹{payable.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Paid By <span className="text-destructive">*</span></Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {receivers.filter((r) => r.active).map((r) => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Receiver Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="Who received the payment" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Receiver Mobile (Optional)</Label>
                  <Input placeholder="Receiver's mobile number" value={receiverMobile} onChange={(e) => setReceiverMobile(e.target.value)} />
                </div>

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

      {/* Search Ticket Dialog */}
      <Dialog open={searchOpen} onOpenChange={(o) => { setSearchOpen(o); if (!o) { setSearchTicketNo(''); setSearchResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Ticket</DialogTitle>
            <DialogDescription>Enter the ticket number to check its payment status</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ticket number"
                value={searchTicketNo}
                onChange={(e) => setSearchTicketNo(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchTicket(); }}
                autoFocus
              />
              <Button onClick={handleSearchTicket} className="gap-1">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>

            {searchResult === 'notfound' && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                No ticket found with that number.
              </div>
            )}

            {searchResult && searchResult !== 'notfound' && (() => {
              const entry = searchResult as PayEntry;
              const commission = getCommission(entry.travels_name);
              const payable = calculatePayableAmount(entry.amount || 0, commission);
              const isPaid = entry.collection_status === 'Paid';
              return (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-primary">{entry.ticket_no}</p>
                      <p className="text-sm font-medium">{entry.travels_name}</p>
                      {entry.tours_to && <p className="text-xs text-muted-foreground">{entry.tours_to}</p>}
                      {entry.booked_by && <p className="text-xs text-muted-foreground">Booked by: {entry.booked_by}</p>}
                    </div>
                    <Badge
                      variant={isPaid ? 'default' : 'secondary'}
                      className={isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t pt-2">
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span>₹{(entry.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="font-semibold">
                      <span className="text-muted-foreground font-normal">To Pay: </span>
                      ₹{payable.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {isPaid ? (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Paid {entry.paid_at && format(new Date(entry.paid_at), 'dd/MM/yy hh:mm a')}
                      {entry.paid_by ? ` • By: ${entry.paid_by}` : ''}
                      {entry.payment_mode ? ` • ${entry.payment_mode}` : ''}
                    </div>
                  ) : (
                    <Button onClick={() => openPayFromSearch(entry)} className="w-full">
                      Pay Now
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
