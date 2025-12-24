import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment, CompanySettings } from "@/types/ticket";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/royal-safari-logo.png";

interface PrintTicketProps {
  ticket: TicketWithPayment;
  settings: CompanySettings;
}

export const PrintTicket = forwardRef<HTMLDivElement, PrintTicketProps>(
  ({ ticket, settings }, ref) => {
    const ticketNumberShort = ticket.ticketNo.split("-").pop() || ticket.ticketNo;

    // Fixed ticket size: 25.5cm × 10.5cm
    const ticketWidth = 255; // mm
    const ticketHeight = 105; // mm

    const companyPhone = settings.phone?.trim();
    const companyAddress = settings.address?.trim();

    const baseAmount = ticket.surcharges
      ? ticket.amount - ticket.surcharges
      : ticket.amount;

    return (
      <div
        ref={ref}
        className={cn(
          "ticket-print",
          "bg-white text-black",
          "font-sans",
          "print:p-0"
        )}
        style={{
          width: `${ticketWidth}mm`,
          height: `${ticketHeight}mm`,
          padding: "2mm",
        }}
      >
        <div className="flex gap-2 h-full">
          {/* Main Ticket */}
          <section 
            className="flex-1 overflow-hidden border-2 border-gray-800 relative flex flex-col"
            style={{ borderRadius: "3mm" }}
          >
            {/* Watermark Logo - Lower position */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ paddingTop: "15mm" }}
            >
              <img
                src={settings.logoUrl || companyLogo}
                alt=""
                className="opacity-20"
                style={{ width: "60mm", height: "60mm", objectFit: "contain" }}
              />
            </div>

            {/* Header - Logo in corner, company info centered */}
            <header className="bg-gray-900 text-white relative z-10 py-2 px-3">
              <div className="flex items-center gap-3">
                {/* Logo - Corner - Bigger */}
                <div 
                  className="shrink-0 bg-white p-1.5 shadow"
                  style={{ width: "22mm", height: "22mm", borderRadius: "2mm" }}
                >
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Company Info - Center - Bold */}
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black uppercase tracking-wide leading-none">
                    {settings.name}
                  </h1>
                  {companyAddress && (
                    <p className="text-sm font-bold leading-tight mt-1">{companyAddress}</p>
                  )}
                  {companyPhone && (
                    <p className="text-base font-black mt-0.5">Ph: {companyPhone}</p>
                  )}
                </div>

                {/* Ticket Number */}
                <div 
                  className="shrink-0 bg-yellow-400 text-black px-3 py-1.5 text-center shadow"
                  style={{ borderRadius: "2mm" }}
                >
                  <div className="text-xs font-black uppercase">Ticket</div>
                  <div className="text-xl font-black">{ticketNumberShort}</div>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="p-3 relative z-10 flex-1 flex flex-col text-sm">
              <div className="flex gap-3 flex-1">
                {/* Left: Passenger & Journey */}
                <div className="flex-1 space-y-2">
                  {/* Passenger */}
                  <div className="border border-gray-400 p-2" style={{ borderRadius: "2mm" }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-gray-600 font-bold">PASSENGER: </span>
                        <span className="font-black text-base">{ticket.passengerName}</span>
                        {ticket.withFamily && <span className="text-xs font-bold ml-1">(Family)</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-600 font-bold">Pax: </span>
                        <span className="font-black">{ticket.noOfTourist}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <div>
                        <span className="text-xs text-gray-600 font-bold">Mobile: </span>
                        <span className="font-black font-mono">{ticket.passengerPhone}</span>
                      </div>
                      {ticket.pickup && (
                        <div>
                          <span className="text-xs text-gray-600 font-bold">Pickup: </span>
                          <span className="font-black">{ticket.pickup}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Journey */}
                  <div className="border border-gray-400 p-2" style={{ borderRadius: "2mm" }}>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs text-gray-600 font-bold">TO: </span>
                        <span className="font-black text-base">{ticket.toursTo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-600 font-bold">Journey: </span>
                        <span className="font-black">{format(new Date(ticket.journeyDate), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div>
                        <span className="text-xs text-gray-600 font-bold">Seat: </span>
                        <span className="font-black">{ticket.seatNo || "—"}</span>
                        <span className="mx-2 font-bold">|</span>
                        <span className="text-xs text-gray-600 font-bold">Report: </span>
                        <span className="font-black">{ticket.repTime || "—"}</span>
                        <span className="mx-2 font-bold">|</span>
                        <span className="text-xs text-gray-600 font-bold">Dep: </span>
                        <span className="font-black">{ticket.depTime || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 font-bold">Booked: </span>
                        <span className="font-black">{format(new Date(ticket.bookingDateTime), "dd/MM/yy")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Travels & Bus Details */}
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1 border border-gray-300 px-2 py-1" style={{ borderRadius: "2mm" }}>
                      <span className="text-gray-600 font-bold">Travels: </span>
                      <span className="font-black">{ticket.travelsName || "—"}</span>
                    </div>
                    <div className="flex-1 border border-gray-300 px-2 py-1" style={{ borderRadius: "2mm" }}>
                      <span className="text-gray-600 font-bold">Bus: </span>
                      <span className="font-black">{ticket.busName || "—"}</span>
                      {ticket.busNo && (
                        <span className="font-black ml-1">({ticket.busNo})</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Booked By */}
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1 border border-gray-300 px-2 py-1" style={{ borderRadius: "2mm" }}>
                      <span className="text-gray-600 font-bold">Booked By: </span>
                      <span className="font-black">{ticket.bookedBy || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div 
                  className="w-28 border-2 border-gray-800 bg-gray-100 flex flex-col items-center justify-center text-center"
                  style={{ borderRadius: "2mm" }}
                >
                  <div className="text-xs font-black text-gray-600 uppercase">Total Amount</div>
                  <div className="text-2xl font-black mt-1">₹{ticket.amount.toLocaleString()}</div>
                  <div className="text-xs font-bold text-gray-600 mt-1">
                    Base: ₹{baseAmount.toLocaleString()}
                    {ticket.surcharges && ticket.surcharges > 0 && (
                      <><br/>Sur: ₹{ticket.surcharges.toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 text-center border-t border-gray-300 pt-1">
                <p className="text-xs font-bold text-gray-600">यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।</p>
                <p className="text-sm font-black">{settings.footerNote || "Wish you a Happy Journey!"}</p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-4 shrink-0 flex items-center justify-center">
            <div className="border-l-2 border-dashed border-gray-400 h-full"></div>
          </div>

          {/* Boarding Pass - Larger */}
          <aside 
            className="shrink-0 border-2 border-gray-800 relative flex flex-col overflow-hidden"
            style={{ width: "78mm", borderRadius: "3mm" }}
          >
            {/* Watermark - Lower */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ paddingTop: "12mm" }}
            >
              <img 
                src={settings.logoUrl || companyLogo} 
                alt="" 
                className="opacity-15" 
                style={{ width: "42mm", height: "42mm", objectFit: "contain" }} 
              />
            </div>

            {/* Header with Logo */}
            <header className="bg-gray-900 text-white py-1.5 px-2 relative z-10">
              <div className="flex items-center gap-2">
                {/* Logo */}
                <div 
                  className="shrink-0 bg-white p-0.5"
                  style={{ width: "10mm", height: "10mm", borderRadius: "1mm" }}
                >
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm font-black uppercase">{settings.name}</div>
                  {companyPhone && <div className="text-xs font-bold">Ph: {companyPhone}</div>}
                </div>
              </div>
            </header>

            <div className="bg-yellow-400 text-black text-center py-0.5 text-xs font-black uppercase relative z-10">
              Boarding Pass
            </div>

            <div className="p-2 flex-1 flex flex-col relative z-10 text-xs">
              {/* Ticket Number */}
              <div className="flex justify-between items-center border-b border-gray-300 pb-1 mb-1">
                <span className="text-gray-600 font-bold">Ticket No</span>
                <span className="text-base font-black">{ticketNumberShort}</span>
              </div>

              {/* Passenger */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                <div className="text-gray-600 font-bold">Passenger</div>
                <div className="font-black truncate text-sm">{ticket.passengerName}</div>
                <div className="font-bold">Mobile: {ticket.passengerPhone}</div>
              </div>

              {/* Destination & Journey */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-600 font-bold">To: </span>
                    <span className="font-black">{ticket.toursTo}</span>
                  </div>
                  <span className="font-black">{format(new Date(ticket.journeyDate), "dd/MM/yy")}</span>
                </div>
              </div>

              {/* Pickup */}
              {ticket.pickup && (
                <div className="border-b border-gray-300 pb-1 mb-1">
                  <span className="text-gray-600 font-bold">Pickup: </span>
                  <span className="font-black">{ticket.pickup}</span>
                </div>
              )}

              {/* Bus Details */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                {ticket.travelsName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Travels: </span>
                    <span className="font-black">{ticket.travelsName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-600 font-bold">Bus: </span>
                    <span className="font-black">{ticket.busName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-bold">No: </span>
                    <span className="font-black">{ticket.busNo || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Timing & Seat */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-600 font-bold">Seat: </span>
                    <span className="font-black">{ticket.seatNo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-bold">Pax: </span>
                    <span className="font-black">{ticket.noOfTourist}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-600 font-bold">Report: </span>
                    <span className="font-black">{ticket.repTime || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-bold">Dep: </span>
                    <span className="font-black">{ticket.depTime || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-100 border border-gray-400 text-center py-1 mt-auto" style={{ borderRadius: "2mm" }}>
                <div className="text-gray-600 font-bold">Total</div>
                <div className="text-lg font-black">₹{ticket.amount.toLocaleString()}</div>
              </div>

              {/* Footer */}
              <div className="text-center mt-1">
                <p className="text-xs font-black">{settings.footerNote || "Happy Journey!"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }
);

PrintTicket.displayName = "PrintTicket";