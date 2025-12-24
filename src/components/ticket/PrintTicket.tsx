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
            {/* Watermark Logo - Visible */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img
                src={settings.logoUrl || companyLogo}
                alt=""
                className="opacity-20"
                style={{ width: "60mm", height: "60mm", objectFit: "contain" }}
              />
            </div>

            {/* Header - Centered Company Info */}
            <header className="bg-gray-900 text-white relative z-10 py-2 px-3">
              <div className="flex items-center justify-center gap-4">
                {/* Logo */}
                <div 
                  className="shrink-0 bg-white p-1 shadow"
                  style={{ width: "18mm", height: "18mm", borderRadius: "2mm" }}
                >
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Company Info - Center */}
                <div className="text-center">
                  <h1 className="text-2xl font-black uppercase tracking-wide leading-none">
                    {settings.name}
                  </h1>
                  {companyAddress && (
                    <p className="text-sm font-medium leading-tight mt-1">{companyAddress}</p>
                  )}
                  {companyPhone && (
                    <p className="text-base font-bold mt-0.5">📞 {companyPhone}</p>
                  )}
                </div>

                {/* Ticket Number */}
                <div 
                  className="shrink-0 bg-yellow-400 text-black px-3 py-1.5 text-center shadow"
                  style={{ borderRadius: "2mm" }}
                >
                  <div className="text-xs font-bold uppercase">Ticket</div>
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
                        <span className="text-xs text-gray-600 font-semibold">PASSENGER: </span>
                        <span className="font-black text-base">{ticket.passengerName}</span>
                        {ticket.withFamily && <span className="text-xs ml-1">(Family)</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-600">Pax: </span>
                        <span className="font-bold">{ticket.noOfTourist}</span>
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-600">Mobile: </span>
                      <span className="font-bold font-mono">{ticket.passengerPhone}</span>
                    </div>
                  </div>

                  {/* Journey */}
                  <div className="border border-gray-400 p-2" style={{ borderRadius: "2mm" }}>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs text-gray-600">TO: </span>
                        <span className="font-black text-base">{ticket.toursTo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-600">Date: </span>
                        <span className="font-bold">{format(new Date(ticket.journeyDate), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div>
                        <span className="text-xs text-gray-600">Seat: </span>
                        <span className="font-bold">{ticket.seatNo || "—"}</span>
                        <span className="mx-2">|</span>
                        <span className="text-xs text-gray-600">Report: </span>
                        <span className="font-bold">{ticket.repTime || "—"}</span>
                        <span className="mx-2">|</span>
                        <span className="text-xs text-gray-600">Dep: </span>
                        <span className="font-bold">{ticket.depTime || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Travels & Booked By */}
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1 border border-gray-300 px-2 py-1" style={{ borderRadius: "2mm" }}>
                      <span className="text-gray-600">Travels: </span>
                      <span className="font-bold">{ticket.travelsName || "—"}</span>
                    </div>
                    <div className="flex-1 border border-gray-300 px-2 py-1" style={{ borderRadius: "2mm" }}>
                      <span className="text-gray-600">Booked By: </span>
                      <span className="font-bold">{ticket.bookedBy || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div 
                  className="w-28 border-2 border-gray-800 bg-gray-100 flex flex-col items-center justify-center text-center"
                  style={{ borderRadius: "2mm" }}
                >
                  <div className="text-xs font-bold text-gray-600 uppercase">Total Amount</div>
                  <div className="text-2xl font-black mt-1">₹{ticket.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Base: ₹{baseAmount.toLocaleString()}
                    {ticket.surcharges && ticket.surcharges > 0 && (
                      <><br/>Sur: ₹{ticket.surcharges.toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 text-center border-t border-gray-300 pt-1">
                <p className="text-xs text-gray-600">यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।</p>
                <p className="text-sm font-bold">{settings.footerNote || "Wish you a Happy Journey!"}</p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-4 shrink-0 flex items-center justify-center">
            <div className="border-l-2 border-dashed border-gray-400 h-full"></div>
          </div>

          {/* Boarding Pass */}
          <aside 
            className="shrink-0 border-2 border-gray-800 relative flex flex-col overflow-hidden"
            style={{ width: "65mm", borderRadius: "3mm" }}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img 
                src={settings.logoUrl || companyLogo} 
                alt="" 
                className="opacity-15" 
                style={{ width: "40mm", height: "40mm", objectFit: "contain" }} 
              />
            </div>

            {/* Header */}
            <header className="bg-gray-900 text-white text-center py-1.5 px-2 relative z-10">
              <div className="text-sm font-black uppercase">{settings.name}</div>
              {companyPhone && <div className="text-xs">📞 {companyPhone}</div>}
            </header>

            <div className="bg-yellow-400 text-black text-center py-1 text-sm font-black uppercase relative z-10">
              Boarding Pass
            </div>

            <div className="p-2 flex-1 flex flex-col relative z-10 text-sm">
              {/* Ticket Number */}
              <div className="flex justify-between items-center border-b border-gray-300 pb-1 mb-1">
                <span className="text-xs text-gray-600">Ticket No</span>
                <span className="text-lg font-black">{ticketNumberShort}</span>
              </div>

              {/* Passenger */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                <div className="text-xs text-gray-600">Passenger</div>
                <div className="font-bold truncate">{ticket.passengerName}</div>
                <div className="text-xs">📱 {ticket.passengerPhone}</div>
              </div>

              {/* Destination */}
              <div className="border-b border-gray-300 pb-1 mb-1">
                <div className="text-xs text-gray-600">Destination</div>
                <div className="font-bold truncate">{ticket.toursTo}</div>
                <div className="flex justify-between text-xs mt-0.5">
                  <span>📅 {format(new Date(ticket.journeyDate), "dd/MM/yy")}</span>
                  <span>💺 {ticket.seatNo || "—"}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-100 border border-gray-400 text-center py-1 mt-auto" style={{ borderRadius: "2mm" }}>
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-xl font-black">₹{ticket.amount.toLocaleString()}</div>
              </div>

              {/* Footer */}
              <div className="text-center mt-1">
                <p className="text-xs font-bold">{settings.footerNote || "Happy Journey!"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }
);

PrintTicket.displayName = "PrintTicket";