import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';

export default function PayCollection() {
  const { tickets, loading } = useTickets();
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');

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

  // Calculate totals
  const totals = useMemo(() => {
    const paidTotal = Object.values(groupedTickets.paid).flat().reduce((sum, t) => sum + (t.amount || 0), 0);
    const unpaidTotal = Object.values(groupedTickets.unpaid).flat().reduce((sum, t) => sum + (t.amount || 0), 0);
    const paidCount = Object.values(groupedTickets.paid).flat().length;
    const unpaidCount = Object.values(groupedTickets.unpaid).flat().length;
    return { paidTotal, unpaidTotal, paidCount, unpaidCount };
  }, [groupedTickets]);

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
                  const groupTotal = ticketList.reduce((sum, t) => sum + (t.amount || 0), 0);

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
                                <TableHead>Passenger</TableHead>
                                <TableHead>Journey Date</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ticketList.map((ticket) => (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-mono text-xs">{ticket.ticketNo}</TableCell>
                                  <TableCell>{ticket.passengerName}</TableCell>
                                  <TableCell>{format(new Date(ticket.journeyDate), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>{ticket.toursTo}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    ₹{(ticket.amount || 0).toLocaleString('en-IN')}
                                  </TableCell>
                                </TableRow>
                              ))}
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
    </Layout>
  );
}
