import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Printer, CreditCard, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TicketWithPayment } from '@/types/ticket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PasswordDialog } from '@/components/shared/PasswordDialog';
import { toast } from 'sonner';

interface TicketTableProps {
  tickets: TicketWithPayment[];
  onRefresh: () => void;
  onMarkPaid: (ticket: TicketWithPayment) => void;
  onDeleteTicket: (id: string) => Promise<void>;
}

export function TicketTable({ tickets, onRefresh, onMarkPaid, onDeleteTicket }: TicketTableProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      try {
        await onDeleteTicket(deleteId);
        toast.success('Ticket deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete ticket');
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleEditPassword = (ticketId: string) => {
    setEditId(ticketId);
  };

  const handleDeletePassword = (ticketId: string) => {
    setPendingDeleteId(ticketId);
  };

  const handleEditConfirmed = () => {
    if (editId) {
      navigate(`/edit-ticket/${editId}`);
      setEditId(null);
    }
  };

  const handleDeleteConfirmed = () => {
    if (pendingDeleteId) {
      setDeleteId(pendingDeleteId);
      setPendingDeleteId(null);
      setShowDeleteConfirm(true);
    }
  };

  const handlePrint = (ticketId: string) => {
    navigate(`/ticket/${ticketId}/print`);
  };

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No tickets found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first ticket to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Ticket No</TableHead>
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Journey Date</TableHead>
              <TableHead className="font-semibold">Tours To</TableHead>
              <TableHead className="font-semibold">Passenger</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold text-center">Tourists</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold">Received By</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const baseAmount = ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount;
              return (
                <TableRow key={ticket.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium text-primary">
                    {ticket.ticketNo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(ticket.bookingDateTime), 'hh:mm a')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(ticket.journeyDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={ticket.toursTo}>
                    {ticket.toursTo}
                  </TableCell>
                  <TableCell className="font-medium">{ticket.passengerName}</TableCell>
                  <TableCell className="text-muted-foreground">{ticket.passengerPhone}</TableCell>
                  <TableCell className="text-center">{ticket.noOfTourist}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{baseAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={ticket.collectionStatus === 'Paid' ? 'default' : 'destructive'}
                      className={ticket.collectionStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}
                    >
                      {ticket.collectionStatus === 'Paid' ? '✓ Paid' : '✗ Unpaid'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.payment?.receivedByName || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/ticket/${ticket.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(ticket.id)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print Ticket
                        </DropdownMenuItem>
                        {ticket.collectionStatus === 'Unpaid' && (
                          <DropdownMenuItem onClick={() => onMarkPaid(ticket)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEditPassword(ticket.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Ticket
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePassword(ticket.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Password Dialog for Edit */}
      <PasswordDialog
        open={!!editId}
        onOpenChange={() => setEditId(null)}
        onSuccess={handleEditConfirmed}
        title="Edit Ticket"
        description="Enter admin password to edit this ticket."
      />

      {/* Password Dialog for Delete */}
      <PasswordDialog
        open={!!pendingDeleteId}
        onOpenChange={() => setPendingDeleteId(null)}
        onSuccess={handleDeleteConfirmed}
        title="Delete Ticket"
        description="Enter admin password to delete this ticket."
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
