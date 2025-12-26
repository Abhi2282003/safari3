import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment } from "@/types/ticket";

interface PrintOnPrePrintedTicketProps {
  ticket: TicketWithPayment;
}

/**
 * This component prints ONLY the data values positioned to align with
 * pre-printed Royal ticket forms (105mm width x 175mm height - PORTRAIT).
 * No backgrounds, borders, or labels - just the data at precise positions.
 * 
 * Field positions (measured from top-left of ticket):
 * - Passenger Name: after "Shri/Smt." line
 * - Tours To: destination field
 * - Address: pickup location
 * - Ph: phone number
 * - No. of Tourist, Seat No., PNR No., Bus No. (yellow boxes row 1)
 * - Rep. Time, Dep. Time, Branch/Ticket No. (yellow boxes row 2)
 * - Journey Date, Booking Date, with Family checkbox
 * - Amount Rs., Sig. of Tourist
 * - TICKET No. (red box at bottom)
 */
export const PrintOnPrePrintedTicket = forwardRef<HTMLDivElement, PrintOnPrePrintedTicketProps>(
  ({ ticket }, ref) => {
    const ticketNumberShort = ticket.ticketNo.split("-").pop() || ticket.ticketNo;

    // Ticket dimensions: 105mm x 175mm (PORTRAIT - width x height)
    const ticketWidth = 105; // mm
    const ticketHeight = 175; // mm

    return (
      <div
        ref={ref}
        className="preprinted-ticket-print bg-transparent text-black print:p-0"
        style={{
          width: `${ticketWidth}mm`,
          height: `${ticketHeight}mm`,
          position: "relative",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Passenger Name - After "Shri/Smt." on the line */}
        <div
          style={{
            position: "absolute",
            left: "32mm",
            top: "38mm",
            fontSize: "11pt",
            fontWeight: "bold",
            maxWidth: "68mm",
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
            left: "48mm",
            top: "45mm",
            fontSize: "11pt",
            fontWeight: "bold",
            maxWidth: "52mm",
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
            left: "22mm",
            top: "52mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "35mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.pickup || ""}
        </div>

        {/* Phone */}
        <div
          style={{
            position: "absolute",
            left: "68mm",
            top: "52mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "32mm",
          }}
        >
          {ticket.passengerPhone}
        </div>

        {/* === Yellow Boxes Row 1 === */}
        
        {/* No. of Tourist */}
        <div
          style={{
            position: "absolute",
            left: "5mm",
            top: "66mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "22mm",
          }}
        >
          {ticket.noOfTourist}
        </div>

        {/* Seat No. */}
        <div
          style={{
            position: "absolute",
            left: "28mm",
            top: "66mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "22mm",
          }}
        >
          {ticket.seatNo || ""}
        </div>

        {/* PNR No. - Using Travels Name */}
        <div
          style={{
            position: "absolute",
            left: "51mm",
            top: "66mm",
            fontSize: "9pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "24mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.travelsName || ""}
        </div>

        {/* Bus No. */}
        <div
          style={{
            position: "absolute",
            left: "76mm",
            top: "66mm",
            fontSize: "9pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "26mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.busNo || ticket.busName || ""}
        </div>

        {/* === Yellow Boxes Row 2 === */}

        {/* Rep. Time */}
        <div
          style={{
            position: "absolute",
            left: "5mm",
            top: "82mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "28mm",
          }}
        >
          {ticket.repTime || ""}
        </div>

        {/* Dep. Time */}
        <div
          style={{
            position: "absolute",
            left: "34mm",
            top: "82mm",
            fontSize: "11pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "28mm",
          }}
        >
          {ticket.depTime || ""}
        </div>

        {/* Branch - Using Ticket Number */}
        <div
          style={{
            position: "absolute",
            left: "63mm",
            top: "82mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "38mm",
          }}
        >
          {ticketNumberShort}
        </div>

        {/* === Bottom Section === */}

        {/* Journey Date */}
        <div
          style={{
            position: "absolute",
            left: "32mm",
            top: "98mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
        </div>

        {/* Booking Date */}
        <div
          style={{
            position: "absolute",
            left: "32mm",
            top: "106mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.bookingDateTime), "dd/MM/yyyy")}
        </div>

        {/* with Family / Friends checkbox */}
        {ticket.withFamily && (
          <div
            style={{
              position: "absolute",
              left: "75mm",
              top: "106mm",
              fontSize: "14pt",
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
            left: "28mm",
            top: "120mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "30mm",
          }}
        >
          {ticket.amount.toLocaleString()}/-
        </div>

        {/* Ticket No. (bottom red box) */}
        <div
          style={{
            position: "absolute",
            left: "5mm",
            top: "142mm",
            fontSize: "14pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "25mm",
          }}
        >
          {ticketNumberShort}
        </div>
      </div>
    );
  }
);

PrintOnPrePrintedTicket.displayName = "PrintOnPrePrintedTicket";
