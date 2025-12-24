import { useState, useEffect, useMemo } from 'react';
import { TicketWithPayment, Payment } from '@/types/ticket';
import { getReceivers, savePayment, saveTicket, getTravels, calculatePayableAmount } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  onSuccess: () => void;
}

export function PaymentDialog({ ticket, open, onOpenChange, onSuccess }: PaymentDialogProps) {
  const [receivedBy, setReceivedBy] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [receivers, setReceivers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const activeReceivers = getReceivers().filter(r => r.active);
    setReceivers(activeReceivers);
  }, [open]);

  // Calculate payable amount based on travel's commission percentage
  const payableAmount = useMemo(() => {
    if (!ticket) return 0;
    
    const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;
    const travels = getTravels();
    const ticketTravel = travels.find(t => t.name === ticket.travelsName);
    
    // Use travel's commission or default 10% for "Other" or unknown
    const commissionPercent = ticketTravel?.commissionPercent ?? 10;
    
    return calculatePayableAmount(baseAmount, commissionPercent);
  }, [ticket]);

  const commissionInfo = useMemo(() => {
    if (!ticket) return { percent: 10, name: 'Other' };
    
    const travels = getTravels();
    const ticketTravel = travels.find(t => t.name === ticket.travelsName);
    
    return {
      percent: ticketTravel?.commissionPercent ?? 10,
      name: ticketTravel?.name || ticket.travelsName || 'Other'
    };
  }, [ticket]);

  const handleSubmit = () => {
    if (!ticket) return;
    if (!receivedBy) {
      toast.error('Please select who received the payment');
      return;
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      receivedByName: receivedBy,
      paymentMode,
      paidAmount: payableAmount,
      paidAt: new Date().toISOString(),
    };

    // Update ticket status
    saveTicket({
      ...ticket,
      collectionStatus: 'Paid',
    });

    // Save payment
    savePayment(payment);

    toast.success('Payment recorded successfully');
    onOpenChange(false);
    onSuccess();
    
    // Reset form
    setReceivedBy('');
    setPaymentMode('Cash');
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

          <div className="grid gap-2">
            <Label htmlFor="receivedBy">Received By</Label>
            <Select value={receivedBy} onValueChange={setReceivedBy}>
              <SelectTrigger id="receivedBy">
                <SelectValue placeholder="Select receiver" />
              </SelectTrigger>
              <SelectContent>
                {receivers.map((receiver) => (
                  <SelectItem key={receiver.id} value={receiver.name}>
                    {receiver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-success hover:bg-success/90">
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
