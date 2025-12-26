import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment } from "@/types/ticket";

interface PrintOnPrePrintedTicketProps {
  ticket: TicketWithPayment;
}

/**
 * This component prints ONLY the data values positioned to align with
 * pre-printed Royal ticket forms (105mm x 175mm landscape).
 * No backgrounds, borders, or labels - just the data at precise positions.
 * 
 * The ticket is oriented in landscape mode (175mm wide x 105mm tall).
 * Positions are calibrated to match the pre-printed form fields.
 */
export const PrintOnPrePrintedTicket = forwardRef<HTMLDivElement, PrintOnPrePrintedTicketProps>(
  ({ ticket }, ref) => {
    const ticketNumberShort = ticket.ticketNo.split("-").pop() || ticket.ticketNo;

    // Ticket dimensions: 175mm x 105mm (landscape)
    const ticketWidth = 175; // mm
    const ticketHeight = 105; // mm

    return (
      <div
        ref={ref}
        className="preprinted-ticket-print bg-transparent text-black font-sans print:p-0"
        style={{
          width: `${ticketWidth}mm`,
          height: `${ticketHeight}mm`,
          position: "relative",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* 
          Positions are measured from top-left of the ticket.
          The pre-printed form has these fields:
          - Name (after "Shri/Smt."): ~45mm from left, ~22mm from top
          - Tours To: ~45mm from left, ~30mm from top
          - Address: ~25mm from left, ~38mm from top
          - Ph: ~85mm from left, ~38mm from top
          - No. of Tourist: ~30mm from left, ~50mm from top
          - Seat No.: ~58mm from left, ~50mm from top
          - PNR No.: ~85mm from left, ~50mm from top (we'll use bus name)
          - Bus No.: ~115mm from left, ~50mm from top
          - Rep. Time: ~30mm from left, ~62mm from top
          - Dep. Time: ~60mm from left, ~62mm from top
          - Branch (Ticket No): ~95mm from left, ~62mm from top
          - Journey Date: ~35mm from left, ~75mm from top
          - Booking Date: ~100mm from left, ~75mm from top
          - Amount Rs.: ~45mm from left, ~85mm from top
          - Sig. of Tourist: ~105mm from left, ~85mm from top (skip)
          - TICKET No. (bottom): ~25mm from left, ~92mm from top
        */}

        {/* Passenger Name - After "Shri/Smt." */}
        <div
          style={{
            position: "absolute",
            left: "50mm",
            top: "20mm",
            fontSize: "12pt",
            fontWeight: "bold",
            maxWidth: "80mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.passengerName}
        </div>

        {/* Tours To - Destination */}
        <div
          style={{
            position: "absolute",
            left: "52mm",
            top: "27mm",
            fontSize: "12pt",
            fontWeight: "bold",
            maxWidth: "70mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.toursTo}
        </div>

        {/* Address / Pickup */}
        <div
          style={{
            position: "absolute",
            left: "28mm",
            top: "35mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "50mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.pickup || "—"}
        </div>

        {/* Phone */}
        <div
          style={{
            position: "absolute",
            left: "92mm",
            top: "35mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {ticket.passengerPhone}
        </div>

        {/* No. of Tourist */}
        <div
          style={{
            position: "absolute",
            left: "38mm",
            top: "47mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "15mm",
          }}
        >
          {ticket.noOfTourist}
        </div>

        {/* Seat No. */}
        <div
          style={{
            position: "absolute",
            left: "65mm",
            top: "47mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "18mm",
          }}
        >
          {ticket.seatNo || "—"}
        </div>

        {/* PNR No. - Using Travels Name or Bus Name */}
        <div
          style={{
            position: "absolute",
            left: "92mm",
            top: "47mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "25mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.travelsName || "—"}
        </div>

        {/* Bus No. */}
        <div
          style={{
            position: "absolute",
            left: "125mm",
            top: "47mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "30mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.busNo || ticket.busName || "—"}
        </div>

        {/* Rep. Time */}
        <div
          style={{
            position: "absolute",
            left: "32mm",
            top: "60mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "20mm",
          }}
        >
          {ticket.repTime || "—"}
        </div>

        {/* Dep. Time */}
        <div
          style={{
            position: "absolute",
            left: "65mm",
            top: "60mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "20mm",
          }}
        >
          {ticket.depTime || "—"}
        </div>

        {/* Branch - Using Ticket Number */}
        <div
          style={{
            position: "absolute",
            left: "105mm",
            top: "60mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "30mm",
          }}
        >
          {ticketNumberShort}
        </div>

        {/* Journey Date */}
        <div
          style={{
            position: "absolute",
            left: "42mm",
            top: "74mm",
            fontSize: "11pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
        </div>

        {/* Booking Date */}
        <div
          style={{
            position: "absolute",
            left: "105mm",
            top: "74mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.bookingDateTime), "dd/MM/yyyy")}
        </div>

        {/* with Family / Friends checkbox area */}
        {ticket.withFamily && (
          <div
            style={{
              position: "absolute",
              left: "154mm",
              top: "74mm",
              fontSize: "16pt",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
        )}

        {/* Amount Rs. */}
        <div
          style={{
            position: "absolute",
            left: "45mm",
            top: "85mm",
            fontSize: "12pt",
            fontWeight: "bold",
          }}
        >
          {ticket.amount.toLocaleString()}/-
        </div>

        {/* Ticket No. (bottom left corner) */}
        <div
          style={{
            position: "absolute",
            left: "20mm",
            top: "92mm",
            fontSize: "14pt",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          {ticketNumberShort}
        </div>
      </div>
    );
  }
);

PrintOnPrePrintedTicket.displayName = "PrintOnPrePrintedTicket";
