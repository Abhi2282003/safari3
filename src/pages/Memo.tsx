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
import { CalendarIcon, Bus, FileText, Lock, Loader2, Save, Trash2 } from 'lucide-react';
import { useSeatBookings } from '@/hooks/useSeatBookings';
import { useLuggageBookings } from '@/hooks/useLuggageBookings';
import { useLuggageRates } from '@/hooks/useLuggageRates';
import { useDestinations } from '@/hooks/useDestinations';
import { useBuses } from '@/hooks/useBuses';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MEMO_PASSWORD = 'safari123';

export default function Memo() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [busName, setBusName] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState('');



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
    const returnB = busBookings.filter((b) => b.bookingType === 'return');
    const main = [...agent, ...self, ...sonu];
    const mainTotal = main.reduce((s, b) => s + b.bookingAmount, 0);
    const mainDeduction = main.reduce((s, b) => s + b.bookingAmount * 0.15, 0);
    const mainNet = mainTotal - mainDeduction;
    const onlineCommission = online.reduce((s, b) => s + b.ourEarning, 0);
    const returnCommission = returnB.reduce((s, b) => s + b.ourEarning, 0);
    const otherCommission = onlineCommission + returnCommission;
    const luggageToOwner = busLuggage.reduce((s, b) => s + b.amountToOwner, 0);
    const grand = mainNet - otherCommission + luggageToOwner;
    return { mainTotal, mainDeduction, mainNet, otherCommission, luggageToOwner, grand, online, agent, self, sonu, returnB, main };
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

  const generateMemoPdf = async () => {
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
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, busBoxY, pageW - 28, 13, 2, 2, 'FD');
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

    let currentY = busBoxY + 17;

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
        styles: { fontSize: 9.5, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
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
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Luggage breakdown intentionally omitted from bus memo — only total is shown in summary.


    const boxY = currentY + 4;
    const lines: Array<[string, string, [number, number, number]?]> = [];
    lines.push(['Seats Subtotal', mainNet.toFixed(0)]);
    if (otherCommission > 0) lines.push(['Less (5%)', `- ${otherCommission.toFixed(0)}`, [180, 30, 30]]);
    if (luggageToOwner > 0) lines.push(['+ Luggage', `+ ${luggageToOwner.toFixed(0)}`]);
    const boxH = 14 + lines.length * 6 + 12;

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

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text('Generated by Royal Safari Booking System', pageW / 2, pageH - 10, { align: 'center' });

    doc.save(`Bus-Memo-${busName.replace(/[^A-Z0-9]/gi, '_')}-${format(selectedDate, 'yyyyMMdd')}.pdf`);
  };

  const generateLuggageMemoPdf = async () => {
    if (!busLuggage.length) {
      toast.error('No luggage entries for this bus/date');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const memoNo = `L-${format(selectedDate, 'yyyyMMdd')}-${busName.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}`;

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

    const busBoxY = 67;
    doc.setFillColor(240, 250, 245);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, busBoxY, pageW - 28, 13, 2, 2, 'FD');
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
    const totalLuggageQty2 = busLuggage.reduce((s, l) => s + (l.quantity || 0), 0);
    doc.text(`Luggage Qty: ${totalLuggageQty2}`, pageW - 16, busBoxY + 8.5, { align: 'right' });

    const luggageTotal = busLuggage.reduce((s, l) => s + l.totalAmount, 0);
    const ownerTotal = busLuggage.reduce((s, l) => s + l.amountToOwner, 0);
    const ourEarningTotal = luggageTotal - ownerTotal;

    autoTable(doc, {
      startY: busBoxY + 17,
      head: [['#', 'Party', 'Destination', 'Qty', 'Amount']],
      body: busLuggage.map((l, i) => [
        String(i + 1),
        l.partyName || '-',
        l.destination,
        String(l.quantity),
        l.totalAmount.toFixed(0),
      ]),
      foot: [[
        { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: luggageTotal.toFixed(0), styles: { halign: 'right', fontStyle: 'bold' } },
      ]],
      styles: { fontSize: 9.5, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
      footStyles: { fillColor: [220, 240, 230], textColor: brandDark as any },
      alternateRowStyles: { fillColor: [247, 252, 250] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        3: { halign: 'center' },
        4: { halign: 'right' },
      },
      theme: 'grid',
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    const boxY = finalY + 4;
    const boxH = 42;
    doc.setFillColor(240, 250, 245);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageW - 96, boxY, 82, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('LUGGAGE SUMMARY', pageW - 94, boxY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Total Collected', pageW - 94, boxY + 16);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(`Rs. ${luggageTotal.toFixed(0)}`, pageW - 18, boxY + 16, { align: 'right' });

    doc.setTextColor(180, 30, 30);
    doc.text('Less', pageW - 94, boxY + 23);
    doc.text(`- Rs. ${ourEarningTotal.toFixed(0)}`, pageW - 18, boxY + 23, { align: 'right' });

    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect(pageW - 96, boxY + boxH - 12, 82, 12, 1.5, 1.5, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NET PAYABLE', pageW - 94, boxY + boxH - 4);
    doc.setFontSize(12);
    doc.text(`Rs. ${ownerTotal.toFixed(0)}`, pageW - 18, boxY + boxH - 4, { align: 'right' });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text('Generated by Royal Safari Booking System', pageW / 2, pageH - 10, { align: 'center' });

    doc.save(`Luggage-Memo-${busName.replace(/[^A-Z0-9]/gi, '_')}-${format(selectedDate, 'yyyyMMdd')}.pdf`);
  };

  const handleGenerateMemo = async (target: 'bus' | 'luggage' = 'bus') => {
    if (!busName.trim()) {
      toast.error('Select a bus first');
      return;
    }
    try {
      if (target === 'luggage') await generateLuggageMemoPdf();
      else await generateMemoPdf();
      toast.success('Memo generated');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to generate memo');
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

  if (bookingsLoading || luggageLoading || busesLoading || ratesLoading) {
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <Button className="w-full gap-2" onClick={() => handleGenerateMemo('bus')}>
                      <FileText className="h-4 w-4" />
                      Bus Memo PDF
                    </Button>
                    <Button variant="secondary" className="w-full gap-2" onClick={() => handleGenerateMemo('luggage')} disabled={busLuggage.length === 0}>
                      <FileText className="h-4 w-4" />
                      Luggage Memo PDF
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}
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



      </div>
    </Layout>
  );
}
