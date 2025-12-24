import { forwardRef } from 'react';
import { format } from 'date-fns';
import { SeatBooking } from '@/hooks/useSeatBookings';
import { LuggageBooking } from '@/hooks/useLuggageBookings';

interface BusMemoProps {
  date: Date;
  busName: string;
  seatBookings: SeatBooking[];
  luggageBookings: LuggageBooking[];
}

export const BusMemo = forwardRef<HTMLDivElement, BusMemoProps>(
  ({ date, busName, seatBookings, luggageBookings }, ref) => {
    // Calculate seat booking breakdowns
    const onlineBookings = seatBookings.filter((b) => b.bookingType === 'online');
    const agentBookings = seatBookings.filter((b) => b.bookingType === 'agent');
    const selfBookings = seatBookings.filter((b) => b.bookingType === 'self');

    const totalSeatAmount = seatBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const onlineTotal = onlineBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const agentTotal = agentBookings.reduce((sum, b) => sum + b.bookingAmount, 0);
    const selfTotal = selfBookings.reduce((sum, b) => sum + b.bookingAmount, 0);

    // Deductions (our commission from online + agent booking)
    const onlineCommission = onlineBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const agentCommission = agentBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const selfCommission = selfBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const totalSeatCommission = onlineCommission + agentCommission + selfCommission;

    // Luggage calculations
    const totalLuggageAmount = luggageBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const luggageCommission = luggageBookings.reduce((sum, b) => sum + b.ourEarning, 0);
    const luggageToOwner = luggageBookings.reduce((sum, b) => sum + b.amountToOwner, 0);

    // Final calculations
    const grandTotal = totalSeatAmount + totalLuggageAmount;
    const totalDeduction = totalSeatCommission + luggageCommission;
    const payToOwner = grandTotal - totalDeduction;

    return (
      <div ref={ref} className="p-6 bg-white text-black min-w-[400px] font-mono text-sm">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">BUS SETTLEMENT MEMO</h1>
          <p className="text-gray-600">{format(date, 'EEEE, dd MMMM yyyy')}</p>
          <p className="font-semibold mt-1">Bus: {busName}</p>
        </div>

        <hr className="border-black border-dashed my-3" />

        {/* Seat Bookings Summary */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">SEAT BOOKINGS ({seatBookings.length} seats)</h2>
          
          <div className="space-y-1 pl-2">
            <div className="flex justify-between">
              <span>Online ({onlineBookings.length})</span>
              <span>₹{onlineTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Agent ({agentBookings.length})</span>
              <span>₹{agentTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Self ({selfBookings.length})</span>
              <span>₹{selfTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-gray-300 pt-1">
              <span>Seat Total</span>
              <span>₹{totalSeatAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Luggage Bookings */}
        {luggageBookings.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold mb-2">LUGGAGE BOOKINGS ({luggageBookings.length} items)</h2>
            <div className="space-y-1 pl-2">
              {luggageBookings.map((l, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{l.destination} (x{l.quantity})</span>
                  <span>₹{l.totalAmount.toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold border-t border-gray-300 pt-1">
                <span>Luggage Total</span>
                <span>₹{totalLuggageAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        <hr className="border-black border-dashed my-3" />

        {/* Grand Total */}
        <div className="flex justify-between text-lg font-bold">
          <span>GRAND TOTAL</span>
          <span>₹{grandTotal.toFixed(0)}</span>
        </div>

        <hr className="border-black border-dashed my-3" />

        {/* Deductions */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">DEDUCTIONS (Our Commission)</h2>
          <div className="space-y-1 pl-2 text-red-600">
            {onlineCommission > 0 && (
              <div className="flex justify-between">
                <span>Online Commission</span>
                <span>- ₹{onlineCommission.toFixed(0)}</span>
              </div>
            )}
            {agentCommission > 0 && (
              <div className="flex justify-between">
                <span>Agent Commission</span>
                <span>- ₹{agentCommission.toFixed(0)}</span>
              </div>
            )}
            {selfCommission > 0 && (
              <div className="flex justify-between">
                <span>Self Commission</span>
                <span>- ₹{selfCommission.toFixed(0)}</span>
              </div>
            )}
            {luggageCommission > 0 && (
              <div className="flex justify-between">
                <span>Luggage (30%)</span>
                <span>- ₹{luggageCommission.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-gray-300 pt-1">
              <span>Total Deduction</span>
              <span>- ₹{totalDeduction.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <hr className="border-black border-double my-3" />

        {/* Pay to Owner */}
        <div className="flex justify-between text-xl font-bold text-green-700">
          <span>PAY TO OWNER</span>
          <span>₹{payToOwner.toFixed(0)}</span>
        </div>

        <hr className="border-black border-dashed my-3" />

        <div className="text-center text-xs text-gray-500 mt-4">
          Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}
        </div>
      </div>
    );
  }
);

BusMemo.displayName = 'BusMemo';
