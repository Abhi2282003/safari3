import { forwardRef, useEffect, useState } from "react";
import { TicketWithPayment } from "@/types/ticket";
import {
  PrintOnPrePrintedTicket,
  type PrePrintedLayout,
  DEFAULT_PREPRINTED_LAYOUT,
} from "@/components/ticket/PrintOnPrePrintedTicket";
import { supabase } from "@/integrations/supabase/client";
import prePrintedTemplate from "@/assets/royal-preprinted-template.png";

interface PrePrintedTicketPreviewProps {
  ticket: TicketWithPayment;
  userId?: string;
}

export const PrePrintedTicketPreview = forwardRef<HTMLDivElement, PrePrintedTicketPreviewProps>(
  ({ ticket, userId }, ref) => {
    const [layout, setLayout] = useState<PrePrintedLayout>(DEFAULT_PREPRINTED_LAYOUT);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadLayout = async () => {
        if (!userId) {
          setLoading(false);
          return;
        }

        try {
          const { data } = await supabase
            .from("company_settings")
            .select("preprinted_layout")
            .eq("user_id", userId)
            .maybeSingle();

          if (data?.preprinted_layout) {
            const savedLayout = data.preprinted_layout as Partial<PrePrintedLayout>;
            const merged = { ...DEFAULT_PREPRINTED_LAYOUT, ...savedLayout } as PrePrintedLayout;

            const outOfBounds = (Object.keys(DEFAULT_PREPRINTED_LAYOUT) as (keyof PrePrintedLayout)[]).some((k) => {
              const p = merged[k];
              return typeof p?.x === "number" && typeof p?.y === "number" && (p.x > 175 || p.y > 105);
            });

            setLayout(outOfBounds ? DEFAULT_PREPRINTED_LAYOUT : merged);
          }
        } catch (error) {
          console.error("Error loading pre-printed layout:", error);
        } finally {
          setLoading(false);
        }
      };

      loadLayout();
    }, [userId]);

    if (loading) {
      return (
        <div
          className="flex items-center justify-center bg-muted/50 rounded-md"
          style={{ width: "175mm", height: "105mm" }}
        >
          <span className="text-muted-foreground text-sm">Loading layout...</span>
        </div>
      );
    }

    return (
      <div className="relative mx-auto" style={{ width: "175mm", height: "105mm" }}>
        {/* Background template for screen preview only */}
        <img
          src={prePrintedTemplate}
          alt="Pre-printed ticket template"
          className="absolute inset-0 w-full h-full object-contain print:hidden"
          style={{ pointerEvents: "none" }}
        />
        {/* Printable content */}
        <PrintOnPrePrintedTicket ref={ref} ticket={ticket} layout={layout} />
      </div>
    );
  }
);

PrePrintedTicketPreview.displayName = "PrePrintedTicketPreview";
