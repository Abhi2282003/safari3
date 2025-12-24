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
    const passengerAddress = ticket.passengerAddress?.trim();

    const baseAmount = ticket.surcharges
      ? ticket.amount - ticket.surcharges
      : ticket.amount;

    const statusClass =
      ticket.collectionStatus === "Paid" ? "status-paid" : "status-unpaid";

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
            <header className="bg-gradient-to-br from-primary via-primary/90 to-ticket-accent text-primary-foreground">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="shrink-0 rounded-lg bg-card/95 p-2 shadow-lg shadow-primary/20"
                    style={{ width: "28mm", height: "28mm" }}
                  >
                    <img
                      src={settings.logoUrl || companyLogo}
                      alt="Bus ticket company logo"
                      loading="eager"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-bold uppercase tracking-wide">
                      {settings.name}
                    </h1>
                    {companyAddress ? (
                      <p className="mt-0.5 text-[10px] leading-snug text-primary-foreground/90">
                        {companyAddress}
                      </p>
                    ) : null}
                    {companyPhone ? (
                      <p className="mt-1 text-[10px] font-medium text-primary-foreground/90">
                        Phone: <span className="font-mono">{companyPhone}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 rounded-lg bg-accent px-3 py-2 text-center text-accent-foreground">
                    <div className="text-[9px] font-semibold uppercase tracking-wider opacity-90">
                      Ticket
                    </div>
                    <div className="ticket-number text-base font-bold">
                      {ticketNumberShort}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-3">
              {/* Top blocks */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] font-medium text-muted-foreground">
                    Passenger
                  </div>
                  <div className="mt-0.5 text-sm font-semibold leading-tight">
                    {ticket.passengerName}
                    {ticket.withFamily ? (
                      <span className="ml-2 align-middle text-[10px] font-semibold text-muted-foreground">
                        (Family)
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                    <div className="truncate">
                      <span className="text-muted-foreground">Mobile:</span>{" "}
                      <span className="font-mono font-semibold">
                        {ticket.passengerPhone}
                      </span>
                    </div>
                    <div className="truncate text-right">
                      <span className="text-muted-foreground">Pax:</span>{" "}
                      <span className="font-semibold">{ticket.noOfTourist}</span>
                    </div>
                  </div>

                  <div className="mt-1 text-[10px] font-medium text-muted-foreground">
                    Address
                  </div>
                  <div className="text-[11px] leading-snug">
                    {passengerAddress || "—"}
                  </div>
                </div>

                <div className="col-span-5 rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] font-medium text-muted-foreground">
                    Journey
                  </div>
                  <div className="mt-0.5 truncate text-sm font-semibold leading-tight text-foreground">
                    {ticket.toursTo}
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground">Date</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.journeyDate), "dd/MM/yy")}
                      </div>
                    </div>
                    <div className="truncate text-right">
                      <div className="text-[10px] text-muted-foreground">Booked</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.bookingDateTime), "dd/MM")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground">Seat</div>
                      <div className="font-semibold">{ticket.seatNo || "—"}</div>
                    </div>
                    <div className="truncate text-right">
                      <div className="text-[10px] text-muted-foreground">Dep</div>
                      <div className="font-semibold">{ticket.depTime || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground">Rep</div>
                      <div className="font-semibold">{ticket.repTime || "—"}</div>
                    </div>
                    <div className="truncate text-right">
                      <div className="text-[10px] text-muted-foreground">Status</div>
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          statusClass
                        )}
                      >
                        {ticket.collectionStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary details */}
              <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Travels</div>
                  <div className="truncate font-semibold">{ticket.travelsName || "—"}</div>
                </div>
                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Bus</div>
                  <div className="truncate font-semibold">{ticket.busName || "—"}</div>
                </div>
                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Bus No</div>
                  <div className="truncate font-semibold">{ticket.busNo || "—"}</div>
                </div>
                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Booked By</div>
                  <div className="truncate font-semibold">{ticket.bookedBy || "—"}</div>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-2 rounded-lg border border-ticket-border bg-card p-2">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground">
                      Total Amount
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {formatMoney(ticket.amount)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Base: {formatMoney(baseAmount)}
                      {ticket.surcharges && ticket.surcharges > 0
                        ? ` • Extra: ${formatMoney(ticket.surcharges)}`
                        : ""}
                    </div>
                  </div>

                  {ticket.payment ? (
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Payment
                      </div>
                      <div className="text-[11px] font-semibold">
                        Paid By: {ticket.payment.receivedByName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ticket.payment.paymentMode} • {formatMoney(ticket.payment.paidAmount)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Payment
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        Not recorded
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-2 rounded-lg border border-ticket-border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">
                  यात्री अपने सामान की रक्षा स्वयं करें ट्रॅव्हल्स की जिम्मेदारी नहीं होगी।
                </p>
                <p className="mt-1 text-[11px] font-semibold text-foreground">
                  {settings.footerNote || "Wish you a Happy Journey!"}
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="ticket-divider relative w-6 shrink-0" aria-hidden="true" />

          {/* Boarding Pass */}
          <aside className="flex shrink-0 flex-col overflow-hidden rounded-xl border-2 border-ticket-border bg-ticket-bg" style={{ width: "90mm" }}>
            <header className="bg-gradient-to-br from-primary to-ticket-accent text-primary-foreground">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="shrink-0 rounded-lg bg-card/95 p-2 shadow-lg shadow-primary/20"
                    style={{ width: "20mm", height: "20mm" }}
                  >
                    <img
                      src={settings.logoUrl || companyLogo}
                      alt="Bus ticket company logo"
                      loading="eager"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold uppercase tracking-wide">
                      {settings.name}
                    </div>
                    {companyPhone ? (
                      <div className="mt-0.5 text-[10px] text-primary-foreground/90">
                        Phone: <span className="font-mono">{companyPhone}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </header>

            <div className="border-b border-ticket-border bg-accent px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground">
              Boarding Pass
            </div>

            <div className="flex flex-1 flex-col justify-between p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-ticket-border bg-card px-2 py-1">
                  <span className="text-[10px] text-muted-foreground">Ticket</span>
                  <span className="ticket-number text-sm font-bold">{ticketNumberShort}</span>
                </div>

                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Name</div>
                  <div className="truncate text-sm font-semibold">{ticket.passengerName}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Mobile: <span className="font-mono font-semibold">{ticket.passengerPhone}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-ticket-border bg-card p-2">
                  <div className="text-[10px] text-muted-foreground">Route</div>
                  <div className="truncate text-sm font-semibold">{ticket.toursTo}</div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Date</div>
                      <div className="font-semibold">
                        {format(new Date(ticket.journeyDate), "dd/MM/yy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Seat</div>
                      <div className="font-semibold">{ticket.seatNo || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Rep</div>
                      <div className="font-semibold">{ticket.repTime || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Dep</div>
                      <div className="font-semibold">{ticket.depTime || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-ticket-border bg-card p-2">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Total</div>
                    <div className="text-lg font-bold">{formatMoney(ticket.amount)}</div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      statusClass
                    )}
                  >
                    {ticket.collectionStatus}
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-ticket-border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">
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
