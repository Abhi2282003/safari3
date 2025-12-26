import { forwardRef, useEffect, useState } from "react";
import { TicketWithPayment } from "@/types/ticket";
import { PrintOnPrePrintedTicket, type PrePrintedLayout, DEFAULT_PREPRINTED_LAYOUT } from "@/components/ticket/PrintOnPrePrintedTicket";
import { supabase } from "@/integrations/supabase/client";

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
            const savedLayout = data.preprinted_layout as PrePrintedLayout;
            setLayout({ ...DEFAULT_PREPRINTED_LAYOUT, ...savedLayout });
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

    return <PrintOnPrePrintedTicket ref={ref} ticket={ticket} layout={layout} />;
  }
);

PrePrintedTicketPreview.displayName = "PrePrintedTicketPreview";
