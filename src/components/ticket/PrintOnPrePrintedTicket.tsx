import { forwardRef } from "react";
import { format } from "date-fns";
import { TicketWithPayment } from "@/types/ticket";

export type PrePrintedLayout = {
  name: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  toursTo: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  journeyDate: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  pickup: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  phone: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  bookingDate: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  tourists: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  repTime: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  amount: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  seatNo: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  depTime: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  pnrNo: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  busNo: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  branchTicketNo: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
  ticketNoBox: { x: number; y: number; w: number; fontPt: number; align?: "left" | "center" };
};

export const DEFAULT_PREPRINTED_LAYOUT: PrePrintedLayout = {
  name: { x: 52, y: 28, w: 85, fontPt: 11, align: "left" },
  toursTo: { x: 55, y: 35, w: 55, fontPt: 11, align: "left" },
  journeyDate: { x: 138, y: 35, w: 30, fontPt: 10, align: "left" },
  pickup: { x: 20, y: 43, w: 28, fontPt: 10, align: "left" },
  phone: { x: 56, y: 43, w: 50, fontPt: 10, align: "left" },
  bookingDate: { x: 138, y: 43, w: 30, fontPt: 10, align: "left" },

  tourists: { x: 3, y: 56, w: 52, fontPt: 12, align: "center" },
  repTime: { x: 58, y: 56, w: 48, fontPt: 12, align: "center" },
  amount: { x: 115, y: 56, w: 55, fontPt: 12, align: "center" },

  seatNo: { x: 3, y: 67, w: 52, fontPt: 12, align: "center" },
  depTime: { x: 58, y: 67, w: 48, fontPt: 12, align: "center" },

  pnrNo: { x: 3, y: 81, w: 52, fontPt: 10, align: "center" },
  busNo: { x: 3, y: 94, w: 52, fontPt: 10, align: "center" },

  branchTicketNo: { x: 58, y: 81, w: 48, fontPt: 14, align: "center" },
  ticketNoBox: { x: 115, y: 88, w: 55, fontPt: 16, align: "center" },
};

interface PrintOnPrePrintedTicketProps {
  ticket: TicketWithPayment;
  layout?: PrePrintedLayout;
}

/**
 * Prints only values (no borders/labels). Designed for pre-printed ticket form.
 * Page size should be set to 105mm x 175mm (portrait), margins 0, scale 100%.
 */
export const PrintOnPrePrintedTicket = forwardRef<HTMLDivElement, PrintOnPrePrintedTicketProps>(
  ({ ticket, layout = DEFAULT_PREPRINTED_LAYOUT }, ref) => {
    const ticketNumberShort = ticket.ticketNo.split("-").pop() || ticket.ticketNo;

    const styleFor = (k: keyof PrePrintedLayout) => {
      const p = layout[k];
      return {
        position: "absolute" as const,
        left: `${p.x}mm`,
        top: `${p.y}mm`,
        width: `${p.w}mm`,
        fontSize: `${p.fontPt}pt`,
        fontWeight: 700,
        textAlign: p.align ?? "left",
        overflow: "hidden" as const,
        textOverflow: "ellipsis" as const,
        whiteSpace: "nowrap" as const,
      };
    };

    return (
      <div
        ref={ref}
        className="bg-transparent text-black print:p-0"
        style={{
          width: "105mm",
          height: "175mm",
          position: "relative",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={styleFor("name")}>{ticket.passengerName}</div>
        <div style={styleFor("toursTo")}>{ticket.toursTo}</div>
        <div style={styleFor("journeyDate")}>{format(new Date(ticket.journeyDate), "dd/MM/yyyy")}</div>
        <div style={styleFor("pickup")}>{ticket.pickup || ""}</div>
        <div style={styleFor("phone")}>{ticket.passengerPhone}</div>
        <div style={styleFor("bookingDate")}>{format(new Date(ticket.bookingDateTime), "dd/MM/yyyy")}</div>

        <div style={styleFor("tourists")}>{ticket.noOfTourist}</div>
        <div style={styleFor("repTime")}>{ticket.repTime || ""}</div>
        <div style={styleFor("amount")}>{ticket.amount.toLocaleString()}/-</div>

        <div style={styleFor("seatNo")}>{ticket.seatNo || ""}</div>
        <div style={styleFor("depTime")}>{ticket.depTime || ""}</div>

        <div style={styleFor("pnrNo")}>{ticket.travelsName || ""}</div>
        <div style={styleFor("busNo")}>{ticket.busNo || ticket.busName || ""}</div>

        {/* Branch field used for ticket number as requested */}
        <div style={styleFor("branchTicketNo")}>{ticketNumberShort}</div>

        {/* Red ticket no box */}
        <div style={styleFor("ticketNoBox")}>{ticketNumberShort}</div>
      </div>
    );
  }
);

PrintOnPrePrintedTicket.displayName = "PrintOnPrePrintedTicket";
