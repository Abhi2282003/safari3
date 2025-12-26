import { forwardRef, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TicketWithPayment } from "@/types/ticket";
import templateImage from "@/assets/royal-preprinted-template.png";
import { Button } from "@/components/ui/button";
import { PrintOnPrePrintedTicket, type PrePrintedLayout, DEFAULT_PREPRINTED_LAYOUT } from "@/components/ticket/PrintOnPrePrintedTicket";

type LayoutKey = keyof PrePrintedLayout;

const PX_PER_MM = 96 / 25.4;

function loadLayout(userId: string): PrePrintedLayout | null {
  try {
    const raw = localStorage.getItem(`preprinted_layout_v1:${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PrePrintedLayout;
  } catch {
    return null;
  }
}

function saveLayout(userId: string, layout: PrePrintedLayout) {
  localStorage.setItem(`preprinted_layout_v1:${userId}`, JSON.stringify(layout));
}

export const PrePrintedTicketPreview = forwardRef<
  HTMLDivElement,
  { ticket: TicketWithPayment; userId?: string }
>(({ ticket, userId }, ref) => {
  const defaultLayout = useMemo(() => DEFAULT_PREPRINTED_LAYOUT, []);
  const [layout, setLayout] = useState<PrePrintedLayout>(defaultLayout);
  const [showTemplate, setShowTemplate] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [calibrate, setCalibrate] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const saved = loadLayout(userId);
    if (saved) setLayout({ ...defaultLayout, ...saved });
  }, [userId, defaultLayout]);

  const startDrag = (key: LayoutKey, e: React.PointerEvent) => {
    if (!calibrate) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = layout[key];

    const onMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxMm = dxPx / PX_PER_MM;
      const dyMm = dyPx / PX_PER_MM;

      setLayout((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          x: Math.max(0, startPos.x + dxMm),
          y: Math.max(0, startPos.y + dyMm),
        },
      }));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleSave = () => {
    if (!userId) {
      toast("Could not save layout (user not loaded)");
      return;
    }
    saveLayout(userId, layout);
    toast("Pre-printed layout saved");
  };

  const handleReset = () => {
    setLayout(defaultLayout);
    toast("Layout reset to default");
  };

  const orderedKeys: LayoutKey[] = [
    "name",
    "toursTo",
    "journeyDate",
    "pickup",
    "phone",
    "bookingDate",
    "tourists",
    "repTime",
    "amount",
    "seatNo",
    "depTime",
    "pnrNo",
    "busNo",
    "branchTicketNo",
    "ticketNoBox",
  ];

  return (
    <div className="mx-auto w-fit">
      {/* Toolbar (not printed) */}
      <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
        <Button size="sm" variant={calibrate ? "default" : "outline"} onClick={() => setCalibrate((v) => !v)}>
          Calibrate
        </Button>
        <Button size="sm" variant={showTemplate ? "default" : "outline"} onClick={() => setShowTemplate((v) => !v)}>
          Template
        </Button>
        <Button size="sm" variant={showGrid ? "default" : "outline"} onClick={() => setShowGrid((v) => !v)}>
          Grid
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
        <div className="text-xs text-muted-foreground">
          Tip: Print scale 100% and margins none.
        </div>
      </div>

      {/* Preview area (105mm x 175mm ticket is LANDSCAPE in your photo: 175mm x 105mm) */}
      <div
        className="relative overflow-hidden rounded-md border border-border bg-background print:border-0"
        style={{ width: "175mm", height: "105mm" }}
      >
        {/* Background photo template (preview only) */}
        {showTemplate && (
          <img
            src={templateImage}
            alt="Pre-printed ticket template"
            className="absolute inset-0 h-full w-full object-cover opacity-80 print:hidden"
          />
        )}

        {/* Grid overlay (preview only) */}
        {showGrid && (
          <div
            className="absolute inset-0 print:hidden"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)",
              backgroundSize: "5mm 5mm",
            }}
          />
        )}

        {/* Printable layer */}
        <PrintOnPrePrintedTicket ref={ref} ticket={ticket} layout={layout} />

        {/* Draggable handles (preview only) */}
        {calibrate && (
          <div className="absolute inset-0 z-20 print:hidden">
            {orderedKeys.map((key) => {
              const p = layout[key];
              return (
                <div
                  key={key}
                  onPointerDown={(e) => startDrag(key, e)}
                  className="absolute cursor-move select-none rounded border border-border bg-background/80 px-1 py-0.5 text-[10px]"
                  style={{
                    left: `${p.x}mm`,
                    top: `${p.y}mm`,
                    transform: "translate(-2mm, -2mm)",
                  }}
                >
                  {key}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

PrePrintedTicketPreview.displayName = "PrePrintedTicketPreview";
