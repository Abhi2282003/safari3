import { useState, useEffect } from "react";
import { Save, RotateCcw, Grid3X3, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import templateImage from "@/assets/royal-preprinted-template.png";
import { DEFAULT_PREPRINTED_LAYOUT, type PrePrintedLayout } from "@/components/ticket/PrintOnPrePrintedTicket";

type LayoutKey = keyof PrePrintedLayout;

const PX_PER_MM = 96 / 25.4;

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

  const startDrag = (key: LayoutKey, e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = layout[key];

    const onMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxMm = dxPx / PX_PER_MM;
      const dyMm = dyPx / PX_PER_MM;

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
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Drag each box so its top-left matches where the printed text should start. Print with scale 100% and
          margins none. If a field is missing (e.g. amount), it may be outside the page—scroll inside the preview and
          drag it back.
        </div>

        {/* Preview area (175mm x 105mm ticket) */}
        <div
          className="relative overflow-auto rounded-md border border-border bg-background mx-auto"
          style={{ width: "175mm", height: "105mm" }}
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
                backgroundSize: "5mm 5mm",
              }}
            />
          )}

          {/* Single horizontal cut/fold line at center */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-primary z-10 pointer-events-none"
            style={{ top: "52.5mm" }}
          />

          {/* Draggable handles */}
          <div className="absolute inset-0 z-20">
            {orderedKeys.map((key) => {
              const p = layout[key];
              return (
                <div
                  key={key}
                  onPointerDown={(e) => startDrag(key, e)}
                  title="Drag to move (top-left position)"
                  className="absolute z-20 cursor-move select-none rounded border border-primary/60 bg-background/85 px-1 py-0.5 text-[10px] font-semibold text-foreground shadow-sm"
                  style={{
                    left: `${p.x}mm`,
                    top: `${p.y}mm`,
                    width: `${p.w}mm`,
                    fontSize: `${p.fontPt}pt`,
                    lineHeight: 1.1,
                    textAlign: p.align ?? "left",
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
