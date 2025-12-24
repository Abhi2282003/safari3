import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment, CompanySettings } from "@/types/ticket";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/royal-safari-logo.png";

interface PrintTicketProps {
  ticket: TicketWithPayment;
  settings: CompanySettings;
}

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString()}`;
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
          "bg-card text-card-foreground",
          "font-sans",
          "print:p-0"
        )}
        style={{
          width: `${ticketWidth}mm`,
          minHeight: `${ticketHeight}mm`,
          padding: "4mm",
        }}
      >
        <div className="flex gap-3" style={{ minHeight: `${ticketHeight - 8}mm` }}>
          {/* Main Ticket */}
          <section className="flex-1 overflow-hidden rounded-xl border-2 border-ticket-border bg-ticket-bg relative">
            {/* Watermark Logo - Center */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ top: "50%", transform: "translateY(-20%)" }}
            >
              <img
                src={settings.logoUrl || companyLogo}
                alt=""
                className="opacity-10"
                style={{ width: "70mm", height: "70mm", objectFit: "contain" }}
              />
            </div>

            {/* Header - Big Logo + Centered Company Info */}
            <header className="bg-gradient-to-br from-primary via-primary/90 to-ticket-accent text-primary-foreground relative z-10">
              <div className="p-4 flex items-center gap-4">
                {/* Big Logo */}
                <div className="shrink-0 rounded-xl bg-card/95 p-2 shadow-xl" style={{ width: "38mm", height: "38mm" }}>
                  <img
                    src={settings.logoUrl || companyLogo}
                    alt="Company logo"
                    loading="eager"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Company Info - Center Aligned */}
                <div className="flex-1 text-center py-1">
                  <h1 className="text-3xl font-black uppercase tracking-wide leading-tight drop-shadow-sm">
                    {settings.name}
                  </h1>
                  {companyAddress && (
                    <p className="text-base font-medium leading-snug text-primary-foreground mt-2">
                      {companyAddress}
                    </p>
                  )}
                  {companyPhone && (
                    <p className="text-xl font-bold text-primary-foreground mt-2">
                      📞 {companyPhone}
                    </p>
                  )}
                </div>

                {/* Ticket Number Badge */}
                <div className="shrink-0 rounded-lg bg-accent px-4 py-3 text-center text-accent-foreground shadow-lg">
                  <div className="text-sm font-bold uppercase tracking-wider opacity-90">
                    Ticket
                  </div>
                  <div className="ticket-number text-2xl font-black">
                    {ticketNumberShort}
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 relative z-10">
              {/* Passenger & Journey Info */}
              <div className="grid grid-cols-12 gap-3">
                {/* Passenger Block */}
                <div className="col-span-6 rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    Passenger
                  </div>
                  <div className="mt-1 text-xl font-black leading-tight text-foreground">
                    {ticket.passengerName}
                    {ticket.withFamily && (
                      <span className="ml-2 text-sm font-bold text-muted-foreground">
                        (Family)
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-base font-semibold">
                    <span className="text-muted-foreground">Mobile:</span>{" "}
                    <span className="font-mono font-bold text-foreground">{ticket.passengerPhone}</span>
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    <span className="text-muted-foreground">Pax:</span>{" "}
                    <span className="font-bold text-foreground">{ticket.noOfTourist}</span>
                  </div>
                </div>

                {/* Journey Block */}
                <div className="col-span-6 rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    Journey To
                  </div>
                  <div className="mt-1 text-xl font-black leading-tight text-foreground">
                    {ticket.toursTo}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Date</div>
                      <div className="font-bold text-foreground">
                        {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-muted-foreground">Booked</div>
                      <div className="font-bold text-foreground">
                        {format(new Date(ticket.bookingDateTime), "dd/MM/yy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Details */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Seat No</div>
                      <div className="font-bold text-lg text-foreground">{ticket.seatNo || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Report Time</div>
                      <div className="font-bold text-lg text-foreground">{ticket.repTime || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Departure</div>
                      <div className="font-bold text-lg text-foreground">{ticket.depTime || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Booked By</div>
                      <div className="font-bold text-lg truncate text-foreground">{ticket.bookedBy || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground">Travels</div>
                    <div className="font-bold text-lg truncate text-foreground">{ticket.travelsName || "—"}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Bus</div>
                      <div className="font-bold text-base truncate text-foreground">{ticket.busName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Bus No</div>
                      <div className="font-bold text-base truncate text-foreground">{ticket.busNo || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="mt-3 rounded-lg border-2 border-primary/40 bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {formatMoney(ticket.amount)}
                    </div>
                    <div className="mt-1 text-base font-semibold text-muted-foreground">
                      Base: {formatMoney(baseAmount)}
                      {ticket.surcharges && ticket.surcharges > 0 && (
                        <> • Surcharges: {formatMoney(ticket.surcharges)}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-3 rounded-lg border border-ticket-border bg-card/90 p-3 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।
                </p>
                <p className="mt-1 text-base font-black text-foreground">
                  {settings.footerNote || "Wish you a Happy Journey!"}
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="ticket-divider relative w-6 shrink-0" aria-hidden="true" />

          {/* Boarding Pass */}
          <aside className="flex shrink-0 flex-col overflow-hidden rounded-xl border-2 border-ticket-border bg-ticket-bg relative" style={{ width: "85mm" }}>
            {/* Watermark Logo - Center */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ top: "50%", transform: "translateY(-10%)" }}
            >
              <img
                src={settings.logoUrl || companyLogo}
                alt=""
                className="opacity-10"
                style={{ width: "45mm", height: "45mm", objectFit: "contain" }}
              />
            </div>

            {/* Header */}
            <header className="bg-gradient-to-br from-primary to-ticket-accent text-primary-foreground relative z-10">
              <div className="p-3">
                <div className="flex items-center gap-2">
                  {/* Logo */}
                  <div className="shrink-0 rounded-lg bg-card/95 p-1.5 shadow-lg" style={{ width: "22mm", height: "22mm" }}>
                    <img
                      src={settings.logoUrl || companyLogo}
                      alt="Company logo"
                      loading="eager"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-black uppercase tracking-wide leading-tight">
                      {settings.name}
                    </div>
                    {companyAddress && (
                      <div className="text-xs font-medium text-primary-foreground/90 mt-1 leading-tight">
                        {companyAddress}
                      </div>
                    )}
                    {companyPhone && (
                      <div className="text-sm font-bold text-primary-foreground mt-1">
                        📞 {companyPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="border-b border-ticket-border bg-accent px-3 py-2 text-center text-base font-black uppercase tracking-[0.15em] text-accent-foreground relative z-10">
              Boarding Pass
            </div>

            <div className="flex flex-1 flex-col justify-between p-3 relative z-10">
              <div className="space-y-2">
                {/* Ticket Number */}
                <div className="flex items-center justify-between rounded-lg border border-ticket-border bg-card/90 px-3 py-2">
                  <span className="text-sm font-bold text-muted-foreground">Ticket No</span>
                  <span className="ticket-number text-xl font-black text-foreground">{ticketNumberShort}</span>
                </div>

                {/* Passenger Info */}
                <div className="rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div className="text-sm font-bold text-muted-foreground">Passenger</div>
                  <div className="text-lg font-black truncate text-foreground">{ticket.passengerName}</div>
                  <div className="mt-1 text-base font-semibold">
                    Mobile: <span className="font-mono font-bold text-foreground">{ticket.passengerPhone}</span>
                  </div>
                </div>

                {/* Route Info */}
                <div className="rounded-lg border border-ticket-border bg-card/90 p-3">
                  <div className="text-sm font-bold text-muted-foreground">Destination</div>
                  <div className="text-lg font-black truncate text-foreground">{ticket.toursTo}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Date</div>
                      <div className="font-bold text-foreground">
                        {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-muted-foreground">Seat</div>
                      <div className="font-bold text-foreground">{ticket.seatNo || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">Report</div>
                      <div className="font-bold text-foreground">{ticket.repTime || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-muted-foreground">Departure</div>
                      <div className="font-bold text-foreground">{ticket.depTime || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-2 rounded-lg border-2 border-primary/40 bg-primary/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-muted-foreground">Total</div>
                  <div className="text-2xl font-black text-foreground">{formatMoney(ticket.amount)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 rounded-lg border border-ticket-border bg-card/90 p-2 text-center">
                <p className="text-base font-black text-foreground">
                  {settings.footerNote || "Wish you a Happy Journey!"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }
);

PrintTicket.displayName = "PrintTicket";