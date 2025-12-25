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
  companyAddress?: string;
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
  ({ date, busName, seatBookings, luggageBookings, companyName = 'ROYAL SAFARI', companyAddress = '' }, ref) => {
    // Separate bookings by type
    const onlineBookings = seatBookings.filter((b) => b.bookingType === 'online');
    const agentBookings = seatBookings.filter((b) => b.bookingType === 'agent');
    const selfBookings = seatBookings.filter((b) => b.bookingType === 'self');
    const returnBookings = seatBookings.filter((b) => b.bookingType === 'return');

    // Combine agent and self bookings for display
    const mainBookings = [...agentBookings, ...selfBookings];

    // Group bookings by destination and rate (combined agent + self)
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

    const mainGroups = useMemo(() => groupBookings(mainBookings, 15), [mainBookings]);

    // Calculate totals for agent and self combined
    const mainTotal = mainBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const mainDeduction = mainBookings.reduce((sum, b) => sum + (b.bookingAmount * 0.15), 0);
    const mainNet = mainTotal - mainDeduction;

    // Online and Return: 5% commission deduction
    const onlineCommission = onlineBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const returnCommission = returnBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const otherCommission = onlineCommission + returnCommission;

    // Luggage: 30% commission, 70% to owner
    const luggageToOwner = luggageBookings.reduce((sum, b) => sum + b.amountToOwner, 0);

    // Subtotal from main bookings
    const seatsSubtotal = mainNet;

    // Deduct the 5% commission
    const afterDeduction = seatsSubtotal - otherCommission;

    // Add luggage to owner
    const grandTotalToOwner = afterDeduction + luggageToOwner;

    return (
      <div 
        ref={ref} 
        className="p-8 bg-amber-50/50 text-gray-800 min-h-[700px] flex flex-col"
        style={{ 
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          width: '100%',
          maxWidth: '550px'
        }}
      >
        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Hindi Blessing at top */}
          <div className="text-center mb-3">
            <p className="text-red-600 font-bold text-lg">
              || श्री गजानन महाराज प्रसन्न ||
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-amber-300">
            <h1 className="text-2xl font-bold text-amber-800 tracking-wide">{companyName}</h1>
            {companyAddress && (
              <p className="text-xs text-gray-600 mt-1">{companyAddress}</p>
            )}
            
            <div className="flex justify-center gap-10 mt-4">
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Date</span>
                <span className="font-semibold text-gray-800">{format(date, 'dd/MM/yyyy')}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Bus</span>
                <span className="font-semibold text-gray-800">{busName}</span>
              </div>
            </div>
          </div>

          {/* Combined Bookings */}
          {mainGroups.length > 0 && (
            <div className="mb-6 flex-1">
              <h2 className="font-bold text-sm bg-amber-100 px-3 py-2 border-l-4 border-amber-500 mb-3 text-amber-800">
                BOOKINGS
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-amber-200 text-gray-600">
                    <th className="text-left py-2 font-semibold">Destination</th>
                    <th className="text-center font-semibold">Rate</th>
                    <th className="text-center font-semibold">Seats</th>
                    <th className="text-right font-semibold">Amount</th>
                    <th className="text-right text-red-600 font-semibold">-15%</th>
                    <th className="text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {mainGroups.map((g, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      <td className="py-2 font-medium text-gray-800">{g.destination}</td>
                      <td className="text-center text-gray-600">₹{g.rate}</td>
                      <td className="text-center text-gray-600 text-xs">{g.seats.join(', ')}</td>
                      <td className="text-right text-gray-800">₹{g.totalAmount}</td>
                      <td className="text-right text-red-500">-₹{g.deduction.toFixed(0)}</td>
                      <td className="text-right font-semibold text-gray-800">₹{g.netAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-amber-100/70">
                    <td colSpan={3} className="py-2 text-amber-800">Total</td>
                    <td className="text-right text-gray-800">₹{mainTotal}</td>
                    <td className="text-right text-red-500">-₹{mainDeduction.toFixed(0)}</td>
                    <td className="text-right text-gray-800">₹{mainNet.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Section */}
          <div className="bg-amber-100/50 rounded-lg p-4 text-sm mt-auto">
            <div className="flex justify-between mb-2 pb-2 border-b border-dashed border-amber-300">
              <span className="text-gray-600">Seats Subtotal</span>
              <span className="font-medium text-gray-800">₹{seatsSubtotal.toFixed(0)}</span>
            </div>

            {otherCommission > 0 && (
              <div className="flex justify-between mb-2 pb-2 border-b border-dashed border-amber-300">
                <span className="text-red-600">Less (5%)</span>
                <span className="text-red-600 font-medium">- ₹{otherCommission.toFixed(0)}</span>
              </div>
            )}

            {luggageToOwner > 0 && (
              <div className="flex justify-between mb-2 pb-2 border-b border-dashed border-amber-300">
                <span className="text-gray-600">+ Luggage</span>
                <span className="font-medium text-gray-800">+ ₹{luggageToOwner.toFixed(0)}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="flex justify-between items-center font-bold text-gray-900 px-4 py-3 bg-amber-200/60 rounded-lg mt-3 border-2 border-amber-400">
              <span className="text-lg">TOTAL PAYABLE</span>
              <span className="text-xl">₹{grandTotalToOwner.toFixed(0)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 mt-6 pt-3 border-t border-amber-200">
            Generated: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}
          </div>
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
