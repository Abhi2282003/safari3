import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Ticket, TravelsConfig } from '@/types/ticket';
import { generateTicketNo, saveTicket, getTicketById, getReceivers, getTravels } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface TicketFormProps {
  ticketId?: string;
  mode?: 'create' | 'edit';
}

// Helper to calculate reporting time (15 mins before departure)
const calculateReportingTime = (depTime: string): string => {
  if (!depTime) return '';
  const [hours, mins] = depTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins - 15, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export function TicketForm({ ticketId, mode = 'create' }: TicketFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receivers, setReceivers] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [travelsList, setTravelsList] = useState<TravelsConfig[]>([]);
  
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerPhone: '',
    toursTo: '',
    journeyDate: new Date(),
    bookingDate: new Date(),
    noOfTourist: '',
    seatNo: '',
    depTime: '',
    amount: '',
    surcharges: '',
    travelsName: '',
    customTravelsName: '',
    busName: '',
    busNo: '',
    branch: '',
    bookedBy: '',
    withFamily: false,
  });

  useEffect(() => {
    setReceivers(getReceivers());
    setTravelsList(getTravels().filter(t => t.active));
    
    if (mode === 'edit' && ticketId) {
      const ticket = getTicketById(ticketId);
      if (ticket) {
        setFormData({
          passengerName: ticket.passengerName,
          passengerPhone: ticket.passengerPhone,
          toursTo: ticket.toursTo,
          journeyDate: new Date(ticket.journeyDate),
          bookingDate: new Date(ticket.bookingDateTime),
          noOfTourist: ticket.noOfTourist.toString(),
          seatNo: ticket.seatNo || '',
          depTime: ticket.depTime || '',
          amount: (ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount).toString(),
          surcharges: ticket.surcharges?.toString() || '',
          travelsName: ticket.travelsName || '',
          customTravelsName: '',
          busName: ticket.busName || '',
          busNo: ticket.busNo || '',
          branch: ticket.branch || '',
          bookedBy: ticket.bookedBy || '',
          withFamily: ticket.withFamily || false,
        });
      }
    }
  }, [ticketId, mode]);

  const handleDepTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      depTime: time,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.passengerName.trim()) {
      toast.error('Passenger name is required');
      return;
    }
    if (!formData.passengerPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.toursTo.trim()) {
      toast.error('Tours To (Destination) is required');
      return;
    }
    const tourists = parseInt(formData.noOfTourist) || 0;
    if (tourists < 1) {
      toast.error('Number of tourists must be at least 1');
      return;
    }
    const baseAmount = parseFloat(formData.amount) || 0;
    if (baseAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const existingTicket = ticketId ? getTicketById(ticketId) : null;
      
      const surcharges = parseFloat(formData.surcharges) || 0;
      // Total amount includes surcharges
      const totalAmount = baseAmount + surcharges;
      
      // Calculate reporting time as 15 mins before departure
      const repTime = calculateReportingTime(formData.depTime);
      
      const ticket: Ticket = {
        id: existingTicket?.id || crypto.randomUUID(),
        ticketNo: existingTicket?.ticketNo || generateTicketNo(),
        bookingDateTime: formData.bookingDate.toISOString(),
        journeyDate: formData.journeyDate.toISOString(),
        passengerName: formData.passengerName.trim(),
        passengerPhone: formData.passengerPhone.trim(),
        toursTo: formData.toursTo.trim(),
        noOfTourist: tourists,
        seatNo: formData.seatNo.trim() || undefined,
        repTime: repTime || undefined,
        depTime: formData.depTime.trim() || undefined,
        amount: totalAmount, // Store total (base + surcharges)
        surcharges: surcharges || undefined,
        travelsName: formData.travelsName === '__other__' ? formData.customTravelsName : (formData.travelsName || undefined),
        busName: formData.busName.trim() || undefined,
        busNo: formData.busNo.trim() || undefined,
        branch: formData.branch.trim() || undefined,
        bookedBy: formData.bookedBy || undefined,
        withFamily: formData.withFamily,
        collectionStatus: existingTicket?.collectionStatus || 'Unpaid',
      };

      saveTicket(ticket);
      
      toast.success(mode === 'edit' ? 'Ticket updated successfully' : 'Ticket created successfully');
      navigate(`/ticket/${ticket.id}`);
    } catch (error) {
      toast.error('Failed to save ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeReceivers = receivers.filter(r => r.active);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Passenger Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Passenger Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="passengerName">Shri/Smt (Passenger Name) *</Label>
              <Input
                id="passengerName"
                value={formData.passengerName}
                onChange={(e) => setFormData(prev => ({ ...prev, passengerName: e.target.value }))}
                placeholder="Enter passenger name"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="withFamily"
                checked={formData.withFamily}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, withFamily: checked === true }))
                }
              />
              <Label htmlFor="withFamily" className="text-sm font-normal">
                With Family/Friends
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.passengerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, passengerPhone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tourists">No. of Tourist *</Label>
              <Input
                id="tourists"
                type="number"
                min={1}
                value={formData.noOfTourist}
                onChange={(e) => setFormData(prev => ({ ...prev, noOfTourist: e.target.value }))}
                placeholder="Enter number"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Journey Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journey Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="toursTo">Tours To (Destination) *</Label>
              <Input
                id="toursTo"
                value={formData.toursTo}
                onChange={(e) => setFormData(prev => ({ ...prev, toursTo: e.target.value }))}
                placeholder="e.g., Pune to Mumbai"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Journey Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.journeyDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.journeyDate ? format(formData.journeyDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.journeyDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, journeyDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Booking Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.bookingDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.bookingDate ? format(formData.bookingDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.bookingDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, bookingDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seatNo">Seat No.</Label>
                <Input
                  id="seatNo"
                  value={formData.seatNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, seatNo: e.target.value }))}
                  placeholder="e.g., A1, B2"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="busNo">Bus No.</Label>
                <Input
                  id="busNo"
                  value={formData.busNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, busNo: e.target.value }))}
                  placeholder="e.g., MH12AB1234"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="depTime">Departure Time</Label>
              <Input
                id="depTime"
                type="time"
                value={formData.depTime}
                onChange={(e) => handleDepTimeChange(e.target.value)}
              />
              {formData.depTime && (
                <p className="text-xs text-muted-foreground">
                  Reporting Time: {calculateReportingTime(formData.depTime)} (15 mins before departure)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bus & Travel Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="travelsName">Travels Name</Label>
                {formData.travelsName === '__other__' ? (
                  <div className="flex gap-2">
                    <Input
                      id="customTravelsName"
                      value={formData.customTravelsName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, customTravelsName: e.target.value }))}
                      placeholder="Enter travels name"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, travelsName: '', customTravelsName: '' }))}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.travelsName}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travelsName: value, customTravelsName: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select travels" />
                    </SelectTrigger>
                    <SelectContent>
                      {travelsList.map((travel) => (
                        <SelectItem key={travel.id} value={travel.name}>
                          {travel.name} ({travel.commissionPercent}%)
                        </SelectItem>
                      ))}
                      <SelectItem value="__other__">Other (10%)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="busName">Bus Name</Label>
                <Input
                  id="busName"
                  value={formData.busName}
                  onChange={(e) => setFormData(prev => ({ ...prev, busName: e.target.value }))}
                  placeholder="e.g., Sleeper Coach"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bookedBy">Booked By</Label>
                <Select
                  value={formData.bookedBy}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bookedBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeReceivers.map((receiver) => (
                      <SelectItem key={receiver.id} value={receiver.name}>
                        {receiver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Base Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter base amount"
                  className="text-lg font-semibold"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="surcharges">Surcharges (₹)</Label>
                <Input
                  id="surcharges"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.surcharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, surcharges: e.target.value }))}
                  placeholder="Additional charges"
                  className="text-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{((parseFloat(formData.amount) || 0) + (parseFloat(formData.surcharges) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Payment status can be updated after saving the ticket.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Ticket' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}
