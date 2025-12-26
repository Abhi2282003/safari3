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
    const sonuBookings = seatBookings.filter((b) => b.bookingType === 'sonu');
    const returnBookings = seatBookings.filter((b) => b.bookingType === 'return');

    // Combine agent, self and sonu bookings for display (all have 15% deduction)
    const mainBookings = [...agentBookings, ...selfBookings, ...sonuBookings];

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
        className="bg-amber-50 text-gray-800"
        style={{ 
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 20mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Hindi Blessing at top */}
        <div className="text-center mb-4">
          <p className="text-red-600 font-bold text-xl">
            || श्री गजानन महाराज प्रसन्न ||
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 tracking-wide">{companyName}</h1>
          {companyAddress && (
            <p className="text-sm text-gray-600 mt-1">{companyAddress}</p>
          )}
          
          <div className="flex justify-center gap-20 mt-6">
            <div className="text-center">
              <span className="text-xs text-gray-500 block">Date</span>
              <span className="font-bold text-lg text-gray-800">{format(date, 'dd/MM/yyyy')}</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-500 block">Bus</span>
              <span className="font-bold text-lg text-gray-800">{busName}</span>
            </div>
          </div>
        </div>

        {/* Combined Bookings */}
        {mainGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-base bg-amber-100 px-4 py-2 border-l-4 border-amber-500 mb-4 text-amber-800">
              BOOKINGS
            </h2>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b-2 border-amber-300 text-gray-500">
                  <th className="text-left py-3 font-semibold w-[22%]">Destination</th>
                  <th className="text-center font-semibold w-[13%]">Rate</th>
                  <th className="text-center font-semibold w-[20%]">Seats</th>
                  <th className="text-right font-semibold w-[15%]">Amount</th>
                  <th className="text-right text-red-500 font-semibold w-[15%]">-15%</th>
                  <th className="text-right font-semibold w-[15%]">Net</th>
                </tr>
              </thead>
              <tbody>
                {mainGroups.map((g, i) => (
                  <tr key={i} className="border-b border-amber-200">
                    <td className="py-3 font-semibold text-gray-800">{g.destination}</td>
                    <td className="text-center text-gray-600">₹{g.rate}</td>
                    <td className="text-center text-gray-600 text-xs">{g.seats.join(', ')}</td>
                    <td className="text-right text-gray-800">₹{g.totalAmount}</td>
                    <td className="text-right text-red-500">-₹{g.deduction.toFixed(0)}</td>
                    <td className="text-right font-bold text-gray-800">₹{g.netAmount.toFixed(0)}</td>
                  </tr>
                ))}
                <tr className="bg-amber-100">
                  <td colSpan={3} className="py-3 font-bold text-amber-800">Total</td>
                  <td className="text-right font-bold text-gray-800">₹{mainTotal}</td>
                  <td className="text-right font-bold text-red-500">-₹{mainDeduction.toFixed(0)}</td>
                  <td className="text-right font-bold text-gray-800">₹{mainNet.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-amber-100/60 rounded p-5 text-base">
          <div className="flex justify-between mb-3 pb-3 border-b border-amber-300">
            <span className="text-gray-700">Seats Subtotal</span>
            <span className="font-semibold text-gray-800">₹{seatsSubtotal.toFixed(0)}</span>
          </div>

          {otherCommission > 0 && (
            <div className="flex justify-between mb-3 pb-3 border-b border-amber-300">
              <span className="text-red-600">Less (5%)</span>
              <span className="text-red-600 font-semibold">- ₹{otherCommission.toFixed(0)}</span>
            </div>
          )}

          {luggageToOwner > 0 && (
            <div className="flex justify-between mb-3 pb-3 border-b border-amber-300">
              <span className="text-gray-700">+ Luggage</span>
              <span className="font-semibold text-gray-800">+ ₹{luggageToOwner.toFixed(0)}</span>
            </div>
          )}

          {/* Final Total */}
          <div className="flex justify-between items-center font-bold text-gray-900 px-5 py-4 bg-amber-200 rounded mt-4 border-2 border-amber-400">
            <span className="text-xl">TOTAL PAYABLE</span>
            <span className="text-2xl">₹{grandTotalToOwner.toFixed(0)}</span>
          </div>
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
