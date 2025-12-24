import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTickets, useTravels } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface DailyReport {
  date: Date;
  totalTickets: number;
  totalCollection: number;
  totalUnpaid: number;
  paidCount: number;
  unpaidCount: number;
}

// Calculate payable amount (base amount minus commission percentage)
const calculatePayableAmount = (baseAmount: number, commissionPercent: number): number => {
  const commission = (baseAmount * commissionPercent) / 100;
  return baseAmount - commission;
};

export default function Reports() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const { tickets, loading } = useTickets();
  const { travels } = useTravels();

  const reports = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTickets = tickets.filter(ticket => {
        const ticketDate = format(new Date(ticket.bookingDateTime), 'yyyy-MM-dd');
        return ticketDate === dateStr;
      });

      const paidTickets = dayTickets.filter(t => t.collectionStatus === 'Paid');
      const unpaidTickets = dayTickets.filter(t => t.collectionStatus === 'Unpaid');

      // Collection uses base amount minus travel's commission percentage
      const totalCollection = paidTickets.reduce((sum, t) => {
        const baseAmount = t.surcharges ? t.amount - t.surcharges : t.amount;
        const ticketTravel = travels.find(tr => tr.name === t.travelsName);
        const commissionPercent = ticketTravel?.commissionPercent ?? 10;
        const payable = calculatePayableAmount(baseAmount, commissionPercent);
        return sum + payable;
      }, 0);

      const totalUnpaid = unpaidTickets.reduce((sum, t) => {
        const baseAmount = t.surcharges ? t.amount - t.surcharges : t.amount;
        const ticketTravel = travels.find(tr => tr.name === t.travelsName);
        const commissionPercent = ticketTravel?.commissionPercent ?? 10;
        const payable = calculatePayableAmount(baseAmount, commissionPercent);
        return sum + payable;
      }, 0);

      return {
        date,
        totalTickets: dayTickets.length,
        totalCollection,
        totalUnpaid,
        paidCount: paidTickets.length,
        unpaidCount: unpaidTickets.length,
      };
    }).filter(r => r.totalTickets > 0);
  }, [tickets, travels, startDate, endDate]);

  const totals = reports.reduce((acc, r) => ({
    tickets: acc.tickets + r.totalTickets,
    collection: acc.collection + r.totalCollection,
    unpaid: acc.unpaid + r.totalUnpaid,
  }), { tickets: 0, collection: 0, unpaid: 0 });

  const handleExportCSV = () => {
    const headers = ['Date', 'Tickets', 'Collection (₹)', 'Unpaid (₹)'];
    const rows = reports.map(r => [
      format(r.date, 'dd/MM/yyyy'),
      r.totalTickets,
      r.totalCollection.toFixed(2),
      r.totalUnpaid.toFixed(2),
    ]);

    // Add totals row
    rows.push(['TOTAL', totals.tickets.toString(), totals.collection.toFixed(2), totals.unpaid.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`;
    a.click();
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and export booking reports
          </p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold">{totals.tickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Collection</p>
              <p className="text-2xl font-bold text-success">₹{totals.collection.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Unpaid</p>
              <p className="text-2xl font-bold text-destructive">₹{totals.unpaid.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Report Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-center">Tickets</TableHead>
                      <TableHead className="font-semibold text-right">Collection (₹)</TableHead>
                      <TableHead className="font-semibold text-right">Unpaid (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.date.toISOString()}>
                        <TableCell className="font-medium">
                          {format(report.date, 'EEE, dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-center">{report.totalTickets}</TableCell>
                        <TableCell className="text-right text-success font-semibold">
                          ₹{report.totalCollection.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          ₹{report.totalUnpaid.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">{totals.tickets}</TableCell>
                      <TableCell className="text-right text-success">
                        ₹{totals.collection.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        ₹{totals.unpaid.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No tickets found in selected date range
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}