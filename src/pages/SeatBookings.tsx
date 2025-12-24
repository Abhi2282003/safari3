import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Bus, User, IndianRupee, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeatBookings, useAgents, calculateBookingAmounts, BookingType, SeatBooking } from '@/hooks/useSeatBookings';
import { useTravels } from '@/hooks/useTickets';

const TOTAL_SEATS = 36;

export default function SeatBookings() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [editingBooking, setEditingBooking] = useState<SeatBooking | null>(null);

  const { seatBookings, loading, getSeatsByDate, saveSeatBooking, markCollected, deleteSeatBooking } = useSeatBookings();
  const { agents } = useAgents();
  const { travels } = useTravels();

  const [formData, setFormData] = useState({
    bookingType: 'self' as BookingType,
    agentId: '',
    bookingAmount: '',
    travelsName: '',
    busName: '',
    passengerName: '',
    notes: '',
  });

  const dayBookings = useMemo(() => getSeatsByDate(selectedDate), [selectedDate, seatBookings]);

  const getBookingForSeat = (seatNumber: number): SeatBooking | undefined => {
    return dayBookings.find((b) => b.seatNumber === seatNumber);
  };

  const handleSeatClick = (seatNumber: number) => {
    const existing = getBookingForSeat(seatNumber);
    if (existing) {
      setEditingBooking(existing);
      setFormData({
        bookingType: existing.bookingType,
        agentId: existing.agentId || '',
        bookingAmount: existing.bookingAmount.toString(),
        travelsName: existing.travelsName || '',
        busName: existing.busName || '',
        passengerName: existing.passengerName || '',
        notes: existing.notes || '',
      });
    } else {
      setEditingBooking(null);
      setFormData({
        bookingType: 'self',
        agentId: '',
        bookingAmount: '',
        travelsName: travels[0]?.name || '',
        busName: '',
        passengerName: '',
        notes: '',
      });
    }
    setSelectedSeat(seatNumber);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedSeat) return;
    if (!formData.bookingAmount || parseFloat(formData.bookingAmount) <= 0) {
      toast.error('Please enter a valid booking amount');
      return;
    }
    if (formData.bookingType === 'agent' && !formData.agentId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      await saveSeatBooking({
        id: editingBooking?.id,
        journeyDate: format(selectedDate, 'yyyy-MM-dd'),
        seatNumber: selectedSeat,
        bookingType: formData.bookingType,
        agentId: formData.agentId || undefined,
        bookingAmount: parseFloat(formData.bookingAmount),
        commissionPercent: 0,
        ourEarning: 0,
        amountToOwner: 0,
        amountFromAgent: 0,
        agentCollectionStatus: 'pending',
        travelsName: formData.travelsName || undefined,
        busName: formData.busName || undefined,
        passengerName: formData.passengerName || undefined,
        notes: formData.notes || undefined,
      });
      toast.success(editingBooking ? 'Booking updated' : 'Seat booked successfully');
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save booking');
    }
  };

  const handleDelete = async () => {
    if (!editingBooking) return;
    try {
      await deleteSeatBooking(editingBooking.id);
      toast.success('Booking deleted');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const handleMarkCollected = async () => {
    if (!editingBooking) return;
    try {
      await markCollected(editingBooking.id);
      toast.success('Marked as collected');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to mark as collected');
    }
  };

  const amounts = useMemo(() => {
    const amount = parseFloat(formData.bookingAmount) || 0;
    return calculateBookingAmounts(formData.bookingType, amount);
  }, [formData.bookingType, formData.bookingAmount]);

  const daySummary = useMemo(() => {
    const online = dayBookings.filter((b) => b.bookingType === 'online');
    const agent = dayBookings.filter((b) => b.bookingType === 'agent');
    const self = dayBookings.filter((b) => b.bookingType === 'self');
    const totalProfit = dayBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const pendingFromAgents = agent
      .filter((b) => b.agentCollectionStatus === 'pending')
      .reduce((sum, b) => sum + b.amountFromAgent, 0);

    return {
      total: dayBookings.length,
      online: online.length,
      agent: agent.length,
      self: self.length,
      totalProfit,
      pendingFromAgents,
    };
  }, [dayBookings]);

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
          <h1 className="text-2xl font-bold text-foreground">Seat Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Track each seat booking with commission breakdown
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left: Date selector & summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Day Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Booked Seats</span>
                  <span className="font-medium">{daySummary.total} / {TOTAL_SEATS}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Online (5%)</span>
                  <span>{daySummary.online}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Agent (5%)</span>
                  <span>{daySummary.agent}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Self (15%)</span>
                  <span>{daySummary.self}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-medium text-primary">
                  <span>Today's Profit</span>
                  <span>₹{daySummary.totalProfit.toFixed(0)}</span>
                </div>
                {daySummary.pendingFromAgents > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Pending from Agents</span>
                    <span>₹{daySummary.pendingFromAgents.toFixed(0)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border" />
                <span>Empty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>Online (5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span>Agent (5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Self (15%)</span>
              </div>
            </div>
          </div>

          {/* Right: Seat grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Bus Layout - {format(selectedDate, 'EEE, dd MMM yyyy')}
              </CardTitle>
              <CardDescription>Click on a seat to book or edit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 max-w-lg">
                {Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1).map((seatNum) => {
                  const booking = getBookingForSeat(seatNum);
                  const isBooked = !!booking;

                  let bgClass = 'bg-muted hover:bg-muted/80 border';
                  if (booking?.bookingType === 'online') bgClass = 'bg-blue-500 hover:bg-blue-600 text-white';
                  if (booking?.bookingType === 'agent') bgClass = 'bg-amber-500 hover:bg-amber-600 text-white';
                  if (booking?.bookingType === 'self') bgClass = 'bg-green-500 hover:bg-green-600 text-white';

                  return (
                    <button
                      key={seatNum}
                      onClick={() => handleSeatClick(seatNum)}
                      className={cn(
                        'aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors relative',
                        bgClass
                      )}
                    >
                      <span>{seatNum}</span>
                      {booking && booking.bookingType === 'agent' && booking.agentCollectionStatus === 'pending' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Seat {selectedSeat} - {format(selectedDate, 'dd MMM yyyy')}
              </DialogTitle>
              <DialogDescription>
                {editingBooking ? 'Edit booking details' : 'Add new booking'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Booking Type</Label>
                <Select
                  value={formData.bookingType}
                  onValueChange={(v) => setFormData({ ...formData, bookingType: v as BookingType, agentId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (5% commission)</SelectItem>
                    <SelectItem value="agent">Agent (15% total, 5% ours)</SelectItem>
                    <SelectItem value="self">Self (15% commission)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.bookingType === 'agent' && (
                <div className="grid gap-2">
                  <Label>Agent</Label>
                  <Select
                    value={formData.agentId}
                    onValueChange={(v) => setFormData({ ...formData, agentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.filter((a) => a.active).map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Booking Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.bookingAmount}
                  onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>

              <div className="grid gap-2">
                <Label>Travels Name</Label>
                <Select
                  value={formData.travelsName}
                  onValueChange={(v) => setFormData({ ...formData, travelsName: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select travels" />
                  </SelectTrigger>
                  <SelectContent>
                    {travels.filter((t) => t.active).map((travel) => (
                      <SelectItem key={travel.id} value={travel.name}>
                        {travel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Passenger Name (optional)</Label>
                <Input
                  value={formData.passengerName}
                  onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                  placeholder="Passenger name"
                />
              </div>

              {/* Amount breakdown */}
              {parseFloat(formData.bookingAmount) > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Booking Amount</span>
                      <span>₹{parseFloat(formData.bookingAmount).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Commission ({amounts.commissionPercent}%)</span>
                      <span>₹{(parseFloat(formData.bookingAmount) * amounts.commissionPercent / 100).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-primary font-medium">
                      <span>Our Earning</span>
                      <span>₹{amounts.ourEarning.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pay to Owner</span>
                      <span>₹{amounts.amountToOwner.toFixed(0)}</span>
                    </div>
                    {formData.bookingType === 'agent' && (
                      <div className="flex justify-between text-amber-600">
                        <span>Collect from Agent</span>
                        <span>₹{amounts.amountFromAgent.toFixed(0)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {editingBooking && editingBooking.bookingType === 'agent' && editingBooking.agentCollectionStatus === 'pending' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-green-600 border-green-600"
                  onClick={handleMarkCollected}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Collected (₹{editingBooking.amountFromAgent.toFixed(0)})
                </Button>
              )}

              {editingBooking && editingBooking.agentCollectionStatus === 'collected' && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Collected on {editingBooking.collectedAt ? format(new Date(editingBooking.collectedAt), 'dd MMM yyyy') : 'N/A'}
                </Badge>
              )}
            </div>

            <DialogFooter className="gap-2">
              {editingBooking && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingBooking ? 'Update' : 'Book Seat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
