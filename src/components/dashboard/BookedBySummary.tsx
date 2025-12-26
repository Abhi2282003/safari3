import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface Ticket {
  bookedBy?: string | null;
  amount: number;
  paymentMode?: string | null;
}

interface BookedBySummaryProps {
  tickets: Ticket[];
}

export function BookedBySummary({ tickets }: BookedBySummaryProps) {
  const bookedBySummary = useMemo(() => {
    const summary = new Map<string, { 
      count: number; 
      amount: number;
      paymentModes: { cash: number; upi: number; card: number; other: number };
    }>();

    tickets.forEach((ticket) => {
      const booker = ticket.bookedBy || 'Unknown';
      if (!summary.has(booker)) {
        summary.set(booker, { 
          count: 0, 
          amount: 0,
          paymentModes: { cash: 0, upi: 0, card: 0, other: 0 }
        });
      }

      const data = summary.get(booker)!;
      data.count += 1;
      data.amount += ticket.amount;
      
      const mode = (ticket.paymentMode || 'other').toLowerCase();
      if (mode === 'cash') data.paymentModes.cash += 1;
      else if (mode === 'upi') data.paymentModes.upi += 1;
      else if (mode === 'card') data.paymentModes.card += 1;
      else data.paymentModes.other += 1;
    });

    return Array.from(summary.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  if (bookedBySummary.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Booked By Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookedBySummary.map((booker) => (
            <div 
              key={booker.name} 
              className="flex flex-col p-3 rounded-md bg-muted/50 border"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground truncate">{booker.name}</p>
                <Badge variant="secondary" className="shrink-0">
                  {booker.count} ticket{booker.count !== 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-primary mb-1">
                ₹{booker.amount.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                {booker.paymentModes.cash > 0 && (
                  <span className="px-1.5 py-0.5 bg-green-500/10 rounded">Cash: {booker.paymentModes.cash}</span>
                )}
                {booker.paymentModes.upi > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 rounded">UPI: {booker.paymentModes.upi}</span>
                )}
                {booker.paymentModes.card > 0 && (
                  <span className="px-1.5 py-0.5 bg-purple-500/10 rounded">Card: {booker.paymentModes.card}</span>
                )}
                {booker.paymentModes.other > 0 && (
                  <span className="px-1.5 py-0.5 bg-gray-500/10 rounded">Other: {booker.paymentModes.other}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
