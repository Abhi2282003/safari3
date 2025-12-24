import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, Lock, TrendingUp, IndianRupee, Download, Users, Wifi, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeatBookings } from '@/hooks/useSeatBookings';
import { PasswordDialog } from '@/components/shared/PasswordDialog';

const PROFIT_PASSWORD = 'safari123';

export default function Profit() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const { seatBookings, loading, getDailyProfitSummary, getPendingCollections } = useSeatBookings();

  const dailySummaries = useMemo(() => {
    return getDailyProfitSummary(startDate, endDate);
  }, [startDate, endDate, seatBookings]);

  const monthlySummaries = useMemo(() => {
    const months: { [key: string]: typeof dailySummaries[0] } = {};
    
    dailySummaries.forEach((day) => {
      const monthKey = format(new Date(day.date), 'yyyy-MM');
      if (!months[monthKey]) {
        months[monthKey] = {
          date: monthKey,
          onlineCount: 0,
          onlineProfit: 0,
          agentCount: 0,
          agentProfit: 0,
          selfCount: 0,
          selfProfit: 0,
          totalProfit: 0,
          totalSeats: 0,
          pendingCollections: 0,
        };
      }
      months[monthKey].onlineCount += day.onlineCount;
      months[monthKey].onlineProfit += day.onlineProfit;
      months[monthKey].agentCount += day.agentCount;
      months[monthKey].agentProfit += day.agentProfit;
      months[monthKey].selfCount += day.selfCount;
      months[monthKey].selfProfit += day.selfProfit;
      months[monthKey].totalProfit += day.totalProfit;
      months[monthKey].totalSeats += day.totalSeats;
      months[monthKey].pendingCollections += day.pendingCollections;
    });

    return Object.values(months);
  }, [dailySummaries]);

  const totals = useMemo(() => {
    return dailySummaries.reduce(
      (acc, day) => ({
        onlineCount: acc.onlineCount + day.onlineCount,
        onlineProfit: acc.onlineProfit + day.onlineProfit,
        agentCount: acc.agentCount + day.agentCount,
        agentProfit: acc.agentProfit + day.agentProfit,
        selfCount: acc.selfCount + day.selfCount,
        selfProfit: acc.selfProfit + day.selfProfit,
        totalProfit: acc.totalProfit + day.totalProfit,
        totalSeats: acc.totalSeats + day.totalSeats,
        pendingCollections: acc.pendingCollections + day.pendingCollections,
      }),
      {
        onlineCount: 0,
        onlineProfit: 0,
        agentCount: 0,
        agentProfit: 0,
        selfCount: 0,
        selfProfit: 0,
        totalProfit: 0,
        totalSeats: 0,
        pendingCollections: 0,
      }
    );
  }, [dailySummaries]);

  const pendingCollections = useMemo(() => getPendingCollections(), [seatBookings]);

  const handlePasswordSuccess = () => {
    setIsUnlocked(true);
    setPasswordDialogOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Online', 'Online Profit', 'Agent', 'Agent Profit', 'Self', 'Self Profit', 'Total Profit'];
    const rows = dailySummaries
      .filter((d) => d.totalSeats > 0)
      .map((d) => [
        d.date,
        d.onlineCount,
        d.onlineProfit.toFixed(0),
        d.agentCount,
        d.agentProfit.toFixed(0),
        d.selfCount,
        d.selfProfit.toFixed(0),
        d.totalProfit.toFixed(0),
      ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setThisMonth = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
  };

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setStartDate(startOfMonth(lastMonth));
    setEndDate(endOfMonth(lastMonth));
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <Lock className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profit Reports</h1>
          <p className="text-muted-foreground mb-6">Enter password to view profit data</p>
          <Button onClick={() => setPasswordDialogOpen(true)}>
            Unlock Reports
          </Button>
          <PasswordDialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
            onSuccess={handlePasswordSuccess}
            title="Access Profit Reports"
            description="Enter the admin password to view profit data"
          />
        </div>
      </Layout>
    );
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Profit Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Track earnings by booking type
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Date Range */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(startDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => d && setStartDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(endDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => d && setEndDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={setThisMonth}>
                  This Month
                </Button>
                <Button variant="secondary" size="sm" onClick={setLastMonth}>
                  Last Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{totals.totalProfit.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{totals.totalSeats} seats booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Online (5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{totals.onlineProfit.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{totals.onlineCount} bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Agent (5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">₹{totals.agentProfit.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{totals.agentCount} bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Self (15%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totals.selfProfit.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{totals.selfCount} bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Collections Alert */}
        {totals.pendingCollections > 0 && (
          <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Pending Agent Collections
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300">
                    ₹{totals.pendingCollections.toFixed(0)} to collect from {pendingCollections.length} bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily/Monthly Tabs */}
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Online</TableHead>
                        <TableHead className="text-right">Agent</TableHead>
                        <TableHead className="text-right">Self</TableHead>
                        <TableHead className="text-right">Total Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailySummaries
                        .filter((d) => d.totalSeats > 0)
                        .map((day) => (
                          <TableRow key={day.date}>
                            <TableCell className="font-medium">
                              {format(new Date(day.date), 'EEE, dd MMM')}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">{day.onlineCount}× </span>
                              <span className="text-blue-600">₹{day.onlineProfit.toFixed(0)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">{day.agentCount}× </span>
                              <span className="text-amber-600">₹{day.agentProfit.toFixed(0)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">{day.selfCount}× </span>
                              <span className="text-green-600">₹{day.selfProfit.toFixed(0)}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{day.totalProfit.toFixed(0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      {dailySummaries.filter((d) => d.totalSeats > 0).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No bookings in selected date range
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Online</TableHead>
                        <TableHead className="text-right">Agent</TableHead>
                        <TableHead className="text-right">Self</TableHead>
                        <TableHead className="text-right">Total Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummaries.map((month) => (
                        <TableRow key={month.date}>
                          <TableCell className="font-medium">
                            {format(new Date(month.date + '-01'), 'MMMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-muted-foreground">{month.onlineCount}× </span>
                            <span className="text-blue-600">₹{month.onlineProfit.toFixed(0)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-muted-foreground">{month.agentCount}× </span>
                            <span className="text-amber-600">₹{month.agentProfit.toFixed(0)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-muted-foreground">{month.selfCount}× </span>
                            <span className="text-green-600">₹{month.selfProfit.toFixed(0)}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{month.totalProfit.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
