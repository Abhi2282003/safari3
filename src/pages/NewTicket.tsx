import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { TicketForm } from '@/components/ticket/TicketForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getNextTicketNumber } from '@/hooks/useTickets';

export default function NewTicket() {
  const { user } = useAuth();
  const [nextTicketNo, setNextTicketNo] = useState<string>('');

  useEffect(() => {
    if (user) {
      getNextTicketNumber(user.id).then(setNextTicketNo);
    }
  }, [user]);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">New Ticket</h1>
              <p className="text-muted-foreground mt-1">
                Create a new bus ticket booking
              </p>
            </div>
            {nextTicketNo && (
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground">Next Ticket Number</p>
                  <p className="text-lg font-bold text-primary ticket-number">{nextTicketNo}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Form */}
        <TicketForm mode="create" />
      </div>
    </Layout>
  );
}
