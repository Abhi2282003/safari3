import { forwardRef } from 'react';
import { format } from 'date-fns';
import { TicketWithPayment, CompanySettings } from '@/types/ticket';
import companyLogo from '@/assets/company-logo.png';

interface PrintTicketProps {
  ticket: TicketWithPayment;
  settings: CompanySettings;
}

export const PrintTicket = forwardRef<HTMLDivElement, PrintTicketProps>(
  ({ ticket, settings }, ref) => {
    const ticketNumber = ticket.ticketNo.split('-').pop() || ticket.ticketNo;
    
    // Use settings dimensions or defaults
    const ticketWidth = settings.ticketWidth || 280;
    const ticketHeight = settings.ticketHeight || 140;

    return (
      <div 
        ref={ref} 
        className="ticket-print bg-white text-black print:p-0" 
        style={{ 
          width: `${ticketWidth}mm`, 
          minHeight: `${ticketHeight}mm`,
          fontFamily: 'Arial, sans-serif',
          padding: '6mm'
        }}
      >
        <div className="flex gap-3" style={{ minHeight: `${ticketHeight - 12}mm` }}>
          {/* Main Ticket - Left Side */}
          <div 
            className="flex-1 relative overflow-hidden"
            style={{ 
              border: '2px solid #0f172a',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            {/* Premium Header with Large Logo */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                borderRadius: '14px 14px 0 0',
                padding: '5mm',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Full Logo Box */}
                <div
                  style={{
                    height: '48mm',
                    width: '48mm',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '2mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Company logo"
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Company Info */}
                <div className="flex-1 text-white">
                  <h1
                    className="font-bold tracking-wide uppercase"
                    style={{
                      fontSize: '22px',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      lineHeight: 1.2,
                      letterSpacing: '1px',
                    }}
                  >
                    {settings.name}
                  </h1>
                  <div 
                    className="mt-2 inline-block px-3 py-1 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 2px 10px rgba(16,185,129,0.4)',
                    }}
                  >
                    <span className="font-semibold text-white" style={{ fontSize: '12px' }}>
                      📞 {settings.phone}
                    </span>
                  </div>
                </div>

                {/* Ticket Number Badge */}
                <div 
                  className="text-center"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    boxShadow: '0 4px 15px rgba(220,38,38,0.5)',
                    minWidth: '70px',
                  }}
                >
                  <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Ticket</div>
                  <div className="text-white font-bold text-xl">{ticketNumber}</div>
                </div>
              </div>
            </div>

            {/* Ticket Content */}
            <div className="px-5 py-4">
              {/* Passenger Row */}
              <div 
                className="mb-4 p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  border: '1px solid #cbd5e1',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium text-sm whitespace-nowrap">Shri/Smt.</span>
                  <span 
                    className="flex-1 font-bold text-xl text-gray-900"
                    style={{ letterSpacing: '0.5px' }}
                  >
                    {ticket.passengerName}
                  </span>
                  {ticket.withFamily && (
                    <span 
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: '#dbeafe', color: '#1e40af' }}
                    >
                      + Family/Friends
                    </span>
                  )}
                </div>
              </div>

              {/* Journey Details Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div 
                  className="col-span-2 p-3 rounded-xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                  }}
                >
                  <div className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Tours To</div>
                  <div className="text-white font-bold text-lg">{ticket.toursTo}</div>
                </div>
                <div 
                  className="p-3 rounded-xl text-center border-2"
                  style={{ borderColor: '#0f172a', background: '#f8fafc' }}
                >
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Journey Date</div>
                  <div className="text-gray-900 font-bold text-sm">{format(new Date(ticket.journeyDate), 'dd/MM/yyyy')}</div>
                </div>
                <div 
                  className="p-3 rounded-xl text-center border-2"
                  style={{ borderColor: '#0f172a', background: '#f8fafc' }}
                >
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Tourists</div>
                  <div className="text-gray-900 font-bold text-xl">{ticket.noOfTourist}</div>
                </div>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
                <div className="p-2 rounded-lg bg-gray-50 border">
                  <div className="text-gray-500 text-xs">Phone</div>
                  <div className="font-semibold text-gray-800">{ticket.passengerPhone}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border">
                  <div className="text-gray-500 text-xs">Seat No.</div>
                  <div className="font-semibold text-gray-800">{ticket.seatNo || '—'}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border">
                  <div className="text-gray-500 text-xs">Rep. Time</div>
                  <div className="font-semibold text-gray-800">{ticket.repTime || '—'}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border">
                  <div className="text-gray-500 text-xs">Dep. Time</div>
                  <div className="font-semibold text-gray-800">{ticket.depTime || '—'}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border">
                  <div className="text-gray-500 text-xs">Booking</div>
                  <div className="font-semibold text-gray-800">{format(new Date(ticket.bookingDateTime), 'dd/MM/yy')}</div>
                </div>
              </div>

              {/* Travel Details Row */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                {ticket.travelsName && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-amber-700 text-xs font-medium">Travels</div>
                    <div className="font-bold text-amber-900 truncate">{ticket.travelsName}</div>
                  </div>
                )}
                {ticket.busName && (
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-purple-700 text-xs font-medium">Bus Name</div>
                    <div className="font-bold text-purple-900 truncate">{ticket.busName}</div>
                  </div>
                )}
                {ticket.busNo && (
                  <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
                    <div className="text-cyan-700 text-xs font-medium">Bus No.</div>
                    <div className="font-bold text-cyan-900">{ticket.busNo}</div>
                  </div>
                )}
                {ticket.bookedBy && (
                  <div className="p-2 rounded-lg bg-pink-50 border border-pink-200">
                    <div className="text-pink-700 text-xs font-medium">Booked By</div>
                    <div className="font-bold text-pink-900 truncate">{ticket.bookedBy}</div>
                  </div>
                )}
              </div>

              {/* Amount Box */}
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-green-100 text-xs">Base Amount</div>
                    <div className="font-semibold text-lg">₹{(ticket.surcharges ? ticket.amount - ticket.surcharges : ticket.amount).toLocaleString()}</div>
                  </div>
                  {ticket.surcharges && ticket.surcharges > 0 && (
                    <div className="text-white text-center">
                      <div className="text-green-100 text-xs">Surcharges</div>
                      <div className="font-semibold text-lg">₹{ticket.surcharges.toLocaleString()}</div>
                    </div>
                  )}
                  <div className="text-white text-right">
                    <div className="text-green-100 text-xs">Total</div>
                    <div className="font-bold text-2xl">₹{ticket.amount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted Divider with scissors */}
          <div className="w-6 relative flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-gray-400"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-400">✂</div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-200 rounded-full border-2 border-gray-300"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-200 rounded-full border-2 border-gray-300"></div>
          </div>

          {/* Boarding Pass - Right Side */}
          <div 
            className="flex-shrink-0 overflow-hidden flex flex-col"
            style={{ 
              width: '90mm',
              border: '2px solid #0f172a',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            {/* Header with Logo */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '4mm',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    height: '32mm',
                    width: '32mm',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '1mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}
                >
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Company logo"
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white text-sm uppercase tracking-wide">
                    {settings.name}
                  </h2>
                  <p className="text-green-400 text-xs font-semibold mt-1">📞 {settings.phone}</p>
                </div>
              </div>
            </div>

            {/* Boarding Pass Title */}
            <div 
              className="text-center py-2 text-white font-bold tracking-widest"
              style={{ 
                background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
                fontSize: '14px',
              }}
            >
              ✈ BOARDING PASS ✈
            </div>

            {/* Boarding Pass Content */}
            <div className="px-4 py-3 flex-1 flex flex-col justify-between text-sm">
              <div className="space-y-2">
                <div className="flex items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 w-16 text-xs">T.No.:</span>
                  <span className="font-bold text-lg text-gray-900">{ticketNumber}</span>
                </div>

                <div className="flex items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 w-16 text-xs">Name:</span>
                  <span className="font-bold text-gray-900 truncate">{ticket.passengerName}</span>
                </div>

                <div className="flex items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 w-16 text-xs">Tours To:</span>
                  <span className="font-bold text-blue-700">{ticket.toursTo}</span>
                </div>

                <div className="flex gap-4 border-b border-gray-200 pb-2">
                  <div className="flex items-center flex-1">
                    <span className="text-gray-500 text-xs">Seat:</span>
                    <span className="font-bold ml-2">{ticket.seatNo || '—'}</span>
                  </div>
                  <div className="flex items-center flex-1">
                    <span className="text-gray-500 text-xs">Date:</span>
                    <span className="font-bold ml-2">{format(new Date(ticket.journeyDate), 'dd/MM/yy')}</span>
                  </div>
                </div>

                <div className="flex gap-4 border-b border-gray-200 pb-2">
                  <div className="flex items-center flex-1">
                    <span className="text-gray-500 text-xs">Rep:</span>
                    <span className="font-bold ml-2">{ticket.repTime || '—'}</span>
                  </div>
                  <div className="flex items-center flex-1">
                    <span className="text-gray-500 text-xs">Dep:</span>
                    <span className="font-bold ml-2">{ticket.depTime || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Amount Box */}
              <div className="mt-3">
                <div 
                  className="flex items-center justify-center gap-3 p-3 rounded-xl"
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                  }}
                >
                  <span className="text-white font-bold text-2xl">₹{ticket.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div 
                className="mt-3 text-center rounded-lg p-2"
                style={{ 
                  background: 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)',
                  border: '1px solid #f59e0b'
                }}
              >
                <p className="text-[9px] text-amber-800">
                  यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।
                </p>
                <p 
                  className="text-sm font-bold mt-1"
                  style={{ color: '#dc2626' }}
                >
                  🎉 {settings.footerNote || 'Wish you a Happy Journey!'} 🎉
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintTicket.displayName = 'PrintTicket';