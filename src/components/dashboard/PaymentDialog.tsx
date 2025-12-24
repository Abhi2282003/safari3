import { useState, useMemo } from 'react';
import { TicketWithPayment } from '@/types/ticket';
import { useReceivers, useTravels } from '@/hooks/useTickets';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface PaymentDialogProps {
  ticket: TicketWithPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (paidBy: string, paymentMode: 'Cash' | 'UPI' | 'Card' | 'Other', paidAmount: number) => Promise<void>;
}

export function PaymentDialog({ ticket, open, onOpenChange, onSubmit }: PaymentDialogProps) {
  const [paidBy, setPaidBy] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { receivers } = useReceivers();
  const { travels } = useTravels();

  const activeReceivers = useMemo(() => receivers.filter(r => r.active), [receivers]);

  // Calculate payable amount based on travel's commission percentage
  const payableAmount = useMemo(() => {
    if (!ticket) return 0;
    
    const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;
    const ticketTravel = travels.find(t => t.name === ticket.travelsName);
    
    // Use travel's commission or default 10% for "Other" or unknown
    const commissionPercent = ticketTravel?.commissionPercent ?? 10;
    
    return Math.round(baseAmount - (baseAmount * commissionPercent / 100));
  }, [ticket, travels]);

  const commissionInfo = useMemo(() => {
    if (!ticket) return { percent: 10, name: 'Other' };
    
    const ticketTravel = travels.find(t => t.name === ticket.travelsName);
    
    return {
      percent: ticketTravel?.commissionPercent ?? 10,
      name: ticketTravel?.name || ticket.travelsName || 'Other'
    };
  }, [ticket, travels]);

  const handleSubmit = async () => {
    if (!ticket) return;
    if (!paidBy) {
      toast.error('Please select who to pay');
      return;
    }
    if (!receiverName.trim()) {
      toast.error('Please enter receiver name');
      return;
    }

    // Combine receiver info with paidBy
    const receiverInfo = receiverMobile.trim() 
      ? `${receiverName.trim()} (${receiverMobile.trim()})`
      : receiverName.trim();
    
    // Store both paid by and receiver info
    const paymentInfo = `${paidBy} | Receiver: ${receiverInfo}`;

    setIsSubmitting(true);
    try {
      await onSubmit(paymentInfo, paymentMode, payableAmount);
      toast.success('Payment recorded successfully');
      onOpenChange(false);
      
      // Reset form
      setPaidBy('');
      setReceiverName('');
      setReceiverMobile('');
      setPaymentMode('Cash');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Mark ticket <span className="font-mono font-medium">{ticket?.ticketNo}</span> as paid
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Amount Breakdown */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Amount:</span>
              <span>₹{ticket ? (ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount).toLocaleString() : 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commission ({commissionInfo.name} - {commissionInfo.percent}%):</span>
              <span className="text-destructive">
                -₹{ticket ? Math.round((ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount) * commissionInfo.percent / 100).toLocaleString() : 0}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Payable Amount:</span>
              <span className="text-lg text-primary">₹{payableAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Paid By - Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="paidBy">Paid To *</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Select who to pay" />
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

          {/* Receiver Name - Manual Input */}
          <div className="grid gap-2">
            <Label htmlFor="receiverName">Receiver Name *</Label>
            <Input
              id="receiverName"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Who received the payment"
            />
          </div>

          {/* Receiver Mobile - Manual Input */}
          <div className="grid gap-2">
            <Label htmlFor="receiverMobile">Receiver Mobile (Optional)</Label>
            <Input
              id="receiverMobile"
              value={receiverMobile}
              onChange={(e) => setReceiverMobile(e.target.value)}
              placeholder="Receiver's mobile number"
              type="tel"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as typeof paymentMode)}>
              <SelectTrigger id="mode">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-success hover:bg-success/90" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
