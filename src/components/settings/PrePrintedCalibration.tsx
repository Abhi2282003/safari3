import { useState } from "react";
import { Save, RotateCcw, Grid3X3, Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import templateImage from "@/assets/royal-preprinted-template.png";
import { DEFAULT_PREPRINTED_LAYOUT, type PrePrintedLayout } from "@/components/ticket/PrintOnPrePrintedTicket";

type LayoutKey = keyof PrePrintedLayout;

// At scale 1, 1mm = 96/25.4 px
const BASE_PX_PER_MM = 96 / 25.4;

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

interface PrePrintedCalibrationProps {
  layout: PrePrintedLayout;
  onLayoutChange: (layout: PrePrintedLayout) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PrePrintedCalibration({ layout, onLayoutChange, onSave, isSaving }: PrePrintedCalibrationProps) {
  const [showTemplate, setShowTemplate] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [scale, setScale] = useState(1); // default 100%

  const pxPerMm = BASE_PX_PER_MM * scale;

  const startDrag = (key: LayoutKey, e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = layout[key];

    const onMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxMm = dxPx / pxPerMm;
      const dyMm = dyPx / pxPerMm;

      onLayoutChange({
        ...layout,
        [key]: {
          ...layout[key],
          x: Math.max(0, startPos.x + dxMm),
          y: Math.max(0, startPos.y + dyMm),
        },
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleReset = () => {
    onLayoutChange(DEFAULT_PREPRINTED_LAYOUT);
    toast("Layout reset to default");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Pre-Printed Ticket Calibration
        </CardTitle>
        <CardDescription>
          Drag the labels to align with blank spaces on your pre-printed tickets. Changes are saved to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={showTemplate ? "default" : "outline"}
            onClick={() => setShowTemplate((v) => !v)}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Template
          </Button>
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid((v) => !v)}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <Button size="sm" variant="secondary" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.max(0.75, Number((s - 0.25).toFixed(2))))}
              disabled={scale <= 0.75}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.min(1.75, Number((s + 0.25).toFixed(2))))}
              disabled={scale >= 1.75}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Drag each box so its top-left matches where the printed text should start. Print with scale 100% and
          margins none. If a field is missing (e.g. amount), it may be outside the page—scroll inside the preview and
          drag it back.
        </div>

        {/* Preview area (105mm x 175mm ticket - portrait, scaled) */}
        <div
          className="relative overflow-auto rounded-md border border-border bg-background mx-auto"
          style={{ width: `${105 * scale}mm`, height: `${175 * scale}mm` }}
        >
          {/* Background photo template */}
          {showTemplate && (
            <img
              src={templateImage}
              alt="Pre-printed ticket template"
              className="absolute inset-0 h-full w-full object-contain opacity-80"
            />
          )}

          {/* Grid overlay */}
          {showGrid && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, hsl(var(--foreground) / 0.15) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.15) 1px, transparent 1px)",
                backgroundSize: `${5 * scale}mm ${5 * scale}mm`,
              }}
            />
          )}

          {/* Single horizontal cut/fold line at center */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-primary z-10 pointer-events-none"
            style={{ top: `${87.5 * scale}mm` }}
          />

          {/* Draggable handles */}
          <div className="absolute inset-0 z-20">
            {orderedKeys.map((key) => {
              const p = layout[key];
              return (
                <div
                  key={key}
                  onPointerDown={(e) => startDrag(key, e)}
                  title="Drag to move"
                  className="absolute z-20 cursor-move select-none rounded border border-primary/60 bg-background/85 px-1 py-0.5 text-[10px] font-semibold text-foreground shadow-sm"
                  style={{
                    left: `${p.x * scale}mm`,
                    top: `${p.y * scale}mm`,
                  }}
                >
                  {key}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
