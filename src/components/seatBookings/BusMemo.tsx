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

    // Online and Return: We don't pay owner anything, we just take 5% commission
    // Just calculate the 5% deduction to show
    const onlineCommission = onlineBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const returnCommission = returnBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const otherCommission = onlineCommission + returnCommission;

    // Luggage: 30% commission, 70% to owner
    const luggageToOwner = luggageBookings.reduce((sum, b) => sum + b.amountToOwner, 0);

    // Subtotal from agent + self (what we owe owner from these)
    const seatsSubtotal = agentNet + selfNet;

    // Deduct the 5% commission (from online/return - just showing the deduction)
    const afterDeduction = seatsSubtotal - otherCommission;

    // Add luggage to owner
    const grandTotalToOwner = afterDeduction + luggageToOwner;

    return (
      <div 
        ref={ref} 
        className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 text-gray-800 min-w-[450px] relative overflow-hidden"
        style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
      >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />

        {/* Watermark */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <img 
            src={watermarkLogo} 
            alt="" 
            className="w-80 h-80 object-contain opacity-10" 
          />
        </div>

        {/* Content */}
        <div className="relative" style={{ zIndex: 1 }}>
          {/* Hindi Blessing at top */}
          <div className="text-center mb-3">
            <p className="text-red-600 font-bold text-lg tracking-wide">
              || श्री गजानन महाराज प्रसन्न ||
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-orange-300">
            <h1 className="text-3xl font-bold text-orange-600 tracking-wider">{companyName}</h1>
            <p className="text-sm text-gray-600 italic mt-1">Makes Your Journey Royal</p>
            
            <div className="flex justify-center gap-8 mt-4">
              <div className="bg-white/70 px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs text-gray-500 block">Date</span>
                <span className="font-semibold text-gray-800">{format(date, 'dd MMM yyyy')}</span>
              </div>
              <div className="bg-white/70 px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs text-gray-500 block">Bus</span>
                <span className="font-semibold text-gray-800">{busName}</span>
              </div>
            </div>
          </div>

          {/* Agent Bookings - Grouped */}
          {agentGroups.length > 0 && (
            <div className="mb-5">
              <h2 className="font-bold text-sm bg-gradient-to-r from-amber-200 to-amber-100 px-3 py-2 rounded-t-lg border-b-2 border-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                AGENT BOOKINGS 
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{agentBookings.length} seats</span>
              </h2>
              <div className="bg-white/60 rounded-b-lg p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-200 text-gray-600">
                      <th className="text-left py-2 font-medium">Destination</th>
                      <th className="text-center font-medium">Rate</th>
                      <th className="text-center font-medium">Seats</th>
                      <th className="text-right font-medium">Amount</th>
                      <th className="text-right text-red-500 font-medium">-15%</th>
                      <th className="text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentGroups.map((g, i) => (
                      <tr key={i} className="border-b border-amber-100 hover:bg-amber-50/50">
                        <td className="py-2 font-medium">{g.destination}</td>
                        <td className="text-center text-gray-600">₹{g.rate}</td>
                        <td className="text-center text-gray-600">{g.seats.join(', ')}</td>
                        <td className="text-right">₹{g.totalAmount}</td>
                        <td className="text-right text-red-500">-₹{g.deduction.toFixed(0)}</td>
                        <td className="text-right font-bold text-green-700">₹{g.netAmount.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-amber-100/50">
                      <td colSpan={3} className="py-2 text-amber-800">Agent Total</td>
                      <td className="text-right">₹{agentTotal}</td>
                      <td className="text-right text-red-500">-₹{agentDeduction.toFixed(0)}</td>
                      <td className="text-right text-green-700">₹{agentNet.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Self Bookings - Grouped */}
          {selfGroups.length > 0 && (
            <div className="mb-5">
              <h2 className="font-bold text-sm bg-gradient-to-r from-green-200 to-green-100 px-3 py-2 rounded-t-lg border-b-2 border-green-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                SELF BOOKINGS 
                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{selfBookings.length} seats</span>
              </h2>
              <div className="bg-white/60 rounded-b-lg p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-green-200 text-gray-600">
                      <th className="text-left py-2 font-medium">Destination</th>
                      <th className="text-center font-medium">Rate</th>
                      <th className="text-center font-medium">Seats</th>
                      <th className="text-right font-medium">Amount</th>
                      <th className="text-right text-red-500 font-medium">-15%</th>
                      <th className="text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selfGroups.map((g, i) => (
                      <tr key={i} className="border-b border-green-100 hover:bg-green-50/50">
                        <td className="py-2 font-medium">{g.destination}</td>
                        <td className="text-center text-gray-600">₹{g.rate}</td>
                        <td className="text-center text-gray-600">{g.seats.join(', ')}</td>
                        <td className="text-right">₹{g.totalAmount}</td>
                        <td className="text-right text-red-500">-₹{g.deduction.toFixed(0)}</td>
                        <td className="text-right font-bold text-green-700">₹{g.netAmount.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-green-100/50">
                      <td colSpan={3} className="py-2 text-green-800">Self Total</td>
                      <td className="text-right">₹{selfTotal}</td>
                      <td className="text-right text-red-500">-₹{selfDeduction.toFixed(0)}</td>
                      <td className="text-right text-green-700">₹{selfNet.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <div className="bg-white/70 rounded-lg p-4 shadow-sm border border-orange-200">
            {/* Subtotal from Agent + Self */}
            <div className="flex justify-between text-sm mb-2 pb-2 border-b border-dashed border-gray-300">
              <span className="text-gray-600">Seats Total (After 15% Commission)</span>
              <span className="font-medium">₹{seatsSubtotal.toFixed(0)}</span>
            </div>

            {/* Show 5% deduction if there are online/return bookings */}
            {otherCommission > 0 && (
              <div className="flex justify-between text-sm mb-2 pb-2 border-b border-dashed border-gray-300">
                <span className="text-red-600">Less: Online/Return Commission (5%)</span>
                <span className="text-red-600 font-medium">- ₹{otherCommission.toFixed(0)}</span>
              </div>
            )}

            {/* Seats subtotal after deduction */}
            <div className="flex justify-between text-base font-semibold mb-2 pb-2 border-b border-dashed border-gray-300">
              <span>SEATS SUBTOTAL</span>
              <span className="text-orange-600">₹{afterDeduction.toFixed(0)}</span>
            </div>

            {/* Luggage */}
            {luggageToOwner > 0 && (
              <div className="flex justify-between text-sm mb-2 pb-2 border-b border-dashed border-gray-300">
                <span className="text-blue-600">+ Luggage (70% to Owner)</span>
                <span className="text-blue-600 font-medium">+ ₹{luggageToOwner.toFixed(0)}</span>
              </div>
            )}

            {/* Final Pay to Owner */}
            <div className="flex justify-between items-center text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg mt-3 shadow-md">
              <span>TOTAL PAYABLE</span>
              <span className="text-2xl">₹{grandTotalToOwner.toFixed(0)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6 pt-3 border-t border-orange-200">
            <p className="font-medium text-orange-600">Thank You for Your Business!</p>
            <p className="mt-1">Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
