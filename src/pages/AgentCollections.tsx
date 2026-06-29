import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, CheckCircle2, Clock, Phone, IndianRupee, Search, ArrowUpDown, Bus, Wallet, CreditCard, User, MessageCircle, Send } from 'lucide-react';
import { useSeatBookings, useAgents, SeatBooking } from '@/hooks/useSeatBookings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentPayment {
  id: string;
  agentId: string;
  amountPaid: number;
  receivedBy: string;
  paymentMode: string;
  paymentDate: string;
  notes: string | null;
}

interface AgentWithCollections {
  id: string;
  name: string;
  phone?: string;
  advanceBalance: number;
  bookings: SeatBooking[];
  payments: AgentPayment[];
  totalPending: number;
  totalCollected: number;
  originalTotal: number;
}

type SortOption = 'pending-desc' | 'pending-asc' | 'name-asc' | 'name-desc' | 'collected-desc';
type TabType = 'pending' | 'received';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

export default function AgentCollections() {
  const { user } = useAuth();
  const { seatBookings, loading, fetchSeatBookings } = useSeatBookings();
  const { agents, fetchAgents } = useAgents();
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithCollections | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<SeatBooking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('pending-desc');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [receivedDate, setReceivedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [agentPayments, setAgentPayments] = useState<AgentPayment[]>([]);
  const [seatPaymentDialogOpen, setSeatPaymentDialogOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; phone: string; address: string }>({
    name: '', phone: '', address: ''
  });

  // Fetch company info for voucher header
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('company_settings')
        .select('name, phone, address')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCompanyInfo({
          name: data.name || 'ROYAL TRAVELS',
          phone: data.phone || '',
          address: data.address || '',
        });
      }
    };
    fetchSettings();
  }, [user]);

  // Fetch agent payments
  useEffect(() => {
    const fetchAgentPayments = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('agent_collection_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });
      
      if (!error && data) {
        setAgentPayments(data.map(p => ({
          id: p.id,
          agentId: p.agent_id,
          amountPaid: p.amount_paid,
          receivedBy: p.received_by,
          paymentMode: p.payment_mode,
          paymentDate: p.payment_date,
          notes: p.notes,
        })));
      }
    };
    
    fetchAgentPayments();
  }, [user, seatBookings]); // Refetch when seatBookings changes (after payment)

  // Group bookings by agent with pending collections
  const agentCollections = useMemo(() => {
    const agentMap = new Map<string, AgentWithCollections>();

    // Initialize with all agents that have bookings
    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId)
      .forEach((booking) => {
        const agentId = booking.agentId!;
        if (!agentMap.has(agentId)) {
          const agent = agents.find(a => a.id === agentId);
          const payments = agentPayments.filter(p => p.agentId === agentId);
          agentMap.set(agentId, {
            id: agentId,
            name: booking.agentName || agent?.name || 'Unknown',
            phone: agent?.phone,
            advanceBalance: (agent as any)?.advanceBalance || 0,
            bookings: [],
            payments: payments,
            totalPending: 0,
            totalCollected: 0,
            originalTotal: 0,
          });
        }

        const agentData = agentMap.get(agentId)!;
        const originalAmount = booking.originalAmountFromAgent || booking.amountFromAgent;
        agentData.bookings.push(booking);
        agentData.originalTotal += originalAmount;
        
        if (booking.agentCollectionStatus === 'pending') {
          agentData.totalPending += booking.amountFromAgent;
        } else {
          agentData.totalCollected += originalAmount;
        }
        
        // Add partial collection (original - remaining for pending items)
        if (booking.agentCollectionStatus === 'pending' && originalAmount > booking.amountFromAgent) {
          agentData.totalCollected += (originalAmount - booking.amountFromAgent);
        }
      });

    // Show agents with pending collections OR advance balance
    let results = Array.from(agentMap.values());
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.phone?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'pending-desc':
        results.sort((a, b) => b.totalPending - a.totalPending);
        break;
      case 'pending-asc':
        results.sort((a, b) => a.totalPending - b.totalPending);
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'collected-desc':
        results.sort((a, b) => b.totalCollected - a.totalCollected);
        break;
    }
    
    return results;
  }, [seatBookings, agents, agentPayments, searchQuery, sortBy]);

  // Filter agents based on active tab
  const pendingAgents = useMemo(() => {
    return agentCollections.filter(a => a.totalPending > 0 || a.advanceBalance > 0);
  }, [agentCollections]);

  const receivedAgents = useMemo(() => {
    return agentCollections.filter(a => a.totalCollected > 0);
  }, [agentCollections]);

  // Load logo as data URL (cached)
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

  // Generate a Pending Collection Voucher PDF for an agent
  const generateVoucherPdf = async (agent: AgentWithCollections) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const pendingBookings = agent.bookings
      .filter(b => b.agentCollectionStatus === 'pending')
      .sort((a, b) => a.journeyDate.localeCompare(b.journeyDate) || a.seatNumber - b.seatNumber);

    if (pendingBookings.length === 0) {
      toast.error('No pending bookings for this agent');
      return;
    }

    // Group bookings by journey date + bus + destination (seats booked together)
    const groupsMap = new Map<string, SeatBooking[]>();
    pendingBookings.forEach(b => {
      const key = `${b.journeyDate}|${b.busName || b.travelsName || ''}|${b.destination || ''}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(b);
    });
    const groups = Array.from(groupsMap.values()).map(seats => {
      seats.sort((a, b) => a.seatNumber - b.seatNumber);
      const actualFare = seats.reduce((s, b) => s + b.bookingAmount, 0);
      const toCollect = seats.reduce((s, b) => s + b.amountFromAgent, 0);
      const commission = actualFare - toCollect;
      return { seats, actualFare, commission, toCollect };
    });

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const today = format(new Date(), 'dd MMM yyyy');
    const voucherNo = `V-${format(new Date(), 'yyyyMMdd')}-${agent.id.slice(0, 6).toUpperCase()}`;

    // Brand colors (Royal Safari sunset orange)
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
    doc.text(companyInfo.name || 'ROYAL SAFARI', 44, 20);

    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (companyInfo.address) doc.text(companyInfo.address, 44, 26);
    if (companyInfo.phone) doc.text(`Phone: ${companyInfo.phone}`, 44, 31);

    // Divider
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.6);
    doc.line(14, 40, pageW - 14, 40);

    // Title pill
    const title = 'PENDING COLLECTION VOUCHER';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const titleW = doc.getTextWidth(title) + 12;
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.roundedRect((pageW - titleW) / 2, 44, titleW, 9, 2, 2, 'F');
    doc.setTextColor(255);
    doc.text(title, pageW / 2, 50.3, { align: 'center' });

    // Voucher meta
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Voucher No: ${voucherNo}`, 14, 62);
    doc.text(`Date: ${today}`, pageW - 14, 62, { align: 'right' });

    // Agent details card
    const agentBoxY = 67;
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, agentBoxY, pageW - 28, agent.phone ? 18 : 13, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('BILL TO', 18, agentBoxY + 6);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFontSize(11);
    doc.text(agent.name, 18, agentBoxY + 12);
    if (agent.phone) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Phone: ${agent.phone}`, 18, agentBoxY + 16.5);
    }

    // Build table rows
    const body: any[] = groups.map((g, idx) => {
      const first = g.seats[0];
      const seatList = g.seats.map(s => s.seatNumber).join(', ');
      return [
        String(idx + 1),
        format(new Date(first.journeyDate), 'dd MMM yyyy'),
        first.busName || first.travelsName || '-',
        first.destination || '-',
        seatList,
        g.actualFare.toFixed(2),
        `- ${g.commission.toFixed(2)}`,
        g.toCollect.toFixed(2),
      ];
    });
    const totalActual = groups.reduce((s, g) => s + g.actualFare, 0);
    const totalCommission = groups.reduce((s, g) => s + g.commission, 0);
    const totalCollect = groups.reduce((s, g) => s + g.toCollect, 0);

    autoTable(doc, {
      startY: agentBoxY + (agent.phone ? 22 : 17),
      head: [['#', 'Journey Date', 'Bus', 'Destination', 'Seats', 'Actual Fare', 'Commission', 'To Collect']],
      body,
      foot: [[
        { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
        { content: totalActual.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `- ${totalCommission.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [180, 30, 30] } },
        { content: totalCollect.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      ]],
      styles: { fontSize: 9.5, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
      footStyles: { fillColor: [255, 237, 213], textColor: brandDark as any },
      alternateRowStyles: { fillColor: [252, 250, 247] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'right' },
        6: { halign: 'right', textColor: [180, 30, 30] },
        7: { halign: 'right', fontStyle: 'bold', textColor: brandDark as any },
      },
      theme: 'grid',
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 90;

    // Summary card (right) - styled like Bill To card
    const boxY = finalY + 10;
    const boxH = agent.advanceBalance > 0 ? 34 : 20;
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageW - 90, boxY, 76, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('NET AMOUNT TO COLLECT', pageW - 88, boxY + 6);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFontSize(15);
    doc.text(
      `Rs. ${Math.max(0, totalCollect - agent.advanceBalance).toFixed(2)}`,
      pageW - 16,
      boxY + 14,
      { align: 'right' }
    );
    if (agent.advanceBalance > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90);
      doc.text(`Pending: Rs. ${totalCollect.toFixed(2)}`, pageW - 88, boxY + 22);
      doc.text(`Less Advance: Rs. ${agent.advanceBalance.toFixed(2)}`, pageW - 88, boxY + 28);
    }


    // Left meta
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Total Seats: ${pendingBookings.length}`, 14, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(110);
    doc.text('Note: Commission already deducted from amount payable.', 14, boxY + 13);

    // Footer band
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text(
      'Please arrange the payment at your earliest convenience. Thank you for your business.',
      pageW / 2,
      pageH - 10,
      { align: 'center' }
    );

    const safeName = agent.name.replace(/[^a-z0-9]+/gi, '_');
    doc.save(`Voucher_${safeName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };




  const summary = useMemo(() => {
    let totalPending = 0;
    let totalCollected = 0;
    let agentsWithPending = 0;
    let totalAdvance = 0;
    
    const agentPendingMap = new Map<string, number>();
    
    seatBookings
      .filter((b) => b.bookingType === 'agent' && b.agentId)
      .forEach((booking) => {
        const originalAmount = booking.originalAmountFromAgent || booking.amountFromAgent;
        
        if (booking.agentCollectionStatus === 'pending') {
          totalPending += booking.amountFromAgent;
          if (originalAmount > booking.amountFromAgent) {
            totalCollected += (originalAmount - booking.amountFromAgent);
          }
          agentPendingMap.set(booking.agentId!, (agentPendingMap.get(booking.agentId!) || 0) + 1);
        } else {
          totalCollected += originalAmount;
        }
      });
    
    agentsWithPending = agentPendingMap.size;
    totalAdvance = agents.reduce((sum, a) => sum + ((a as any).advanceBalance || 0), 0);
    
    return { totalPending, totalCollected, agentsWithPending, totalAdvance };
  }, [seatBookings, agents]);

  const handleOpenPayment = (agent: AgentWithCollections) => {
    setSelectedAgent(agent);
    setSelectedBooking(null);
    setPaymentAmount(agent.totalPending.toString());
    setReceivedBy('');
    setPaymentMode('Cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handleOpenSeatPayment = (agent: AgentWithCollections, booking: SeatBooking) => {
    setSelectedAgent(agent);
    setSelectedBooking(booking);
    setPaymentAmount(booking.amountFromAgent.toString());
    setReceivedBy('');
    setPaymentMode('Cash');
    setPaymentNotes('');
    setSeatPaymentDialogOpen(true);
  };

  const handleSeatPayment = async () => {
    if (!selectedAgent || !selectedBooking || !user) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!receivedBy.trim()) {
      toast.error('Please enter receiver name');
      return;
    }

    if (amount > selectedBooking.amountFromAgent) {
      toast.error('Amount cannot exceed pending amount');
      return;
    }

    setIsProcessing(true);

    try {
      const isFullPayment = amount >= selectedBooking.amountFromAgent;
      
      if (isFullPayment) {
        // Mark booking as collected
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            agent_collection_status: 'collected',
            collected_at: new Date().toISOString(),
          })
          .eq('id', selectedBooking.id);

        if (error) throw error;
      } else {
        // Partial payment - reduce the pending amount
        const newAmountFromAgent = selectedBooking.amountFromAgent - amount;
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            amount_from_agent: newAmountFromAgent,
          })
          .eq('id', selectedBooking.id);

        if (error) throw error;
      }

      // Record the payment
      const { error: paymentError } = await supabase
        .from('agent_collection_payments')
        .insert({
          user_id: user.id,
          agent_id: selectedAgent.id,
          amount_paid: amount,
          received_by: receivedBy.trim(),
          payment_mode: paymentMode,
          notes: paymentNotes.trim() || `Seat #${selectedBooking.seatNumber}`,
        });

      if (paymentError) throw paymentError;

      toast.success(`₹${amount.toFixed(0)} collected for Seat #${selectedBooking.seatNumber}`);
      setSeatPaymentDialogOpen(false);
      setPaymentAmount('');
      setReceivedBy('');
      setPaymentNotes('');
      setSelectedBooking(null);
      fetchSeatBookings();
      fetchAgents();
    } catch (error) {
      console.error('Error processing seat payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedAgent || !user) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!receivedBy.trim()) {
      toast.error('Please enter receiver name');
      return;
    }

    setIsProcessing(true);

    try {
      const effectivePending = selectedAgent.totalPending - selectedAgent.advanceBalance;
      const isAdvancePayment = amount > effectivePending;
      let amountToApply = amount;
      let newAdvanceBalance = selectedAgent.advanceBalance;

      // If there's existing advance, use it first
      if (selectedAgent.advanceBalance > 0) {
        amountToApply += selectedAgent.advanceBalance;
        newAdvanceBalance = 0;
      }

      // Get pending bookings sorted by date (oldest first)
      const pendingBookings = selectedAgent.bookings
        .filter(b => b.agentCollectionStatus === 'pending')
        .sort((a, b) => new Date(a.journeyDate).getTime() - new Date(b.journeyDate).getTime());

      let remainingAmount = amountToApply;
      const fullyPaidBookingIds: string[] = [];
      const partialPaymentUpdates: { id: string; newAmountFromAgent: number }[] = [];

      // Process bookings
      for (const booking of pendingBookings) {
        if (remainingAmount <= 0) break;
        
        if (remainingAmount >= booking.amountFromAgent) {
          fullyPaidBookingIds.push(booking.id);
          remainingAmount -= booking.amountFromAgent;
        } else {
          const newAmountFromAgent = booking.amountFromAgent - remainingAmount;
          partialPaymentUpdates.push({ id: booking.id, newAmountFromAgent });
          remainingAmount = 0;
        }
      }

      // If there's remaining amount after all bookings, it's advance
      if (remainingAmount > 0) {
        newAdvanceBalance = remainingAmount;
      }

      // Update fully paid bookings
      if (fullyPaidBookingIds.length > 0) {
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            agent_collection_status: 'collected',
            collected_at: new Date().toISOString(),
          })
          .in('id', fullyPaidBookingIds);

        if (error) throw error;
      }

      // Update partial payment bookings
      for (const update of partialPaymentUpdates) {
        const { error } = await supabase
          .from('seat_bookings')
          .update({
            amount_from_agent: update.newAmountFromAgent,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update agent's advance balance
      const { error: agentError } = await supabase
        .from('agents')
        .update({ advance_balance: newAdvanceBalance })
        .eq('id', selectedAgent.id);

      if (agentError) throw agentError;

      // Record the payment
      const { error: paymentError } = await supabase
        .from('agent_collection_payments')
        .insert({
          user_id: user.id,
          agent_id: selectedAgent.id,
          amount_paid: amount,
          received_by: receivedBy.trim(),
          payment_mode: paymentMode,
          notes: paymentNotes.trim() || null,
        });

      if (paymentError) throw paymentError;

      const message = newAdvanceBalance > 0 
        ? `₹${amount.toFixed(0)} collected. Advance balance: ₹${newAdvanceBalance.toFixed(0)}`
        : `₹${amount.toFixed(0)} collected from ${selectedAgent.name}`;
      
      toast.success(message);
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setReceivedBy('');
      setPaymentNotes('');
      fetchSeatBookings();
      fetchAgents();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllCollected = async (agent: AgentWithCollections) => {
    if (!user) return;
    
    const pendingBookingIds = agent.bookings
      .filter(b => b.agentCollectionStatus === 'pending')
      .map(b => b.id);

    if (pendingBookingIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('seat_bookings')
        .update({
          agent_collection_status: 'collected',
          collected_at: new Date().toISOString(),
        })
        .in('id', pendingBookingIds);

      if (error) throw error;

      toast.success(`All collections marked as received from ${agent.name}`);
      fetchSeatBookings();
    } catch (error) {
      console.error('Error marking collected:', error);
      toast.error('Failed to update');
    }
  };

  if (loading) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Agent Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and collect pending amounts from agents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-amber-600">₹{summary.totalPending.toFixed(0)}</div>
              <p className="text-xs text-amber-600/80 mt-0.5">{summary.agentsWithPending} agents</p>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Collected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">₹{summary.totalCollected.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Advance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">₹{summary.totalAdvance.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{agentCollections.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending-desc">Pending: High to Low</SelectItem>
              <SelectItem value="pending-asc">Pending: Low to High</SelectItem>
              <SelectItem value="collected-desc">Collected: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for Pending/Received */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingAgents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingAgents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Received
              {receivedAgents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{receivedAgents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            {pendingAgents.length > 0 ? (
              <>
                {pendingAgents.some(a => a.totalPending > 0) && (
                  <div className="mb-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={async () => {
                        const list = pendingAgents.filter(a => a.totalPending > 0);
                        if (list.length === 0) {
                          toast.error('No pending collections found');
                          return;
                        }
                        for (const a of list) {
                          await generateVoucherPdf(a);
                        }
                        toast.success(`Generated ${list.length} voucher(s)`);
                      }}
                    >
                      <Send className="h-4 w-4" />
                      Download All Vouchers
                    </Button>
                  </div>
                )}
                <Accordion type="multiple" className="space-y-3">
                {pendingAgents.map((agent) => (
                  <AccordionItem key={agent.id} value={agent.id} className="border rounded-lg px-3 sm:px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{agent.name}</p>
                            {agent.phone && (
                              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {agent.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          {agent.advanceBalance > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs hidden sm:flex">
                              <Wallet className="h-3 w-3 mr-1" />
                              ₹{agent.advanceBalance.toFixed(0)} adv
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            ₹{agent.totalPending.toFixed(0)}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-3 space-y-4">
                        {/* Advance Balance Notice */}
                        {agent.advanceBalance > 0 && (
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              Advance Balance: <strong>₹{agent.advanceBalance.toFixed(0)}</strong>
                              {agent.totalPending > 0 && (
                                <span className="text-xs">
                                  (Net: ₹{Math.max(0, agent.totalPending - agent.advanceBalance).toFixed(0)})
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button onClick={() => handleOpenPayment(agent)} className="gap-2" size="sm">
                            <IndianRupee className="h-4 w-4" />
                            Receive Payment
                          </Button>
                          {agent.totalPending > 0 && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleMarkAllCollected(agent)}
                              className="gap-2"
                              size="sm"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark All Collected
                            </Button>
                          )}
                          {agent.totalPending > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => generateVoucherPdf(agent)}
                              className="gap-2"
                              size="sm"
                            >
                              <Send className="h-4 w-4" />
                              Download Voucher PDF
                            </Button>
                          )}
                        </div>

                        {/* Bookings Table - Grouped by Date + Bus */}
                        {agent.bookings.filter(b => b.agentCollectionStatus === 'pending').length > 0 && (
                          <div className="rounded-lg border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Date</TableHead>
                                  <TableHead className="text-xs">Bus</TableHead>
                                  <TableHead className="text-xs">Seats</TableHead>
                                  <TableHead className="text-right text-xs">Rate</TableHead>
                                  <TableHead className="text-right text-xs">To Collect</TableHead>
                                  <TableHead className="text-right text-xs">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  // Group bookings by date + bus + booking amount
                                  const grouped = new Map<string, { bookings: SeatBooking[], totalCollect: number }>();
                                  
                                  agent.bookings
                                    .filter(b => b.agentCollectionStatus === 'pending')
                                    .forEach(booking => {
                                      const key = `${booking.journeyDate}|${booking.busName || ''}|${booking.bookingAmount}`;
                                      if (!grouped.has(key)) {
                                        grouped.set(key, { bookings: [], totalCollect: 0 });
                                      }
                                      const group = grouped.get(key)!;
                                      group.bookings.push(booking);
                                      group.totalCollect += booking.amountFromAgent;
                                    });
                                  
                                  // Sort by date descending
                                  const sortedGroups = Array.from(grouped.entries())
                                    .sort((a, b) => {
                                      const dateA = a[1].bookings[0].journeyDate;
                                      const dateB = b[1].bookings[0].journeyDate;
                                      return new Date(dateB).getTime() - new Date(dateA).getTime();
                                    });
                                  
                                  return sortedGroups.map(([key, group]) => {
                                    const firstBooking = group.bookings[0];
                                    const seatNumbers = group.bookings
                                      .map(b => b.seatNumber)
                                      .sort((a, b) => a - b);
                                    const seatDisplay = seatNumbers.length > 3 
                                      ? `${seatNumbers.length} seats` 
                                      : seatNumbers.map(s => `#${s}`).join(', ');
                                    
                                    return (
                                      <TableRow key={key}>
                                        <TableCell className="text-xs sm:text-sm">
                                          {format(new Date(firstBooking.journeyDate), 'dd MMM')}
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm">
                                          <div className="flex items-center gap-1">
                                            <Bus className="h-3 w-3 text-muted-foreground" />
                                            <span className="truncate max-w-[100px] sm:max-w-[140px]">{firstBooking.busName || '-'}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm">
                                          <span className="font-medium">{seatDisplay}</span>
                                          {seatNumbers.length > 1 && (
                                            <span className="text-muted-foreground ml-1">({seatNumbers.length})</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs sm:text-sm">
                                          ₹{firstBooking.bookingAmount.toFixed(0)}/seat
                                        </TableCell>
                                        <TableCell className="text-right text-xs sm:text-sm font-medium text-amber-600">
                                          ₹{group.totalCollect.toFixed(0)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {seatNumbers.length === 1 ? (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => handleOpenSeatPayment(agent, firstBooking)}
                                              className="h-7 px-2 text-xs"
                                            >
                                              Receive
                                            </Button>
                                          ) : (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => {
                                                setSelectedAgent(agent);
                                                setSelectedBooking(null);
                                                setPaymentAmount(group.totalCollect.toString());
                                                setReceivedBy('');
                                                setPaymentMode('Cash');
                                                setPaymentNotes(`${seatNumbers.length} seats: ${seatNumbers.join(', ')}`);
                                                setPaymentDialogOpen(true);
                                              }}
                                              className="h-7 px-2 text-xs"
                                            >
                                              Receive All
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  });
                                })()}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {/* Summary */}
                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Pending:</span>{' '}
                            <span className="font-medium">{agent.bookings.filter(b => b.agentCollectionStatus === 'pending').length} bookings</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>{' '}
                            <span className="font-medium text-amber-600">₹{agent.totalPending.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending collections. All agent payments are received.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Received Tab */}
          <TabsContent value="received">
            {receivedAgents.length > 0 ? (
              <Accordion type="multiple" className="space-y-3">
                {receivedAgents.map((agent) => (
                  <AccordionItem key={agent.id} value={agent.id} className="border rounded-lg px-3 sm:px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{agent.name}</p>
                            {agent.phone && (
                              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {agent.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            ₹{agent.totalCollected.toFixed(0)}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-3 space-y-4">
                        {/* Payment History */}
                        {agent.payments.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 text-green-600" />
                              Payment History
                            </h4>
                            <div className="rounded-lg border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-right text-xs">Amount</TableHead>
                                    <TableHead className="text-xs">Payment Mode</TableHead>
                                    <TableHead className="text-xs">Received By</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {agent.payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                      <TableCell className="text-xs sm:text-sm">
                                        {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                                      </TableCell>
                                      <TableCell className="text-right text-xs sm:text-sm font-medium text-green-600">
                                        ₹{payment.amountPaid.toFixed(0)}
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <Badge variant="outline" className="text-xs">
                                          <CreditCard className="h-3 w-3 mr-1" />
                                          {payment.paymentMode}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3 text-muted-foreground" />
                                          {payment.receivedBy}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {/* Collected Bookings Table */}
                        {agent.bookings.filter(b => b.agentCollectionStatus === 'collected').length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Collected Bookings
                            </h4>
                            <div className="rounded-lg border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Bus</TableHead>
                                    <TableHead className="text-xs">Seat</TableHead>
                                    <TableHead className="text-right text-xs">Amount</TableHead>
                                    <TableHead className="text-right text-xs">Collected</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {agent.bookings
                                    .filter(b => b.agentCollectionStatus === 'collected')
                                    .sort((a, b) => new Date(b.journeyDate).getTime() - new Date(a.journeyDate).getTime())
                                    .map((booking) => (
                                    <TableRow key={booking.id}>
                                      <TableCell className="text-xs sm:text-sm">
                                        {format(new Date(booking.journeyDate), 'dd MMM')}
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <div className="flex items-center gap-1">
                                          <Bus className="h-3 w-3 text-muted-foreground" />
                                          <span className="truncate max-w-[140px] sm:max-w-[200px]">{booking.busName || '-'}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm font-medium">#{booking.seatNumber}</TableCell>
                                      <TableCell className="text-right text-xs sm:text-sm">₹{booking.bookingAmount.toFixed(0)}</TableCell>
                                      <TableCell className="text-right text-xs sm:text-sm font-medium text-green-600">
                                        ₹{(booking.originalAmountFromAgent || booking.amountFromAgent).toFixed(0)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Payments:</span>{' '}
                            <span className="font-medium">{agent.payments.length} records</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bookings:</span>{' '}
                            <span className="font-medium">{agent.bookings.filter(b => b.agentCollectionStatus === 'collected').length} collected</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>{' '}
                            <span className="font-medium text-green-600">₹{agent.totalCollected.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No received payments yet. Collected payments will appear here.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Receive Payment
              </DialogTitle>
              <DialogDescription>
                Collect payment from {selectedAgent?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedAgent && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-medium">{selectedAgent.name}</span>
                  </div>
                  {selectedAgent.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selectedAgent.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-600">
                    <span>Total Pending</span>
                    <span className="font-bold">₹{selectedAgent.totalPending.toFixed(0)}</span>
                  </div>
                  {selectedAgent.advanceBalance > 0 && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Advance Balance</span>
                        <span className="font-bold">₹{selectedAgent.advanceBalance.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Net Payable</span>
                        <span className="font-bold">
                          ₹{Math.max(0, selectedAgent.totalPending - selectedAgent.advanceBalance).toFixed(0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label>Amount Received (₹) *</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount(selectedAgent.totalPending.toString())}
                      >
                        Full
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount(Math.max(0, selectedAgent.totalPending - selectedAgent.advanceBalance).toString())}
                      >
                        Net
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount((selectedAgent.totalPending / 2).toString())}
                      >
                        Half
                      </Button>
                    </div>
                    {parseFloat(paymentAmount) > selectedAgent.totalPending && (
                      <p className="text-xs text-blue-600 mt-2">
                        ₹{(parseFloat(paymentAmount) - selectedAgent.totalPending).toFixed(0)} will be saved as advance
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Received By *</Label>
                    <Input
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      placeholder="Enter receiver name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Any notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Collect ₹{parseFloat(paymentAmount) || 0}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Seat Payment Dialog */}
        <Dialog open={seatPaymentDialogOpen} onOpenChange={setSeatPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Receive Seat Payment
              </DialogTitle>
              <DialogDescription>
                Collect payment for Seat #{selectedBooking?.seatNumber} from {selectedAgent?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedAgent && selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-medium">{selectedAgent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seat</span>
                    <span className="font-medium">#{selectedBooking.seatNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bus</span>
                    <span>{selectedBooking.busName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Journey Date</span>
                    <span>{format(new Date(selectedBooking.journeyDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 border-t pt-2">
                    <span>Amount to Collect</span>
                    <span className="font-bold">₹{selectedBooking.amountFromAgent.toFixed(0)}</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label>Amount Received (₹) *</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount(selectedBooking.amountFromAgent.toString())}
                      >
                        Full
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentAmount((selectedBooking.amountFromAgent / 2).toString())}
                      >
                        Half
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Received By *</Label>
                    <Input
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      placeholder="Enter receiver name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Any notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSeatPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSeatPayment} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Collect ₹{parseFloat(paymentAmount) || 0}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
