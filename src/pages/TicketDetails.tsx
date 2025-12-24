import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Printer, 
  Pencil, 
  CreditCard,
  Trash2,
  Phone,
  User,
  Calendar,
  Clock,
  Bus as BusIcon,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import { PasswordDialog } from '@/components/shared/PasswordDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TicketWithPayment, Ticket, Payment } from '@/types/ticket';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketWithPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (ticketError) throw ticketError;

      if (ticketData) {
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('ticket_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        const transformedTicket: Ticket = {
          id: ticketData.id,
          ticketNo: ticketData.ticket_no,
          bookingDateTime: ticketData.booking_date_time,
          journeyDate: ticketData.journey_date,
          passengerName: ticketData.passenger_name,
          passengerPhone: ticketData.passenger_phone,
          passengerAddress: ticketData.passenger_address || undefined,
          toursTo: ticketData.tours_to,
          noOfTourist: ticketData.no_of_tourist,
          seatNo: ticketData.seat_no || undefined,
          repTime: ticketData.rep_time || undefined,
          depTime: ticketData.dep_time || undefined,
          amount: Number(ticketData.amount),
          surcharges: ticketData.surcharges ? Number(ticketData.surcharges) : undefined,
          travelsName: ticketData.travels_name || undefined,
          busName: ticketData.bus_name || undefined,
          busNo: ticketData.bus_no || undefined,
          branch: ticketData.branch || undefined,
          bookedBy: ticketData.booked_by || undefined,
          withFamily: ticketData.with_family || false,
          collectionStatus: ticketData.collection_status as 'Paid' | 'Unpaid',
        };

        const payment: Payment | undefined = paymentData ? {
          id: paymentData.id,
          ticketId: paymentData.ticket_id,
          receivedByName: paymentData.received_by_name,
          paymentMode: paymentData.payment_mode as 'Cash' | 'UPI' | 'Card' | 'Other',
          paidAmount: Number(paymentData.paid_amount),
          paidAt: paymentData.paid_at,
        } : undefined;

        setTicket({ ...transformedTicket, payment });
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Ticket deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handlePayment = async (paidBy: string, paymentMode: 'Cash' | 'UPI' | 'Card' | 'Other', paidAmount: number) => {
    if (!ticket || !user) return;

    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: user.id,
      ticket_id: ticket.id,
      received_by_name: paidBy,
      payment_mode: paymentMode,
      paid_amount: paidAmount,
      paid_at: new Date().toISOString(),
    });

    if (paymentError) throw paymentError;

    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ collection_status: 'Paid' })
      .eq('id', ticket.id);

    if (ticketError) throw ticketError;

    setShowPayment(false);
    await loadTicket();
  };

  const handleEditClick = () => {
    setShowEditPassword(true);
  };

  const handleDeleteClick = () => {
    setShowDeletePassword(true);
  };

  const handleEditConfirmed = () => {
    navigate(`/edit-ticket/${id}`);
  };

  const handleDeleteConfirmed = () => {
    setShowDelete(true);
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

  if (!ticket) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Ticket not found</p>
          <Link to="/">
            <Button variant="link">Go to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Calculate base amount (without surcharges) for collection display
  const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground font-mono">
                  {ticket.ticketNo}
                </h1>
                <Badge 
                  variant={ticket.collectionStatus === 'Paid' ? 'default' : 'destructive'}
                  className={ticket.collectionStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}
                >
                  {ticket.collectionStatus === 'Paid' ? '✓ Paid' : '✗ Unpaid'}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Booked on {format(new Date(ticket.bookingDateTime), 'dd MMM yyyy, hh:mm a')}
                {ticket.bookedBy && ` by ${ticket.bookedBy}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate(`/ticket/${id}/print`)} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {ticket.collectionStatus === 'Unpaid' && (
                <Button onClick={() => setShowPayment(true)} className="gap-2 bg-success hover:bg-success/90">
                  <CreditCard className="h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              <Button variant="outline" onClick={handleEditClick} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleDeleteClick} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Passenger & Journey Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Passenger Name</p>
                    <p className="font-semibold text-lg">
                      {ticket.passengerName}
                      {ticket.withFamily && (
                        <span className="text-sm text-muted-foreground ml-2">(with Family/Friends)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.passengerPhone}</span>
                  </div>

                  {ticket.passengerAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p>{ticket.passengerAddress}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">Tours To</p>
                    <p className="font-semibold">{ticket.toursTo}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Journey Date</p>
                      <p className="font-semibold">{format(new Date(ticket.journeyDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>

                  {(ticket.repTime || ticket.depTime) && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        {ticket.repTime && <p className="text-sm">Reporting: {ticket.repTime}</p>}
                        {ticket.depTime && <p className="text-sm font-semibold">Departure: {ticket.depTime}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">No. of Tourists</p>
                    <p className="font-semibold text-lg">{ticket.noOfTourist}</p>
                  </div>

                  {ticket.seatNo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Seat No.</p>
                      <p className="font-semibold">{ticket.seatNo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {(ticket.travelsName || ticket.busName || ticket.busNo || ticket.branch) && (
                <div className="mt-6 pt-6 border-t grid gap-4 sm:grid-cols-4">
                  {ticket.travelsName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Travels Name</p>
                      <p className="font-semibold">{ticket.travelsName}</p>
                    </div>
                  )}
                  {ticket.busName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bus Name</p>
                      <p className="font-semibold">{ticket.busName}</p>
                    </div>
                  )}
                  {ticket.busNo && (
                    <div className="flex items-center gap-2">
                      <BusIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bus No.</p>
                        <p className="font-mono">{ticket.busNo}</p>
                      </div>
                    </div>
                  )}
                  {ticket.branch && (
                    <div>
                      <p className="text-sm text-muted-foreground">Branch</p>
                      <p>{ticket.branch}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold">₹{ticket.amount.toLocaleString()}</p>
                </div>

                {ticket.surcharges && ticket.surcharges > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>Base: ₹{baseAmount.toLocaleString()} + Surcharges: ₹{ticket.surcharges.toLocaleString()}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={ticket.collectionStatus === 'Paid' ? 'default' : 'destructive'}
                    className={`mt-1 ${ticket.collectionStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}`}
                  >
                    {ticket.collectionStatus === 'Paid' ? '✓ Paid' : '✗ Unpaid'}
                  </Badge>
                </div>

                {ticket.payment && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid By</p>
                      <p className="font-semibold">{ticket.payment.receivedByName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p>{ticket.payment.paymentMode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount (Collection)</p>
                      <p className="font-semibold">₹{ticket.payment.paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid At</p>
                      <p>{format(new Date(ticket.payment.paidAt), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Dialog */}
        <PaymentDialog
          ticket={ticket}
          open={showPayment}
          onOpenChange={setShowPayment}
          onSubmit={handlePayment}
        />

        {/* Password Dialogs */}
        <PasswordDialog
          open={showEditPassword}
          onOpenChange={setShowEditPassword}
          onSuccess={handleEditConfirmed}
          title="Edit Ticket"
          description="Enter admin password to edit this ticket."
        />

        <PasswordDialog
          open={showDeletePassword}
          onOpenChange={setShowDeletePassword}
          onSuccess={handleDeleteConfirmed}
          title="Delete Ticket"
          description="Enter admin password to delete this ticket."
        />

        {/* Delete Dialog */}
        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ticket {ticket.ticketNo}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
