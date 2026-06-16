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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Bus, CheckCircle2, Search, Package, FileText, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeatBookings, useAgents, calculateBookingAmounts, BookingType, SeatBooking } from '@/hooks/useSeatBookings';
import { useLuggageBookings, LuggageBooking } from '@/hooks/useLuggageBookings';
import { useDestinations } from '@/hooks/useDestinations';
import { useBuses } from '@/hooks/useBuses';
import { BusMemo } from '@/components/seatBookings/BusMemo';
import { LuggageDialog } from '@/components/seatBookings/LuggageDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TOTAL_SEATS = 36;
const MEMO_PASSWORD = 'safari123';

export default function SeatBookings() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [busName, setBusName] = useState('');
  const [busConfirmed, setBusConfirmed] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [editingBooking, setEditingBooking] = useState<SeatBooking | null>(null);
  
  const [luggageDialogOpen, setLuggageDialogOpen] = useState(false);
  const [editingLuggage, setEditingLuggage] = useState<LuggageBooking | null>(null);
  
  const [memoPasswordDialog, setMemoPasswordDialog] = useState(false);
  const [memoPassword, setMemoPassword] = useState('');
  const [memoPreviewOpen, setMemoPreviewOpen] = useState(false);
  
  const [companySettings, setCompanySettings] = useState<{ name: string; logoUrl: string; address: string; phone: string }>({
    name: 'ROYAL SAFARI',
    logoUrl: '',
    address: '',
    phone: '',
  });

  // Fetch company settings
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

  const { seatBookings, loading, getSeatsByDate, saveSeatBooking, markCollected, deleteSeatBooking } = useSeatBookings();
  const { luggageBookings, loading: luggageLoading, saveLuggageBooking, deleteLuggageBooking, getLuggageByDateAndBus } = useLuggageBookings();
  const { agents } = useAgents();
  const { destinations } = useDestinations();
  const { buses, loading: busesLoading } = useBuses();

  const [formData, setFormData] = useState({
    bookingType: 'self' as BookingType,
    agentId: '',
    bookingAmount: '',
    destination: '',
    passengerName: '',
    notes: '',
  });
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  // Get bookings for selected date AND bus
  const busBookings = useMemo(() => {
    if (!busConfirmed || !busName.trim()) return [];
    return getSeatsByDate(selectedDate).filter((b) => b.busName === busName.trim());
  }, [selectedDate, busName, busConfirmed, seatBookings]);

  // Get luggage for this bus
  const busLuggage = useMemo(() => {
    if (!busConfirmed || !busName.trim()) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    console.log('Filtering luggage for:', { dateStr, busName: busName.trim(), totalLuggage: luggageBookings.length });
    const filtered = getLuggageByDateAndBus(selectedDate, busName.trim());
    console.log('Filtered luggage:', filtered);
    return filtered;
  }, [selectedDate, busName, busConfirmed, luggageBookings, getLuggageByDateAndBus]);

  const getBookingForSeat = (seatNumber: number): SeatBooking | undefined => {
    return busBookings.find((b) => b.seatNumber === seatNumber);
  };

  const handleSeatClick = (seatNumber: number) => {
    const existing = getBookingForSeat(seatNumber);
    
    // If seat is booked, open edit dialog
    if (existing) {
      setEditingBooking(existing);
      setFormData({
        bookingType: existing.bookingType,
        agentId: existing.agentId || '',
        bookingAmount: existing.bookingAmount.toString(),
        destination: (existing as any).destination || '',
        passengerName: existing.passengerName || '',
        notes: existing.notes || '',
      });
      setSelectedSeat(seatNumber);
      setSelectedSeats([]);
      setDialogOpen(true);
      return;
    }
    
    // Empty seat - toggle selection (auto multi-select)
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };
  
  const handleMultiSeatBooking = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    setEditingBooking(null);
    setSelectedSeat(null);
    setFormData({
      bookingType: 'self',
      agentId: '',
      bookingAmount: '',
      destination: destinations[0]?.name || '',
      passengerName: '',
      notes: '',
    });
    setDialogOpen(true);
  };
  
  const clearSelection = () => {
    setSelectedSeats([]);
  };

  const handleSave = async () => {
    // Multi-seat booking
    const seatsToBook = selectedSeats.length > 0 ? selectedSeats : (selectedSeat ? [selectedSeat] : []);
    
    if (seatsToBook.length === 0) return;
    if (!formData.bookingAmount || parseFloat(formData.bookingAmount) <= 0) {
      toast.error('Please enter a valid booking amount');
      return;
    }
    if (formData.bookingType === 'agent' && !formData.agentId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      // Book all selected seats
      for (const seatNum of seatsToBook) {
        await saveSeatBooking({
          id: editingBooking?.id,
          journeyDate: format(selectedDate, 'yyyy-MM-dd'),
          seatNumber: seatNum,
          bookingType: formData.bookingType,
          agentId: formData.agentId || undefined,
          bookingAmount: parseFloat(formData.bookingAmount),
          commissionPercent: 0,
          ourEarning: 0,
          amountToOwner: 0,
          amountFromAgent: 0,
          originalAmountFromAgent: 0,
          agentCollectionStatus: 'pending',
          destination: formData.destination || undefined,
          busName: busName.trim(),
          passengerName: formData.passengerName || undefined,
          notes: formData.notes || undefined,
        });
      }
      
      const message = seatsToBook.length > 1 
        ? `${seatsToBook.length} seats booked successfully` 
        : (editingBooking ? 'Booking updated' : 'Seat booked successfully');
      toast.success(message);
      setDialogOpen(false);
      setSelectedSeats([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save booking');
    }
  };

  const handleDelete = async () => {
    if (!editingBooking) return;
    try {
      await deleteSeatBooking(editingBooking.id);
      toast.success('Booking deleted');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const handleMarkCollected = async () => {
    if (!editingBooking) return;
    try {
      await markCollected(editingBooking.id);
      toast.success('Marked as collected');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to mark as collected');
    }
  };

  const handleLuggageSave = async (data: { destination: string; quantity: number; totalAmount: number }) => {
    try {
      console.log('Saving luggage:', { 
        journeyDate: format(selectedDate, 'yyyy-MM-dd'),
        busName: busName.trim(),
        ...data 
      });
      await saveLuggageBooking({
        id: editingLuggage?.id,
        journeyDate: format(selectedDate, 'yyyy-MM-dd'),
        busName: busName.trim(),
        destination: data.destination,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        ourEarning: 0,
        amountToOwner: 0,
      });
      toast.success(editingLuggage ? 'Luggage updated' : 'Luggage added');
      setLuggageDialogOpen(false);
      setEditingLuggage(null);
    } catch (error: any) {
      console.error('Luggage save error:', error);
      toast.error(error.message || 'Failed to save luggage');
    }
  };

  const handleLuggageDelete = async () => {
    if (!editingLuggage) return;
    try {
      await deleteLuggageBooking(editingLuggage.id);
      toast.success('Luggage deleted');
      setLuggageDialogOpen(false);
      setEditingLuggage(null);
    } catch (error) {
      toast.error('Failed to delete luggage');
    }
  };
  // Load Royal Safari logo as data URL for the PDF header
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
    } catch (e) {
      console.warn('Logo load failed', e);
      return null;
    }
  };

  // Generate Bus Memo PDF in the same style as the Agent Collection voucher
  const generateMemoPdf = async () => {
    if (!busBookings.length && !busLuggage.length) {
      toast.error('Nothing to generate memo for');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    // Group seat bookings
    const onlineBookings = busBookings.filter((b) => b.bookingType === 'online');
    const agentBookings = busBookings.filter((b) => b.bookingType === 'agent');
    const selfBookings = busBookings.filter((b) => b.bookingType === 'self');
    const sonuBookings = busBookings.filter((b) => b.bookingType === 'sonu');
    const returnBookings = busBookings.filter((b) => b.bookingType === 'return');
    const mainBookings = [...agentBookings, ...selfBookings, ...sonuBookings];

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

    const mainGroups = groupBookings(mainBookings, 15);
    const mainTotal = mainBookings.reduce((s, b) => s + b.bookingAmount, 0);
    const mainDeduction = mainBookings.reduce((s, b) => s + b.bookingAmount * 0.15, 0);
    const mainNet = mainTotal - mainDeduction;
    const onlineCommission = onlineBookings.reduce((s, b) => s + b.ourEarning, 0);
    const returnCommission = returnBookings.reduce((s, b) => s + b.ourEarning, 0);
    const otherCommission = onlineCommission + returnCommission;
    const luggageToOwner = busLuggage.reduce((s, b) => s + b.amountToOwner, 0);
    const grandTotalToOwner = mainNet - otherCommission + luggageToOwner;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const memoNo = `M-${format(selectedDate, 'yyyyMMdd')}-${busName.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}`;

    const brand: [number, number, number] = [234, 88, 12];
    const brandDark: [number, number, number] = [124, 45, 18];
    const ink: [number, number, number] = [30, 30, 30];

    // Top brand band
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, 0, pageW, 6, 'F');

    // Logo
    const logoData = await loadLogoDataUrl();
    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 14, 10, 26, 26); } catch (e) { /* ignore */ }
    }

    // Company name & contact
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(companySettings.name || 'ROYAL SAFARI', 44, 20);
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (companySettings.address) doc.text(companySettings.address, 44, 26);
    if (companySettings.phone) doc.text(`Phone: ${companySettings.phone}`, 44, 31);

    // Divider
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.6);
    doc.line(14, 40, pageW - 14, 40);

    // Title pill
    const title = 'BUS SETTLEMENT MEMO';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const titleW = doc.getTextWidth(title) + 12;
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect((pageW - titleW) / 2, 44, titleW, 9, 2, 2, 'F');
    doc.setTextColor(255);
    doc.text(title, pageW / 2, 50.3, { align: 'center' });

    // Meta
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Memo No: ${memoNo}`, 14, 62);
    doc.text(`Date: ${format(selectedDate, 'dd MMM yyyy')}`, pageW - 14, 62, { align: 'right' });

    // Bus card
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
    doc.text(`Total Seats: ${busBookings.length}   |   Luggage Items: ${busLuggage.length}`, pageW - 16, busBoxY + 8.5, { align: 'right' });

    let currentY = busBoxY + 17;

    // Bookings table
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

    // Luggage table
    if (busLuggage.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Luggage Destination', 'Qty', 'Amount', 'To Owner']],
        body: busLuggage.map((l) => [
          l.destination,
          String(l.quantity),
          l.totalAmount.toFixed(0),
          l.amountToOwner.toFixed(0),
        ]),
        foot: [[
          { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: luggageToOwner.toFixed(0), styles: { halign: 'right', fontStyle: 'bold', textColor: brandDark as any } },
        ]],
        styles: { fontSize: 9.5, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
        footStyles: { fillColor: [255, 237, 213], textColor: brandDark as any },
        alternateRowStyles: { fillColor: [252, 250, 247] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold', textColor: brandDark as any },
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Summary card on right
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

    // Final total band
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect(pageW - 96, ly + 1, 82, 10, 1.5, 1.5, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL PAYABLE', pageW - 94, ly + 7.5);
    doc.setFontSize(12);
    doc.text(`Rs. ${grandTotalToOwner.toFixed(0)}`, pageW - 18, ly + 7.5, { align: 'right' });

    // Left note
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Online: ${onlineBookings.length}  Agent: ${agentBookings.length}  Self: ${selfBookings.length}  Sonu: ${sonuBookings.length}  Return: ${returnBookings.length}`, 14, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(110);
    doc.text('Note: 15% deducted on Agent/Self/Sonu bookings; 5% commission deducted on Online/Return.', 14, boxY + 13);

    // Footer band
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text('Generated by Royal Safari Booking System', pageW / 2, pageH - 10, { align: 'center' });

    doc.save(`Bus-Memo-${busName.replace(/[^A-Z0-9]/gi, '_')}-${format(selectedDate, 'yyyyMMdd')}.pdf`);
  };

  const handleGenerateMemo = () => {
    setMemoPassword('');
    setMemoPasswordDialog(true);
  };

  const handleMemoPasswordSubmit = async () => {
    if (memoPassword !== MEMO_PASSWORD) {
      toast.error('Incorrect password');
      return;
    }
    setMemoPasswordDialog(false);
    try {
      await generateMemoPdf();
      toast.success('Memo generated');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to generate memo');
    }
  };


  const amounts = useMemo(() => {
    const amount = parseFloat(formData.bookingAmount) || 0;
    return calculateBookingAmounts(formData.bookingType, amount);
  }, [formData.bookingType, formData.bookingAmount]);

  const busSummary = useMemo(() => {
    const online = busBookings.filter((b) => b.bookingType === 'online');
    const agent = busBookings.filter((b) => b.bookingType === 'agent');
    const self = busBookings.filter((b) => b.bookingType === 'self');
    const sonu = busBookings.filter((b) => b.bookingType === 'sonu');
    const returnBookings = busBookings.filter((b) => b.bookingType === 'return');

    return {
      total: busBookings.length,
      online: online.length,
      agent: agent.length,
      self: self.length,
      sonu: sonu.length,
      return: returnBookings.length,
      luggageCount: busLuggage.length,
    };
  }, [busBookings, busLuggage]);

  // Get all buses for this date (from settings + any with existing bookings)
  const availableBuses = useMemo(() => {
    const allBookings = getSeatsByDate(selectedDate);
    const bookingBusSet = new Set<string>();
    allBookings.forEach((b) => {
      if (b.busName) bookingBusSet.add(b.busName);
    });
    
    // Combine buses from settings with buses that have bookings
    const settingsBuses = buses.filter(b => b.active).map(b => b.name);
    const allBuses = new Set([...settingsBuses, ...bookingBusSet]);
    return Array.from(allBuses).sort();
  }, [selectedDate, seatBookings, buses]);

  if (loading || luggageLoading || busesLoading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Seat Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter bus number to view/manage seat layout
          </p>
        </div>

        {/* Date & Bus Selection */}
        <Card className="mb-6">
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
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) {
                          setSelectedDate(d);
                          setBusConfirmed(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-2 items-end">
                <Button variant="outline" size="sm" onClick={() => { setSelectedDate(addDays(selectedDate, -1)); setBusConfirmed(false); }}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedDate(new Date()); setBusConfirmed(false); }}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedDate(addDays(selectedDate, 1)); setBusConfirmed(false); }}>
                  Next
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label>Select Bus</Label>
                <Select
                  value={busName}
                  onValueChange={(v) => { setBusName(v); setBusConfirmed(true); }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBuses.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bus Layout (shown only when bus is confirmed) */}
        {busConfirmed && (
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-[280px_1fr]">
            {/* Left: Summary - on mobile shown after the seat grid */}
            <div className="space-y-4 order-2 lg:order-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    <span className="truncate">{busName} Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Booked Seats</span>
                    <span className="font-medium">{busSummary.total} / {TOTAL_SEATS}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center overflow-hidden">
                    <div className="p-1 sm:p-1.5 bg-blue-500/10 rounded overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold text-blue-600">{busSummary.online}</p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">Online</p>
                    </div>
                    <div className="p-1 sm:p-1.5 bg-amber-500/10 rounded overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold text-amber-600">{busSummary.agent}</p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">Agent</p>
                    </div>
                    <div className="p-1 sm:p-1.5 bg-green-500/10 rounded overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold text-green-600">{busSummary.self}</p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">Self</p>
                    </div>
                    <div className="p-1 sm:p-1.5 bg-pink-500/10 rounded overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold text-pink-600">{busSummary.sonu}</p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">Sonu</p>
                    </div>
                    <div className="p-1 sm:p-1.5 bg-purple-500/10 rounded overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold text-purple-600">{busSummary.return}</p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">Return</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-2 border-t">
                    <span>Luggage Items</span>
                    <span>{busSummary.luggageCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Luggage Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Luggage
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => { setEditingLuggage(null); setLuggageDialogOpen(true); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {busLuggage.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No luggage added</p>
                  ) : (
                    <div className="space-y-2">
                      {busLuggage.map((l) => (
                        <div
                          key={l.id}
                          className="flex justify-between items-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => { setEditingLuggage(l); setLuggageDialogOpen(true); }}
                        >
                          <div>
                            <p className="text-sm font-medium">{l.destination}</p>
                            <p className="text-xs text-muted-foreground">Qty: {l.quantity}</p>
                          </div>
                          <span className="text-sm font-medium">₹{l.totalAmount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate Memo Button */}
              <Button className="w-full gap-2" onClick={handleGenerateMemo} variant="default">
                <FileText className="h-4 w-4" />
                Generate Memo
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border" />
                  <span>Empty</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span>Agent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>Self</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-500" />
                  <span>Sonu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500" />
                  <span>Return</span>
                </div>
              </div>
            </div>

            {/* Right: Seat grid - shown first on mobile */}
            <Card className="order-1 lg:order-2">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{busName}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tap empty seats to select, tap booked seats to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2 max-w-sm sm:max-w-lg mx-auto">
                  {Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1).map((seatNum) => {
                    const booking = getBookingForSeat(seatNum);
                    const isSelected = selectedSeats.includes(seatNum);

                    let bgClass = 'bg-muted hover:bg-muted/80 border';
                    if (isSelected && !booking) bgClass = 'bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary ring-offset-2';
                    else if (booking?.bookingType === 'online') bgClass = 'bg-blue-500 hover:bg-blue-600 text-white';
                    else if (booking?.bookingType === 'agent') bgClass = 'bg-amber-500 hover:bg-amber-600 text-white';
                    else if (booking?.bookingType === 'self') bgClass = 'bg-green-500 hover:bg-green-600 text-white';
                    else if (booking?.bookingType === 'sonu') bgClass = 'bg-pink-500 hover:bg-pink-600 text-white';
                    else if (booking?.bookingType === 'return') bgClass = 'bg-purple-500 hover:bg-purple-600 text-white';

                    return (
                      <button
                        key={seatNum}
                        onClick={() => handleSeatClick(seatNum)}
                        className={cn(
                          'aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm font-medium transition-colors relative',
                          bgClass
                        )}
                      >
                        <span>{seatNum}</span>
                        {booking && booking.bookingType === 'agent' && booking.agentCollectionStatus === 'pending' && (
                          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Floating action bar for seat selection */}
        {selectedSeats.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}: {selectedSeats.sort((a,b) => a-b).join(', ')}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearSelection}>
                Clear
              </Button>
              <Button size="sm" onClick={handleMultiSeatBooking}>
                Book {selectedSeats.length > 1 ? 'All' : 'Seat'}
              </Button>
            </div>
          </div>
        )}

        {/* Seat Booking Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedSeats([]);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                {selectedSeats.length > 1 
                  ? `Seats ${selectedSeats.sort((a,b) => a-b).join(', ')} - ${busName}`
                  : selectedSeats.length === 1
                    ? `Seat ${selectedSeats[0]} - ${busName}`
                    : `Seat ${selectedSeat} - ${busName}`
                }
              </DialogTitle>
              <DialogDescription>
                {editingBooking 
                  ? 'Edit booking details' 
                  : selectedSeats.length > 1 
                    ? `Book ${selectedSeats.length} seats with same details`
                    : 'Add new booking'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Booking Type</Label>
                <Select
                  value={formData.bookingType}
                  onValueChange={(v) => setFormData({ ...formData, bookingType: v as BookingType, agentId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="self">Self</SelectItem>
                    <SelectItem value="sonu">Sonu</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.bookingType === 'agent' && (
                <div className="grid gap-2">
                  <Label>Agent</Label>
                  <Select
                    value={formData.agentId}
                    onValueChange={(v) => {
                      setFormData({ ...formData, agentId: v });
                      setAgentSearchQuery('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search agent..."
                            value={agentSearchQuery}
                            onChange={(e) => setAgentSearchQuery(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>
                      </div>
                      {agents
                        .filter((a) => a.active)
                        .filter((a) =>
                          !agentSearchQuery.trim() ||
                          a.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
                          a.phone?.toLowerCase().includes(agentSearchQuery.toLowerCase())
                        )
                        .map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} {agent.phone && `(${agent.phone})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Booking Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.bookingAmount}
                  onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>

              <div className="grid gap-2">
                <Label>Destination</Label>
                <Select
                  value={formData.destination}
                  onValueChange={(v) => setFormData({ ...formData, destination: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.filter((d) => d.active).map((dest) => (
                      <SelectItem key={dest.id} value={dest.name}>
                        {dest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Passenger Name (optional)</Label>
                <Input
                  value={formData.passengerName}
                  onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                  placeholder="Passenger name"
                />
              </div>

              {/* Amount breakdown - hide profit */}
              {parseFloat(formData.bookingAmount) > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 text-sm space-y-2">
                    {/* Per seat breakdown for multi-select */}
                    {selectedSeats.length > 1 && (
                      <>
                        <div className="text-xs text-muted-foreground font-medium pb-1 border-b">
                          Per Seat (×{selectedSeats.length} seats)
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Amount/seat</span>
                          <span>₹{parseFloat(formData.bookingAmount).toFixed(0)}</span>
                        </div>
                        {formData.bookingType === 'agent' && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Collect/seat</span>
                            <span>₹{amounts.amountFromAgent.toFixed(0)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs text-muted-foreground font-medium pb-1">
                            Total ({selectedSeats.length} seats)
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Total Booking Amount</span>
                      <span>₹{(parseFloat(formData.bookingAmount) * Math.max(1, selectedSeats.length)).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pay to Owner</span>
                      <span>₹{(amounts.amountToOwner * Math.max(1, selectedSeats.length)).toFixed(0)}</span>
                    </div>
                    {formData.bookingType === 'agent' && (
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>Total Collect from Agent</span>
                        <span>₹{(amounts.amountFromAgent * Math.max(1, selectedSeats.length)).toFixed(0)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {editingBooking && editingBooking.bookingType === 'agent' && editingBooking.agentCollectionStatus === 'pending' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-green-600 border-green-600"
                  onClick={handleMarkCollected}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Collected (₹{editingBooking.amountFromAgent.toFixed(0)})
                </Button>
              )}

              {editingBooking && editingBooking.agentCollectionStatus === 'collected' && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Collected on {editingBooking.collectedAt ? format(new Date(editingBooking.collectedAt), 'dd MMM yyyy') : 'N/A'}
                </Badge>
              )}
            </div>

            <DialogFooter className="gap-2">
              {editingBooking && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingBooking 
                  ? 'Update' 
                  : selectedSeats.length > 1 
                    ? `Book ${selectedSeats.length} Seats` 
                    : 'Book Seat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Luggage Dialog */}
        <LuggageDialog
          open={luggageDialogOpen}
          onOpenChange={(open) => { setLuggageDialogOpen(open); if (!open) setEditingLuggage(null); }}
          destinations={destinations}
          onSave={handleLuggageSave}
          onDelete={editingLuggage ? handleLuggageDelete : undefined}
          editingLuggage={editingLuggage}
        />

        {/* Memo Password Dialog */}
        <Dialog open={memoPasswordDialog} onOpenChange={setMemoPasswordDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Enter Password
              </DialogTitle>
              <DialogDescription>
                Enter password to generate memo
              </DialogDescription>
            </DialogHeader>
            <Input
              type="password"
              value={memoPassword}
              onChange={(e) => setMemoPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={(e) => e.key === 'Enter' && handleMemoPasswordSubmit()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setMemoPasswordDialog(false)}>Cancel</Button>
              <Button onClick={handleMemoPasswordSubmit}>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Memo Preview Dialog */}
        <Dialog open={memoPreviewOpen} onOpenChange={setMemoPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Memo Preview</DialogTitle>
              <DialogDescription>Review the memo before printing</DialogDescription>
            </DialogHeader>
            <div className="overflow-auto p-4" style={{ maxHeight: 'calc(95vh - 120px)' }}>
              <BusMemo
                date={selectedDate}
                busName={busName}
                seatBookings={busBookings}
                luggageBookings={busLuggage}
                companyName={companySettings.name}
                companyLogo={companySettings.logoUrl}
                companyAddress={companySettings.address}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMemoPreviewOpen(false)}>Close</Button>
              <Button onClick={handlePrintFromPreview}>Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden Memo for printing (off-screen so layout is preserved) */}
        <div style={{ position: 'fixed', left: '-10000px', top: 0, opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
          <BusMemo
            ref={memoRef}
            date={selectedDate}
            busName={busName}
            seatBookings={busBookings}
            luggageBookings={busLuggage}
            companyName={companySettings.name}
            companyLogo={companySettings.logoUrl}
            companyAddress={companySettings.address}
          />
        </div>
      </div>
    </Layout>
  );
}
