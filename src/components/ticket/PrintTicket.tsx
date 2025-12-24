import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment, CompanySettings } from "@/types/ticket";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/company-logo.png";

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

    const ticketWidth = settings.ticketWidth || 280;
    const ticketHeight = settings.ticketHeight || 140;

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
          <section className="flex-1 overflow-hidden rounded-xl border-2 border-ticket-border bg-ticket-bg">
            {/* Header - Company Info Centered */}
            <header className="bg-gradient-to-br from-primary via-primary/90 to-ticket-accent text-primary-foreground">
              <div className="p-4 text-center">
                {/* Logo - Big and Centered */}
                <div className="mx-auto mb-2" style={{ width: "32mm", height: "32mm" }}>
                  <div className="rounded-lg bg-card/95 p-2 shadow-lg shadow-primary/20 h-full w-full">
                    <img
                      src={settings.logoUrl || companyLogo}
                      alt="Company logo"
                      loading="eager"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <h1 className="text-xl font-bold uppercase tracking-wide">
                  {settings.name}
                </h1>
                
                {/* Company Address - Centered */}
                {companyAddress && (
                  <p className="mt-1 text-sm leading-snug text-primary-foreground/90">
                    {companyAddress}
                  </p>
                )}
                
                {/* Company Phone - Centered */}
                {companyPhone && (
                  <p className="mt-1 text-sm font-semibold text-primary-foreground">
                    📞 {companyPhone}
                  </p>
                )}

                {/* Ticket Number Badge */}
                <div className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-accent-foreground">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                    Ticket No.
                  </div>
                  <div className="ticket-number text-lg font-bold">
                    {ticketNumberShort}
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4">
              {/* Passenger & Journey Info */}
              <div className="grid grid-cols-12 gap-3">
                {/* Passenger Block */}
                <div className="col-span-6 rounded-lg border border-ticket-border bg-card p-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Passenger
                  </div>
                  <div className="mt-1 text-base font-bold leading-tight">
                    {ticket.passengerName}
                    {ticket.withFamily && (
                      <span className="ml-2 text-xs font-semibold text-muted-foreground">
                        (Family)
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Mobile:</span>{" "}
                    <span className="font-mono font-semibold">{ticket.passengerPhone}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">Pax:</span>{" "}
                    <span className="font-semibold">{ticket.noOfTourist}</span>
                  </div>
                </div>

                {/* Journey Block */}
                <div className="col-span-6 rounded-lg border border-ticket-border bg-card p-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Journey To
                  </div>
                  <div className="mt-1 text-base font-bold leading-tight text-foreground">
                    {ticket.toursTo}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Booked</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.bookingDateTime), "dd/MM/yy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Details */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-ticket-border bg-card p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Seat No</div>
                      <div className="font-semibold text-base">{ticket.seatNo || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Report Time</div>
                      <div className="font-semibold text-base">{ticket.repTime || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Departure</div>
                      <div className="font-semibold text-base">{ticket.depTime || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Booked By</div>
                      <div className="font-semibold text-base truncate">{ticket.bookedBy || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-ticket-border bg-card p-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Travels</div>
                    <div className="font-semibold text-base truncate">{ticket.travelsName || "—"}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Bus</div>
                      <div className="font-semibold truncate">{ticket.busName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Bus No</div>
                      <div className="font-semibold truncate">{ticket.busNo || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="mt-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatMoney(ticket.amount)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Base: {formatMoney(baseAmount)}
                      {ticket.surcharges && ticket.surcharges > 0 && (
                        <> • Extra: {formatMoney(ticket.surcharges)}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-3 rounded-lg border border-ticket-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {settings.footerNote || "Wish you a Happy Journey!"}
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="ticket-divider relative w-6 shrink-0" aria-hidden="true" />

          {/* Boarding Pass */}
          <aside className="flex shrink-0 flex-col overflow-hidden rounded-xl border-2 border-ticket-border bg-ticket-bg" style={{ width: "85mm" }}>
            {/* Header */}
            <header className="bg-gradient-to-br from-primary to-ticket-accent text-primary-foreground">
              <div className="p-3 text-center">
                <div className="mx-auto mb-2" style={{ width: "22mm", height: "22mm" }}>
                  <div className="rounded-lg bg-card/95 p-1.5 shadow-lg h-full w-full">
                    <img
                      src={settings.logoUrl || companyLogo}
                      alt="Company logo"
                      loading="eager"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="text-sm font-bold uppercase tracking-wide">
                  {settings.name}
                </div>
                {companyPhone && (
                  <div className="mt-0.5 text-xs text-primary-foreground/90">
                    📞 {companyPhone}
                  </div>
                )}
              </div>
            </header>

            <div className="border-b border-ticket-border bg-accent px-3 py-2 text-center text-sm font-bold uppercase tracking-[0.15em] text-accent-foreground">
              Boarding Pass
            </div>

            <div className="flex flex-1 flex-col justify-between p-3">
              <div className="space-y-2">
                {/* Ticket Number */}
                <div className="flex items-center justify-between rounded-lg border border-ticket-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">Ticket No</span>
                  <span className="ticket-number text-base font-bold">{ticketNumberShort}</span>
                </div>

                {/* Passenger Info */}
                <div className="rounded-lg border border-ticket-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">Passenger</div>
                  <div className="text-base font-bold truncate">{ticket.passengerName}</div>
                  <div className="mt-1 text-sm">
                    Mobile: <span className="font-mono font-semibold">{ticket.passengerPhone}</span>
                  </div>
                </div>

                {/* Route Info */}
                <div className="rounded-lg border border-ticket-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">Destination</div>
                  <div className="text-base font-bold truncate">{ticket.toursTo}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Seat</div>
                      <div className="font-semibold">{ticket.seatNo || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Report</div>
                      <div className="font-semibold">{ticket.repTime || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Departure</div>
                      <div className="font-semibold">{ticket.depTime || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-2 rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-xl font-bold">{formatMoney(ticket.amount)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 rounded-lg border border-ticket-border bg-card p-2 text-center">
                <p className="text-sm font-semibold text-foreground">
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
