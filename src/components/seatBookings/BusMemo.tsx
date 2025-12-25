import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { SeatBooking } from '@/hooks/useSeatBookings';
import { LuggageBooking } from '@/hooks/useLuggageBookings';

interface BusMemoProps {
  date: Date;
  busName: string;
  seatBookings: SeatBooking[];
  luggageBookings: LuggageBooking[];
  companyName?: string;
  companyLogo?: string;
}

interface GroupedBooking {
  destination: string;
  rate: number;
  seats: number[];
  count: number;
  totalAmount: number;
  deduction: number;
  netAmount: number;
}

export const BusMemo = forwardRef<HTMLDivElement, BusMemoProps>(
  ({ date, busName, seatBookings, luggageBookings, companyName = 'ROYAL SAFARI', companyLogo }, ref) => {
    // Separate bookings by type
    const onlineBookings = seatBookings.filter((b) => b.bookingType === 'online');
    const agentBookings = seatBookings.filter((b) => b.bookingType === 'agent');
    const selfBookings = seatBookings.filter((b) => b.bookingType === 'self');
    const returnBookings = seatBookings.filter((b) => b.bookingType === 'return');

    // Group agent and self bookings by destination and rate
    const groupBookings = (bookings: SeatBooking[], commissionRate: number): GroupedBooking[] => {
      const groups: Record<string, GroupedBooking> = {};
      
      bookings.forEach((b) => {
        const key = `${b.destination || 'Unknown'}-${b.bookingAmount}`;
        if (!groups[key]) {
          groups[key] = {
            destination: b.destination || 'Unknown',
            rate: b.bookingAmount,
            seats: [],
            count: 0,
            totalAmount: 0,
            deduction: 0,
            netAmount: 0,
          };
        }
        groups[key].seats.push(b.seatNumber);
        groups[key].count += 1;
        groups[key].totalAmount += b.bookingAmount;
        groups[key].deduction += (b.bookingAmount * commissionRate) / 100;
      });

      // Calculate net for each group
      Object.values(groups).forEach((g) => {
        g.netAmount = g.totalAmount - g.deduction;
      });

      return Object.values(groups).sort((a, b) => a.destination.localeCompare(b.destination));
    };

    const agentGroups = useMemo(() => groupBookings(agentBookings, 15), [agentBookings]);
    const selfGroups = useMemo(() => groupBookings(selfBookings, 15), [selfBookings]);

    // Calculate totals for agent and self
    const agentTotal = agentBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const agentDeduction = agentBookings.reduce((sum, b) => sum + (b.bookingAmount * 0.15), 0);
    const agentNet = agentTotal - agentDeduction;

    const selfTotal = selfBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const selfDeduction = selfBookings.reduce((sum, b) => sum + (b.bookingAmount * 0.15), 0);
    const selfNet = selfTotal - selfDeduction;

    // Online: 5% commission - owner gets 95%
    const onlineTotal = onlineBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const onlineCommission = onlineBookings.reduce((sum, b) => sum + b.ourEarning, 0); // 5%
    const onlineNet = onlineTotal - onlineCommission;

    // Return: 5% commission - owner gets NOTHING (company bus)
    const returnTotal = returnBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const returnCommission = returnBookings.reduce((sum, b) => sum + b.ourEarning, 0); // 5%
    // Return net to owner is 0

    // Luggage: 30% commission, 70% to owner
    const luggageTotal = luggageBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const luggageToOwner = luggageBookings.reduce((sum, b) => sum + b.amountToOwner, 0);

    // Total deductions to show (online commission + full return amount since nothing goes to owner)
    const otherDeductions = onlineCommission + returnTotal;

    // Subtotal from agent + self
    const agentSelfSubtotal = agentNet + selfNet;

    // Add online net (what owner gets from online)
    const seatsSubtotal = agentSelfSubtotal + onlineNet;

    // Grand total to pay owner (return adds nothing)
    const grandTotalToOwner = seatsSubtotal + luggageToOwner;

    return (
      <div ref={ref} className="p-6 bg-white text-black min-w-[400px] font-mono text-sm relative">
        {/* Watermark */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
          style={{ zIndex: 0 }}
        >
          {companyLogo ? (
            <img src={companyLogo} alt="" className="w-64 h-64 object-contain" />
          ) : (
            <div className="text-8xl font-bold text-gray-400 rotate-[-30deg]">
              {companyName}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative" style={{ zIndex: 1 }}>
          {/* Header */}
          <div className="text-center mb-4 border-b-2 border-black pb-3">
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="text-lg font-semibold mt-1">BUS SETTLEMENT MEMO</p>
            <div className="flex justify-center gap-8 mt-2 text-sm">
              <span><strong>Date:</strong> {format(date, 'dd/MM/yyyy')}</span>
              <span><strong>Bus:</strong> {busName}</span>
            </div>
          </div>

          {/* Agent Bookings - Grouped */}
          {agentGroups.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold text-sm bg-amber-100 px-2 py-1 mb-2">AGENT BOOKINGS ({agentBookings.length} seats)</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Destination</th>
                    <th className="text-center">Rate</th>
                    <th className="text-center">Seats</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right text-red-600">-15%</th>
                    <th className="text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {agentGroups.map((g, i) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-1">{g.destination}</td>
                      <td className="text-center">₹{g.rate}</td>
                      <td className="text-center">{g.seats.join(', ')}</td>
                      <td className="text-right">₹{g.totalAmount}</td>
                      <td className="text-right text-red-600">-₹{g.deduction.toFixed(0)}</td>
                      <td className="text-right font-semibold">₹{g.netAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-black">
                    <td colSpan={3} className="py-1">Agent Total</td>
                    <td className="text-right">₹{agentTotal}</td>
                    <td className="text-right text-red-600">-₹{agentDeduction.toFixed(0)}</td>
                    <td className="text-right">₹{agentNet.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Self Bookings - Grouped */}
          {selfGroups.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold text-sm bg-green-100 px-2 py-1 mb-2">SELF BOOKINGS ({selfBookings.length} seats)</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Destination</th>
                    <th className="text-center">Rate</th>
                    <th className="text-center">Seats</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right text-red-600">-15%</th>
                    <th className="text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {selfGroups.map((g, i) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-1">{g.destination}</td>
                      <td className="text-center">₹{g.rate}</td>
                      <td className="text-center">{g.seats.join(', ')}</td>
                      <td className="text-right">₹{g.totalAmount}</td>
                      <td className="text-right text-red-600">-₹{g.deduction.toFixed(0)}</td>
                      <td className="text-right font-semibold">₹{g.netAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-black">
                    <td colSpan={3} className="py-1">Self Total</td>
                    <td className="text-right">₹{selfTotal}</td>
                    <td className="text-right text-red-600">-₹{selfDeduction.toFixed(0)}</td>
                    <td className="text-right">₹{selfNet.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <hr className="border-black my-3" />

          {/* Subtotal from Agent + Self */}
          <div className="flex justify-between text-sm mb-2">
            <span>Agent + Self Net</span>
            <span>₹{agentSelfSubtotal.toFixed(0)}</span>
          </div>

          {/* Online net (add to total - don't show separately, just the net amount) */}
          {onlineBookings.length > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span>+ Online ({onlineBookings.length} seats, after 5% deduction)</span>
              <span>+ ₹{onlineNet.toFixed(0)}</span>
            </div>
          )}

          {/* Return deduction (full amount since nothing goes to owner) */}
          {returnBookings.length > 0 && (
            <div className="flex justify-between text-sm text-red-600 mb-2">
              <span>- Return ({returnBookings.length} seats, Company Bus)</span>
              <span>- ₹{returnTotal.toFixed(0)}</span>
            </div>
          )}

          <hr className="border-black my-3" />

          {/* Seats Subtotal */}
          <div className="flex justify-between text-base font-semibold mb-3">
            <span>SEATS SUBTOTAL</span>
            <span>₹{seatsSubtotal.toFixed(0)}</span>
          </div>

          {/* Luggage */}
          {luggageBookings.length > 0 && (
            <>
              <div className="flex justify-between text-sm mb-2 bg-gray-100 px-2 py-1">
                <span>Luggage ({luggageBookings.length} items, after 30%)</span>
                <span>+ ₹{luggageToOwner.toFixed(0)}</span>
              </div>
            </>
          )}

          <hr className="border-black border-double my-3" />

          {/* Final Pay to Owner */}
          <div className="flex justify-between text-xl font-bold bg-green-200 px-3 py-2 rounded">
            <span>PAY TO OWNER</span>
            <span>₹{grandTotalToOwner.toFixed(0)}</span>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4 pt-2 border-t">
            Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}
          </div>
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
