import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { TicketForm } from '@/components/ticket/TicketForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function EditTicket() {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/ticket/${id}`}>
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Ticket
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Edit Ticket</h1>
          <p className="text-muted-foreground mt-1">
            Update ticket details
          </p>
        </div>

        {/* Form */}
        <TicketForm mode="edit" ticketId={id} />
      </div>
    </Layout>
  );
}
