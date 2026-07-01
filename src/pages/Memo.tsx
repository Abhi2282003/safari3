import { useState, useMemo, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { CalendarIcon, Bus, FileText, Lock, Loader2, Save, Trash2, Eye, Share2 } from 'lucide-react';
import { useSeatBookings } from '@/hooks/useSeatBookings';
import { useLuggageBookings } from '@/hooks/useLuggageBookings';
import { useLuggageRates } from '@/hooks/useLuggageRates';
import { useLuggageParties } from '@/hooks/useLuggageParties';
import { useDestinations } from '@/hooks/useDestinations';
import { useBuses } from '@/hooks/useBuses';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BusMemoPreview, LuggageMemoPreview } from '@/components/memo/MemoPreview';

const MEMO_PASSWORD = 'safari123';

export default function Memo() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [busName, setBusName] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState('');
  const [previewNode, setPreviewNode] = useState<React.ReactNode | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Memo Preview');



  const [companySettings, setCompanySettings] = useState({ name: 'ROYAL SAFARI', logoUrl: '', address: '', phone: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('company_settings')
        .select('name, logo_url, address, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCompanySettings({
          name: data.name || 'ROYAL SAFARI',
          logoUrl: data.logo_url || '',
          address: data.address || '',
          phone: (data as any).phone || '',
        });
      }
    };
    fetchSettings();
  }, [user]);

  const { seatBookings, loading: bookingsLoading, getSeatsByDate } = useSeatBookings();
  const { luggageBookings, loading: luggageLoading, getLuggageByDateAndBus } = useLuggageBookings();
  const { rates, loading: ratesLoading, upsertRate, deleteRate, getRateFor } = useLuggageRates();
  const { parties, loading: partiesLoading, saveParty, deleteParty } = useLuggageParties();
  const { destinations } = useDestinations();
  const { buses, loading: busesLoading } = useBuses();

  const [schedule, setSchedule] = useState<{ driverName: string; departureTime: string }>({ driverName: '', departureTime: '' });

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user || !busName.trim()) {
        setSchedule({ driverName: '', departureTime: '' });
        return;
      }
      const { data } = await supabase
        .from('bus_schedules')
        .select('driver_name, departure_time')
        .eq('user_id', user.id)
        .eq('journey_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('bus_name', busName.trim())
        .maybeSingle();
      setSchedule({
        driverName: data?.driver_name || '',
        departureTime: data?.departure_time || '',
      });
    };
    loadSchedule();
  }, [user, selectedDate, busName]);

  const busBookings = useMemo(() => {
    if (!busName.trim()) return [];
    return getSeatsByDate(selectedDate).filter((b) => b.busName === busName.trim());
  }, [selectedDate, busName, seatBookings]);

  const busLuggage = useMemo(() => {
    if (!busName.trim()) return [];
    return getLuggageByDateAndBus(selectedDate, busName.trim());
  }, [selectedDate, busName, luggageBookings, getLuggageByDateAndBus]);

  const availableBuses = useMemo(() => {
    const allBookings = getSeatsByDate(selectedDate);
    const bookingBusSet = new Set<string>();
    allBookings.forEach((b) => { if (b.busName) bookingBusSet.add(b.busName); });
    const settingsBuses = buses.filter((b) => b.active).map((b) => b.name);
    return Array.from(new Set([...settingsBuses, ...bookingBusSet])).sort();
  }, [selectedDate, seatBookings, buses]);

  // ---- Settlement preview totals ----
  const settlement = useMemo(() => {
    const online = busBookings.filter((b) => b.bookingType === 'online');
    const agent = busBookings.filter((b) => b.bookingType === 'agent');
    const self = busBookings.filter((b) => b.bookingType === 'self');
    const sonu = busBookings.filter((b) => b.bookingType === 'sonu');
    const royal = busBookings.filter((b) => b.bookingType === 'royal');
    const returnB = busBookings.filter((b) => b.bookingType === 'return');
    const main = [...agent, ...self, ...sonu, ...royal];
    const mainTotal = main.reduce((s, b) => s + b.bookingAmount, 0);
    const mainDeduction = main.reduce((s, b) => s + b.bookingAmount * 0.15, 0);
    const mainNet = mainTotal - mainDeduction;
    const onlineCommission = online.reduce((s, b) => s + b.ourEarning, 0);
    const returnCommission = returnB.reduce((s, b) => s + b.ourEarning, 0);
    const otherCommission = onlineCommission + returnCommission;
    const luggageToOwner = busLuggage.reduce((s, b) => s + b.amountToOwner, 0);
    const grand = mainNet - otherCommission + luggageToOwner;
    return { mainTotal, mainDeduction, mainNet, otherCommission, luggageToOwner, grand, online, agent, self, sonu, royal, returnB, main };
  }, [busBookings, busLuggage]);

  const loadLogoDataUrl = async (): Promise<string | null> => {
    try {
      const mod = await import('@/assets/royal-safari-logo.png.asset.json');
      const url = (mod as any).default?.url || (mod as any).url;
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generateMemoPdf = async (action: 'save' | 'preview' | 'share' = 'save') => {
    if (!busBookings.length && !busLuggage.length) {
      toast.error('Nothing to generate memo for');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const main = settlement.main;
    type Grouped = { destination: string; rate: number; seats: number[]; totalAmount: number; deduction: number; netAmount: number };
    const groupBookings = (bookings: typeof busBookings, commissionRate: number): Grouped[] => {
      const groups: Record<string, Grouped> = {};
      bookings.forEach((b) => {
        const key = `${(b as any).destination || 'Unknown'}-${b.bookingAmount}`;
        if (!groups[key]) {
          groups[key] = {
            destination: (b as any).destination || 'Unknown',
            rate: b.bookingAmount,
            seats: [],
            totalAmount: 0,
            deduction: 0,
            netAmount: 0,
          };
        }
        groups[key].seats.push(b.seatNumber);
        groups[key].totalAmount += b.bookingAmount;
        groups[key].deduction += (b.bookingAmount * commissionRate) / 100;
      });
      Object.values(groups).forEach((g) => { g.netAmount = g.totalAmount - g.deduction; });
      return Object.values(groups).sort((a, b) => a.destination.localeCompare(b.destination));
    };

    const mainGroups = groupBookings(main, 15);
    const { mainTotal, mainDeduction, mainNet, otherCommission, luggageToOwner, grand } = settlement;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const memoNo = `M-${format(selectedDate, 'yyyyMMdd')}-${busName.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}`;

    const brand: [number, number, number] = [234, 88, 12];
    const brandDark: [number, number, number] = [124, 45, 18];
    const ink: [number, number, number] = [30, 30, 30];

    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, 0, pageW, 6, 'F');

    const logoData = await loadLogoDataUrl();
    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 14, 10, 26, 26); } catch { /* ignore */ }
    }

    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(companySettings.name || 'ROYAL SAFARI', 44, 20);
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (companySettings.address) doc.text(companySettings.address, 44, 26);
    if (companySettings.phone) doc.text(`Phone: ${companySettings.phone}`, 44, 31);

    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.6);
    doc.line(14, 40, pageW - 14, 40);

    const title = 'BUS SETTLEMENT MEMO';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const titleW = doc.getTextWidth(title) + 12;
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect((pageW - titleW) / 2, 44, titleW, 9, 2, 2, 'F');
    doc.setTextColor(255);
    doc.text(title, pageW / 2, 50.3, { align: 'center' });

    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Memo No: ${memoNo}`, 14, 62);
    doc.text(`Date: ${format(selectedDate, 'dd MMM yyyy')}`, pageW - 14, 62, { align: 'right' });

    const busBoxY = 67;
    const busBoxH = (schedule.driverName || schedule.departureTime) ? 19 : 13;
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, busBoxY, pageW - 28, busBoxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('BUS', 18, busBoxY + 6);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFontSize(11);
    doc.text(busName, 18, busBoxY + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    const totalLuggageQty = busLuggage.reduce((s, l) => s + (l.quantity || 0), 0);
    doc.text(`Total Seats: ${busBookings.length}   |   Luggage Qty: ${totalLuggageQty}`, pageW - 16, busBoxY + 8.5, { align: 'right' });
    if (schedule.driverName || schedule.departureTime) {
      doc.setTextColor(60);
      const parts: string[] = [];
      if (schedule.driverName) parts.push(`Driver: ${schedule.driverName}`);
      if (schedule.departureTime) parts.push(`Time: ${schedule.departureTime}`);
      doc.text(parts.join('   |   '), 18, busBoxY + 17);
    }

    let currentY = busBoxY + busBoxH + 4;

    const pageH = doc.internal.pageSize.getHeight();
    const bottomLimit = pageH - 16;

    if (mainGroups.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Destination', 'Rate', 'Seat No.', 'Amount', 'Less', 'Net']],
        body: mainGroups.map((g) => [
          g.destination,
          g.rate.toFixed(0),
          g.seats.sort((a, b) => a - b).join(', '),
          g.totalAmount.toFixed(0),
          `- ${g.deduction.toFixed(0)}`,
          g.netAmount.toFixed(0),
        ]),
        foot: [[
          { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: mainTotal.toFixed(0), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `- ${mainDeduction.toFixed(0)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [180, 30, 30] } },
          { content: mainNet.toFixed(0), styles: { halign: 'right', fontStyle: 'bold' } },
        ]],
        styles: { fontSize: 9, cellPadding: 2.2, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
        footStyles: { fillColor: [255, 237, 213], textColor: brandDark as any },
        alternateRowStyles: { fillColor: [252, 250, 247] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', textColor: [180, 30, 30] },
          5: { halign: 'right', fontStyle: 'bold', textColor: brandDark as any },
        },
        theme: 'grid',
        margin: { left: 14, right: 14, bottom: 20 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Luggage breakdown intentionally omitted from bus memo — only total is shown in summary.

    const lines: Array<[string, string, [number, number, number]?]> = [];
    lines.push(['Seats Subtotal', mainNet.toFixed(0)]);
    if (otherCommission > 0) lines.push(['Less (5%)', `- ${otherCommission.toFixed(0)}`, [180, 30, 30]]);
    if (luggageToOwner > 0) lines.push(['+ Luggage', `+ ${luggageToOwner.toFixed(0)}`]);
    const boxH = 14 + lines.length * 6 + 12;

    let boxY = currentY + 4;
    if (boxY + boxH > bottomLimit) {
      doc.addPage();
      boxY = 20;
    }

    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageW - 96, boxY, 82, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('SETTLEMENT SUMMARY', pageW - 94, boxY + 6);

    let ly = boxY + 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    lines.forEach(([label, val, color]) => {
      doc.setTextColor(80);
      doc.text(label, pageW - 94, ly);
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      else doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text(`Rs. ${val}`, pageW - 18, ly, { align: 'right' });
      ly += 6;
    });

    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect(pageW - 96, ly + 1, 82, 10, 1.5, 1.5, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL PAYABLE', pageW - 94, ly + 7.5);
    doc.setFontSize(12);
    doc.text(`Rs. ${grand.toFixed(0)}`, pageW - 18, ly + 7.5, { align: 'right' });

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.rect(0, pageH - 6, pageW, 6, 'F');
      doc.setTextColor(110);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by Royal Safari Booking System', pageW / 2, pageH - 10, { align: 'center' });
    }

    const fileName = `Bus-Memo-${busName.replace(/[^A-Z0-9]/gi, '_')}-${format(selectedDate, 'yyyyMMdd')}.pdf`;
    await handlePdfOutput(doc, fileName, action);
  };

  const handlePdfOutput = async (doc: any, fileName: string, action: 'save' | 'share') => {
    if (action === 'save') {
      doc.save(fileName);
      return;
    }
    // share
    const blob: Blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: fileName, text: fileName });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    // Fallback: download + open WhatsApp
    doc.save(fileName);
    const text = encodeURIComponent(`${fileName} — please find the memo attached.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.message('PDF downloaded. Attach it in WhatsApp.');
  };

  const openBusPreview = () => {
    if (!busName.trim()) return toast.error('Select a bus first');
    if (!busBookings.length && !busLuggage.length) return toast.error('Nothing to preview');
    const main = settlement.main;
    const groupsMap: Record<string, { destination: string; rate: number; seats: number[]; totalAmount: number; deduction: number; netAmount: number }> = {};
    main.forEach((b) => {
      const key = `${(b as any).destination || 'Unknown'}-${b.bookingAmount}`;
      if (!groupsMap[key]) {
        groupsMap[key] = { destination: (b as any).destination || 'Unknown', rate: b.bookingAmount, seats: [], totalAmount: 0, deduction: 0, netAmount: 0 };
      }
      groupsMap[key].seats.push(b.seatNumber);
      groupsMap[key].totalAmount += b.bookingAmount;
      groupsMap[key].deduction += b.bookingAmount * 0.15;
    });
    const groups = Object.values(groupsMap).map((g) => ({ ...g, netAmount: g.totalAmount - g.deduction })).sort((a, b) => a.destination.localeCompare(b.destination));
    const totalLuggageQty = busLuggage.reduce((s, l) => s + (l.quantity || 0), 0);
    const memoNo = `M-${format(selectedDate, 'yyyyMMdd')}-${busName.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}`;
    setPreviewTitle(`Bus Memo — ${busName} — ${format(selectedDate, 'dd MMM yyyy')}`);
    setPreviewNode(
      <BusMemoPreview
        company={companySettings}
        date={selectedDate}
        busName={busName}
        memoNo={memoNo}
        schedule={schedule}
        totalSeats={busBookings.length}
        totalLuggageQty={totalLuggageQty}
        groups={groups}
        mainTotal={settlement.mainTotal}
        mainDeduction={settlement.mainDeduction}
        mainNet={settlement.mainNet}
        otherCommission={settlement.otherCommission}
        luggageToOwner={settlement.luggageToOwner}
        grand={settlement.grand}
      />
    );
  };

  const openLuggagePreview = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayLuggage = luggageBookings.filter((b) => b.journeyDate === dateStr);
    if (!dayLuggage.length) return toast.error('No luggage entries for this date');
    const busMap: Record<string, typeof dayLuggage> = {};
    dayLuggage.forEach((l) => {
      const k = l.busName || 'Unassigned';
      if (!busMap[k]) busMap[k] = [];
      busMap[k].push(l);
    });
    const buses = Object.keys(busMap).sort().map((bn) => {
      const items = busMap[bn];
      return {
        busName: bn,
        items: items.map((l) => ({
          partyName: l.partyName,
          destination: l.destination,
          itemName: l.itemName,
          quantity: l.quantity,
          totalAmount: l.totalAmount,
          amountToOwner: l.amountToOwner,
        })),
        busTotal: items.reduce((s, l) => s + l.totalAmount, 0),
        busQty: items.reduce((s, l) => s + (l.quantity || 0), 0),
      };
    });
    const grandTotal = buses.reduce((s, b) => s + b.busTotal, 0);
    const grandOwner = dayLuggage.reduce((s, l) => s + l.amountToOwner, 0);
    const memoNo = `L-${format(selectedDate, 'yyyyMMdd')}-ALL`;
    setPreviewTitle(`Luggage Memo — ${format(selectedDate, 'dd MMM yyyy')}`);
    setPreviewNode(
      <LuggageMemoPreview
        company={companySettings}
        date={selectedDate}
        memoNo={memoNo}
        buses={buses}
        grandTotal={grandTotal}
        grandOwner={grandOwner}
      />
    );
  };

  const generateLuggageMemoPdf = async () => {
    // Combined luggage memo across all buses for the selected date, bifurcated per bus.
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayLuggage = luggageBookings.filter((b) => b.journeyDate === dateStr);
    if (!dayLuggage.length) {
      toast.error('No luggage entries for this date');
      return;
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const memoNo = `L-${format(selectedDate, 'yyyyMMdd')}-ALL`;

    const brand: [number, number, number] = [13, 110, 80];
    const brandDark: [number, number, number] = [6, 70, 50];
    const ink: [number, number, number] = [30, 30, 30];

    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, 0, pageW, 6, 'F');

    const logoData = await loadLogoDataUrl();
    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 14, 10, 26, 26); } catch { /* ignore */ }
    }

    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(companySettings.name || 'ROYAL SAFARI', 44, 20);
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (companySettings.address) doc.text(companySettings.address, 44, 26);
    if (companySettings.phone) doc.text(`Phone: ${companySettings.phone}`, 44, 31);

    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.6);
    doc.line(14, 40, pageW - 14, 40);

    const title = 'LUGGAGE MEMO';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const titleW = doc.getTextWidth(title) + 12;
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect((pageW - titleW) / 2, 44, titleW, 9, 2, 2, 'F');
    doc.setTextColor(255);
    doc.text(title, pageW / 2, 50.3, { align: 'center' });

    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Memo No: ${memoNo}`, 14, 62);
    doc.text(`Date: ${format(selectedDate, 'dd MMM yyyy')}`, pageW - 14, 62, { align: 'right' });

    // Group by bus
    const busMap: Record<string, typeof dayLuggage> = {};
    dayLuggage.forEach((l) => {
      const k = l.busName || 'Unassigned';
      if (!busMap[k]) busMap[k] = [];
      busMap[k].push(l);
    });
    const busKeys = Object.keys(busMap).sort();

    let cursorY = 68;
    let grandTotal = 0;
    let grandOwner = 0;
    let grandQty = 0;

    for (const bus of busKeys) {
      const items = busMap[bus];
      const busTotal = items.reduce((s, l) => s + l.totalAmount, 0);
      const busOwner = items.reduce((s, l) => s + l.amountToOwner, 0);
      const busQty = items.reduce((s, l) => s + (l.quantity || 0), 0);
      grandTotal += busTotal;
      grandOwner += busOwner;
      grandQty += busQty;

      // Bus header
      if (cursorY + 12 > pageH - 25) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFillColor(240, 250, 245);
      doc.setDrawColor(brand[0], brand[1], brand[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, cursorY, pageW - 28, 9, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.text(`BUS: ${bus}`, 18, cursorY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Qty: ${busQty}   |   Amount: Rs. ${busTotal.toFixed(0)}`, pageW - 18, cursorY + 6, { align: 'right' });
      cursorY += 11;

      autoTable(doc, {
        startY: cursorY,
        head: [['#', 'Party', 'Destination', 'Item', 'Qty', 'Amount']],
        body: items.map((l, i) => [
          String(i + 1),
          l.partyName || '-',
          l.destination,
          l.itemName || '-',
          String(l.quantity),
          l.totalAmount.toFixed(0),
        ]),
        foot: [[
          { content: 'BUS TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: busTotal.toFixed(0), styles: { halign: 'right', fontStyle: 'bold' } },
        ]],
        styles: { fontSize: 9, cellPadding: 2.2, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
        footStyles: { fillColor: [220, 240, 230], textColor: brandDark as any },
        alternateRowStyles: { fillColor: [247, 252, 250] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          4: { halign: 'center' },
          5: { halign: 'right' },
        },
        theme: 'grid',
        margin: { left: 14, right: 14, bottom: 20 },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    }

    const grandOurEarning = grandTotal - grandOwner;
    const summaryBoxH = 42;
    const bottomLimit = pageH - 16;
    let boxY = cursorY + 4;
    if (boxY + summaryBoxH > bottomLimit) {
      doc.addPage();
      boxY = 20;
    }
    doc.setFillColor(240, 250, 245);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageW - 96, boxY, 82, summaryBoxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('GRAND SUMMARY', pageW - 94, boxY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Total Collected', pageW - 94, boxY + 16);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(`Rs. ${grandTotal.toFixed(0)}`, pageW - 18, boxY + 16, { align: 'right' });

    doc.setTextColor(180, 30, 30);
    doc.text('Less', pageW - 94, boxY + 23);
    doc.text(`- Rs. ${grandOurEarning.toFixed(0)}`, pageW - 18, boxY + 23, { align: 'right' });

    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect(pageW - 96, boxY + summaryBoxH - 12, 82, 12, 1.5, 1.5, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NET PAYABLE', pageW - 94, boxY + summaryBoxH - 4);
    doc.setFontSize(12);
    doc.text(`Rs. ${grandOwner.toFixed(0)}`, pageW - 18, boxY + summaryBoxH - 4, { align: 'right' });

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.rect(0, pageH - 6, pageW, 6, 'F');
      doc.setTextColor(110);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by Royal Safari Booking System', pageW / 2, pageH - 10, { align: 'center' });
    }

    doc.save(`Luggage-Memo-${format(selectedDate, 'yyyyMMdd')}.pdf`);
  };


  const handleGenerateMemo = async (target: 'bus' | 'luggage' = 'bus', action: 'save' | 'preview' | 'share' = 'save') => {
    if (target === 'bus' && !busName.trim()) {
      toast.error('Select a bus first');
      return;
    }
    try {
      if (target === 'luggage') await generateLuggageMemoPdf();
      else await generateMemoPdf(action);
      if (action === 'save') toast.success('Memo generated');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to generate memo');
    }
  };

  // ---- Luggage parties UI state ----
  const [newParty, setNewParty] = useState({ partyName: '', destination: '', itemName: '', rate: '' });
  const [editParty, setEditParty] = useState<Record<string, { destination: string; itemName: string; rate: string }>>({});

  const handleAddParty = async () => {
    if (!newParty.partyName.trim()) return toast.error('Enter a party name');
    if (!newParty.destination) return toast.error('Select a destination');
    if (!newParty.itemName.trim()) return toast.error('Enter an item name');
    const r = parseFloat(newParty.rate);
    if (!r || r <= 0) return toast.error('Enter a valid rate');
    try {
      await saveParty({
        partyName: newParty.partyName.trim(),
        destination: newParty.destination,
        itemName: newParty.itemName.trim(),
        rate: r,
      });
      setNewParty({ partyName: '', destination: '', itemName: '', rate: '' });
      toast.success('Party saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save party');
    }
  };

  const handleUpdateParty = async (id: string, partyName: string) => {
    const e = editParty[id];
    if (!e) return;
    const r = parseFloat(e.rate);
    if (!e.destination || !e.itemName.trim() || !r || r <= 0) return toast.error('Fill destination, item and rate');
    try {
      await saveParty({ id, partyName, destination: e.destination, itemName: e.itemName.trim(), rate: r });
      setEditParty((s) => { const n = { ...s }; delete n[id]; return n; });
      toast.success('Party updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };




  // ---- Luggage rates UI state ----
  const [newDest, setNewDest] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editRates, setEditRates] = useState<Record<string, string>>({});

  const handleAddRate = async () => {
    if (!newDest) return toast.error('Select a destination');
    if (!newItem.trim()) return toast.error('Enter an item name');
    const r = parseFloat(newRate);
    if (!r || r <= 0) return toast.error('Enter a valid rate');
    try {
      await upsertRate(newDest, newItem.trim(), r);
      setNewDest('');
      setNewItem('');
      setNewRate('');
      toast.success('Rate saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save rate');
    }
  };

  const handleUpdateRate = async (id: string, destination: string, itemName: string) => {
    const val = parseFloat(editRates[id]);
    if (!val || val <= 0) return toast.error('Enter a valid rate');
    try {
      await upsertRate(destination, itemName, val);
      setEditRates((s) => ({ ...s, [id]: '' }));
      toast.success('Rate updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update rate');
    }
  };

  if (bookingsLoading || luggageLoading || busesLoading || ratesLoading || partiesLoading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!unlocked) {
    const tryUnlock = () => {
      if (gatePassword === MEMO_PASSWORD) {
        setUnlocked(true);
        setGatePassword('');
      } else {
        toast.error('Incorrect password');
      }
    };
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Memo Access
              </CardTitle>
              <CardDescription>Enter password to access the Memo page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
                autoFocus
              />
              <Button className="w-full" onClick={tryUnlock}>Unlock</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Memo</h1>
          <p className="text-sm text-muted-foreground mt-1">Bus owner hisab, memo generation, and luggage rates</p>
        </div>

        <Tabs defaultValue="memo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="memo">Bus Owner Hisab</TabsTrigger>
            <TabsTrigger value="parties">Luggage Parties</TabsTrigger>
            <TabsTrigger value="rates">Luggage Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="memo" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Date & Bus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label>Journey Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2 mt-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(selectedDate, 'EEE, dd MMM yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2 items-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>Prev</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>Next</Button>
                  </div>
                </div>

                <div>
                  <Label>Select Bus</Label>
                  <Select value={busName} onValueChange={setBusName}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBuses.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {busName && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    {busName} — Settlement Preview
                  </CardTitle>
                  <CardDescription>
                    {busBookings.length} seats · {busLuggage.length} luggage items
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seats Subtotal (after 15% / 5%)</span>
                    <span className="font-medium">₹{settlement.mainNet.toFixed(0)}</span>
                  </div>
                  {settlement.otherCommission > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Less Online/Return Commission (5%)</span>
                      <span>- ₹{settlement.otherCommission.toFixed(0)}</span>
                    </div>
                  )}
                  {settlement.luggageToOwner > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+ Luggage to Owner</span>
                      <span>+ ₹{settlement.luggageToOwner.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t text-base">
                    <span className="font-semibold">Total Payable to Owner</span>
                    <span className="font-bold text-primary">₹{settlement.grand.toFixed(0)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <Button className="w-full gap-2" onClick={() => handleGenerateMemo('bus', 'save')}>
                      <FileText className="h-4 w-4" />
                      Bus Memo PDF
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateMemo('bus', 'preview')}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateMemo('bus', 'share')}>
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Combined Luggage Memo across all buses for selected date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Luggage Memo (All Buses)</CardTitle>
                <CardDescription>
                  Single luggage memo for {format(selectedDate, 'dd MMM yyyy')}, bifurcated by bus.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  onClick={() => handleGenerateMemo('luggage')}
                  disabled={luggageBookings.filter((b) => b.journeyDate === format(selectedDate, 'yyyy-MM-dd')).length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Combined Luggage Memo PDF
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Luggage Party</CardTitle>
                <CardDescription>Save regular parties with their city, item, and rate. Then just pick + quantity when adding luggage.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <Label>Party Name</Label>
                  <Input value={newParty.partyName} onChange={(e) => setNewParty({ ...newParty, partyName: e.target.value })} placeholder="e.g., Sharma Traders" className="mt-1" />
                </div>
                <div>
                  <Label>Destination / City</Label>
                  <Select value={newParty.destination} onValueChange={(v) => setNewParty({ ...newParty, destination: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {destinations.filter((d) => d.active).map((d) => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input value={newParty.itemName} onChange={(e) => setNewParty({ ...newParty, itemName: e.target.value })} placeholder="e.g., Box, Bag" className="mt-1" />
                </div>
                <div>
                  <Label>Rate per item (₹)</Label>
                  <Input type="number" min="0" value={newParty.rate} onChange={(e) => setNewParty({ ...newParty, rate: e.target.value })} placeholder="e.g., 150" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={handleAddParty} className="gap-2"><Save className="h-4 w-4" /> Save Party</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configured Parties</CardTitle>
              </CardHeader>
              <CardContent>
                {parties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No parties configured yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="w-72">Edit</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parties.map((p) => {
                        const e = editParty[p.id];
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.partyName}</TableCell>
                            <TableCell>{p.destination}</TableCell>
                            <TableCell>{p.itemName}</TableCell>
                            <TableCell className="text-right">₹{p.rate.toFixed(0)}</TableCell>
                            <TableCell>
                              {e ? (
                                <div className="flex gap-1">
                                  <Select value={e.destination} onValueChange={(v) => setEditParty((s) => ({ ...s, [p.id]: { ...s[p.id], destination: v } }))}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {destinations.filter((d) => d.active).map((d) => (
                                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input className="h-8 w-20" value={e.itemName} onChange={(ev) => setEditParty((s) => ({ ...s, [p.id]: { ...s[p.id], itemName: ev.target.value } }))} placeholder="Item" />
                                  <Input className="h-8 w-20" type="number" value={e.rate} onChange={(ev) => setEditParty((s) => ({ ...s, [p.id]: { ...s[p.id], rate: ev.target.value } }))} placeholder="Rate" />
                                  <Button size="sm" variant="outline" onClick={() => handleUpdateParty(p.id, p.partyName)}>Save</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setEditParty((s) => ({ ...s, [p.id]: { destination: p.destination, itemName: p.itemName, rate: String(p.rate) } }))}>Edit</Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={async () => {
                                  try { await deleteParty(p.id); toast.success('Party removed'); }
                                  catch (e: any) { toast.error(e.message || 'Failed'); }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add / Update Luggage Rate</CardTitle>
                <CardDescription>Configure rates per item per destination. Used automatically when adding luggage.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Label>Destination</Label>
                  <Select value={newDest} onValueChange={setNewDest}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.filter((d) => d.active).map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 w-full">
                  <Label>Item Name</Label>
                  <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g., Bag, Box" className="mt-1" />
                </div>
                <div className="w-full sm:w-40">
                  <Label>Rate per item (₹)</Label>
                  <Input type="number" min="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="e.g., 100" className="mt-1" />
                </div>
                <Button onClick={handleAddRate} className="gap-2">
                  <Save className="h-4 w-4" /> Save Rate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configured Rates</CardTitle>
              </CardHeader>
              <CardContent>
                {rates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rates configured yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destination</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Current Rate</TableHead>
                        <TableHead className="w-48">Update</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.destination}</TableCell>
                          <TableCell>{r.itemName}</TableCell>
                          <TableCell className="text-right">₹{r.rate.toFixed(0)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={editRates[r.id] ?? ''}
                                onChange={(e) => setEditRates((s) => ({ ...s, [r.id]: e.target.value }))}
                                placeholder="New rate"
                              />
                              <Button size="sm" variant="outline" onClick={() => handleUpdateRate(r.id, r.destination, r.itemName)}>
                                Save
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={async () => {
                                try { await deleteRate(r.id); toast.success('Rate removed'); }
                                catch (e: any) { toast.error(e.message || 'Failed'); }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        <Dialog
          open={!!previewUrl}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
              });
            }
          }}
        >
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
            <DialogHeader className="px-4 py-3 border-b">
              <DialogTitle className="text-base truncate">{previewTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 bg-muted">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full border-0"
                />
              )}
            </div>
            <DialogFooter className="px-4 py-3 border-t gap-2">
              {previewUrl && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    Open in new tab
                  </Button>
                  <a href={previewUrl} download={previewTitle} className="inline-flex">
                    <Button>Download</Button>
                  </a>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>

  );
}
