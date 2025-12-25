import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { SeatBooking } from '@/hooks/useSeatBookings';
import { LuggageBooking } from '@/hooks/useLuggageBookings';
import watermarkLogo from '@/assets/royal-safari-watermark.png';

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
        className="p-6 bg-white text-gray-800 min-w-[420px] max-w-[500px] relative border border-gray-200"
        style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
      >
        {/* Watermark */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <img 
            src={watermarkLogo} 
            alt="" 
            className="w-64 h-64 object-contain opacity-[0.08]" 
          />
        </div>

        {/* Content */}
        <div className="relative" style={{ zIndex: 1 }}>
          {/* Hindi Blessing at top */}
          <div className="text-center mb-2">
            <p className="text-red-600 font-bold text-base">
              || श्री गजानन महाराज प्रसन्न ||
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-orange-400">
            <h1 className="text-2xl font-bold text-orange-600 tracking-wide">{companyName}</h1>
            {companyAddress && (
              <p className="text-xs text-gray-600 mt-1">{companyAddress}</p>
            )}
            
            <div className="flex justify-center gap-6 mt-3 text-sm">
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Date</span>
                <span className="font-semibold">{format(date, 'dd/MM/yyyy')}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Bus</span>
                <span className="font-semibold">{busName}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Total Seats</span>
                <span className="font-semibold">{mainBookings.length}</span>
              </div>
            </div>
          </div>

          {/* Combined Bookings */}
          {mainGroups.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold text-sm bg-orange-100 px-3 py-1.5 border-l-4 border-orange-500 mb-2">
                BOOKINGS
              </h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-600">
                    <th className="text-left py-1.5 font-semibold">Destination</th>
                    <th className="text-center font-semibold">Rate</th>
                    <th className="text-center font-semibold">Seats</th>
                    <th className="text-right font-semibold">Amount</th>
                    <th className="text-right text-red-600 font-semibold">-15%</th>
                    <th className="text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {mainGroups.map((g, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 font-medium">{g.destination}</td>
                      <td className="text-center text-gray-600">₹{g.rate}</td>
                      <td className="text-center text-gray-600 text-[10px]">{g.seats.join(', ')}</td>
                      <td className="text-right">₹{g.totalAmount}</td>
                      <td className="text-right text-red-500">-₹{g.deduction.toFixed(0)}</td>
                      <td className="text-right font-semibold">₹{g.netAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={3} className="py-1.5">Total</td>
                    <td className="text-right">₹{mainTotal}</td>
                    <td className="text-right text-red-500">-₹{mainDeduction.toFixed(0)}</td>
                    <td className="text-right">₹{mainNet.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Section */}
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="flex justify-between mb-1.5 pb-1.5 border-b border-dashed border-gray-300">
              <span className="text-gray-600">Seats Subtotal</span>
              <span className="font-medium">₹{seatsSubtotal.toFixed(0)}</span>
            </div>

            {otherCommission > 0 && (
              <div className="flex justify-between mb-1.5 pb-1.5 border-b border-dashed border-gray-300">
                <span className="text-red-600">Less (5%)</span>
                <span className="text-red-600 font-medium">- ₹{otherCommission.toFixed(0)}</span>
              </div>
            )}

            {luggageToOwner > 0 && (
              <div className="flex justify-between mb-1.5 pb-1.5 border-b border-dashed border-gray-300">
                <span className="text-gray-600">+ Luggage</span>
                <span className="font-medium">+ ₹{luggageToOwner.toFixed(0)}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="flex justify-between items-center font-bold bg-green-600 text-white px-3 py-2 rounded mt-2 -mx-1">
              <span>TOTAL PAYABLE</span>
              <span className="text-lg">₹{grandTotalToOwner.toFixed(0)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-200">
            Generated: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}
          </div>
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
