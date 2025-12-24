import { Layout } from '@/components/layout/Layout';
import { TicketForm } from '@/components/ticket/TicketForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NewTicket() {
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
          <h1 className="text-2xl font-bold text-foreground">New Ticket</h1>
          <p className="text-muted-foreground mt-1">
            Create a new bus ticket booking
          </p>
        </div>

        {/* Form */}
        <TicketForm mode="create" />
      </div>
    </Layout>
  );
}
