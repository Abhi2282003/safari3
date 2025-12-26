import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment } from "@/types/ticket";

interface PrintOnPrePrintedTicketProps {
  ticket: TicketWithPayment;
}

/**
 * Prints data on pre-printed Royal Safari ticket (175mm x 105mm LANDSCAPE)
 * 
 * Layout:
 * - Header: Logo, company name, address (pre-printed)
 * - Row 1: "Shri/Smt. [NAME]" ... "with Family/Friends"
 * - Row 2: "Tours To [DEST]" ... "Journey Date: [DATE]"
 * - Row 3: "Address [ADDR]" "Ph. [PHONE]" ... "Booking Date: [DATE]"
 * - Yellow boxes Row 1: No. of Tourist | Rep. Time | Amount Rs.
 * - Yellow boxes Row 2: Seat No. | Dep. Time | Sig. of Tourist
 * - Bottom Row: PNR No. | Branch | TICKET No.
 * - Last Row: Bus No. |        | [number]
 */
export const PrintOnPrePrintedTicket = forwardRef<HTMLDivElement, PrintOnPrePrintedTicketProps>(
  ({ ticket }, ref) => {
    const ticketNumberShort = ticket.ticketNo.split("-").pop() || ticket.ticketNo;

    // Ticket dimensions: 175mm x 105mm (LANDSCAPE)
    const ticketWidth = 175; // mm
    const ticketHeight = 105; // mm

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
        {/* ===== ROW 1: Name & Family ===== */}
        
        {/* Passenger Name - after "Shri/Smt." */}
        <div
          style={{
            position: "absolute",
            left: "52mm",
            top: "28mm",
            fontSize: "11pt",
            fontWeight: "bold",
            maxWidth: "85mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.passengerName}
        </div>

        {/* with Family / Friends - checkmark if applicable */}
        {ticket.withFamily && (
          <div
            style={{
              position: "absolute",
              left: "140mm",
              top: "27mm",
              fontSize: "12pt",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
        )}

        {/* ===== ROW 2: Tours To & Journey Date ===== */}
        
        {/* Tours To - Destination */}
        <div
          style={{
            position: "absolute",
            left: "55mm",
            top: "35mm",
            fontSize: "11pt",
            fontWeight: "bold",
            maxWidth: "55mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.toursTo}
        </div>

        {/* Journey Date */}
        <div
          style={{
            position: "absolute",
            left: "138mm",
            top: "35mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.journeyDate), "dd/MM/yyyy")}
        </div>

        {/* ===== ROW 3: Address, Phone & Booking Date ===== */}
        
        {/* Address / Pickup */}
        <div
          style={{
            position: "absolute",
            left: "20mm",
            top: "43mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "28mm",
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
            left: "56mm",
            top: "43mm",
            fontSize: "10pt",
            fontWeight: "bold",
            maxWidth: "50mm",
          }}
        >
          {ticket.passengerPhone}
        </div>

        {/* Booking Date */}
        <div
          style={{
            position: "absolute",
            left: "138mm",
            top: "43mm",
            fontSize: "10pt",
            fontWeight: "bold",
          }}
        >
          {format(new Date(ticket.bookingDateTime), "dd/MM/yyyy")}
        </div>

        {/* ===== YELLOW BOXES ROW 1 ===== */}
        
        {/* No. of Tourist */}
        <div
          style={{
            position: "absolute",
            left: "3mm",
            top: "56mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "52mm",
          }}
        >
          {ticket.noOfTourist}
        </div>

        {/* Rep. Time */}
        <div
          style={{
            position: "absolute",
            left: "58mm",
            top: "56mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "48mm",
          }}
        >
          {ticket.repTime || ""}
        </div>

        {/* Amount Rs. */}
        <div
          style={{
            position: "absolute",
            left: "115mm",
            top: "56mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "55mm",
          }}
        >
          {ticket.amount.toLocaleString()}/-
        </div>

        {/* ===== YELLOW BOXES ROW 2 ===== */}
        
        {/* Seat No. */}
        <div
          style={{
            position: "absolute",
            left: "3mm",
            top: "67mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "52mm",
          }}
        >
          {ticket.seatNo || ""}
        </div>

        {/* Dep. Time */}
        <div
          style={{
            position: "absolute",
            left: "58mm",
            top: "67mm",
            fontSize: "12pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "48mm",
          }}
        >
          {ticket.depTime || ""}
        </div>

        {/* Sig. of Tourist - leave empty (passenger signs) */}

        {/* ===== BOTTOM BOXES ===== */}
        
        {/* PNR No. - Using Travels Name */}
        <div
          style={{
            position: "absolute",
            left: "3mm",
            top: "81mm",
            fontSize: "10pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "52mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.travelsName || ""}
        </div>

        {/* Branch - Using Ticket Number */}
        <div
          style={{
            position: "absolute",
            left: "58mm",
            top: "81mm",
            fontSize: "14pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "48mm",
          }}
        >
          {ticketNumberShort}
        </div>

        {/* TICKET No. (in red box area) */}
        <div
          style={{
            position: "absolute",
            left: "115mm",
            top: "88mm",
            fontSize: "16pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "55mm",
          }}
        >
          {ticketNumberShort}
        </div>

        {/* Bus No. */}
        <div
          style={{
            position: "absolute",
            left: "3mm",
            top: "94mm",
            fontSize: "10pt",
            fontWeight: "bold",
            textAlign: "center",
            width: "52mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.busNo || ticket.busName || ""}
        </div>
      </div>
    );
  }
);

PrintOnPrePrintedTicket.displayName = "PrintOnPrePrintedTicket";
