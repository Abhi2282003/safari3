import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { IndianRupee, Receipt, Wallet, TrendingUp, Calendar as CalIcon, Download, ArrowLeft, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface PayEntry {
  id: string;
  user_id: string;
  ticket_no: string;
  travels_name: string;
  booked_by: string | null;
  amount: number;
  collection_status: 'Paid' | 'Unpaid';
  paid_by: string | null;
  receiver_name: string | null;
  payment_mode: string | null;
  entry_payment_mode: string | null;
  paid_at: string | null;
  created_at: string;
}

interface StaffRow { user_id: string; username: string; full_name: string; }

export default function Hisab() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null); // user_id or null = picker
  const [entries, setEntries] = useState<PayEntry[]>([]);
  const [travelsCommission, setTravelsCommission] = useState<Record<string, number>>({});
  const [staffTotals, setStaffTotals] = useState<Record<string, { count: number; amount: number }>>({});
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; phone: string; address: string }>({
    name: '', phone: '', address: ''
  });
  const activeStaffId = isAdmin ? selectedStaff : user?.id || null;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('name, phone, address')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setCompanyInfo({
        name: data.name || 'ROYAL SAFARI',
        phone: data.phone || '',
        address: data.address || '',
      });
    })();
  }, [user]);

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('staff_members').select('user_id, username, full_name').eq('active', true);
      if (data) setStaffList(data as StaffRow[]);
    })();
    (async () => {
      const { data } = await supabase.from('travels').select('name, commission_percent');
      if (data) {
        const m: Record<string, number> = {};
        (data as any[]).forEach(t => { m[t.name] = t.commission_percent ?? 0; });
        setTravelsCommission(m);
      }
    })();
  }, []);

  // Load totals per staff for the date (admin picker view)
  useEffect(() => {
    if (!isAdmin || selectedStaff) return;
    (async () => {
      const start = new Date(date + 'T00:00:00').toISOString();
      const end = new Date(date + 'T23:59:59.999').toISOString();
      const { data } = await (supabase as any)
        .from('pay_collection_entries')
        .select('user_id, amount')
        .gte('created_at', start)
        .lte('created_at', end);
      const totals: Record<string, { count: number; amount: number }> = {};
      (data || []).forEach((e: any) => {
        const t = totals[e.user_id] || { count: 0, amount: 0 };
        t.count += 1;
        t.amount += Number(e.amount || 0);
        totals[e.user_id] = t;
      });
      setStaffTotals(totals);
    })();
  }, [isAdmin, selectedStaff, date]);

  // Load entries for selected staff
  useEffect(() => {
    if (!activeStaffId) { setEntries([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const start = new Date(date + 'T00:00:00');
      const end = new Date(date + 'T23:59:59.999');
      const { data } = await (supabase as any)
        .from('pay_collection_entries')
        .select('*')
        .eq('user_id', activeStaffId);
      const all = (data || []) as PayEntry[];
      const filtered = all.filter(e => {
        const created = new Date(e.created_at);
        const paid = e.paid_at ? new Date(e.paid_at) : null;
        return (created >= start && created <= end) || (paid && paid >= start && paid <= end);
      });
      setEntries(filtered);
      setLoading(false);
    })();
  }, [activeStaffId, date]);

  if (roleLoading) return <Layout><div className="p-6">Loading...</div></Layout>;

  const start = new Date(date + 'T00:00:00');
  const end = new Date(date + 'T23:59:59.999');
  const bookedToday = entries.filter(e => new Date(e.created_at) >= start && new Date(e.created_at) <= end);
  const paidToday = entries.filter(e => e.paid_at && new Date(e.paid_at) >= start && new Date(e.paid_at) <= end);

  const collectionTotal = bookedToday.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paidOutTotal = paidToday.reduce((s, e) => {
    const cp = travelsCommission[e.travels_name] ?? 0;
    return s + (Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100);
  }, 0);
  const cashInHand = collectionTotal - paidOutTotal;

  const staffMap = Object.fromEntries(staffList.map(s => [s.user_id, s]));
  const currentStaffName = activeStaffId
    ? (staffMap[activeStaffId]?.full_name || (activeStaffId === user?.id ? 'My Hisab' : 'Staff'))
    : '';

  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const dateLabel = format(start, 'dd MMM yyyy');
    const hisabNo = `H-${format(start, 'yyyyMMdd')}-${(activeStaffId || '').slice(0, 6).toUpperCase()}`;

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
      try { doc.addImage(logoData, 'PNG', 14, 10, 26, 26); } catch { /* ignore */ }
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
    const title = 'DAILY HISAB REPORT';
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
    doc.text(`Hisab No: ${hisabNo}`, 14, 62);
    doc.text(`Date: ${dateLabel}`, pageW - 14, 62, { align: 'right' });

    // Staff card
    const staffBoxY = 67;
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, staffBoxY, pageW - 28, 13, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('STAFF', 18, staffBoxY + 6);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFontSize(11);
    doc.text(currentStaffName || '-', 18, staffBoxY + 12);

    // Summary table
    autoTable(doc, {
      startY: staffBoxY + 17,
      head: [['Metric', 'Value']],
      body: [
        ['Tickets Booked', String(bookedToday.length)],
        ['Total Collection', `Rs. ${collectionTotal.toLocaleString('en-IN')}`],
        ['Paid Out to Travels', `Rs. ${paidOutTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
        ['Cash In Hand', `Rs. ${cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
      ],
      styles: { fontSize: 9.5, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
      alternateRowStyles: { fillColor: [252, 250, 247] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      theme: 'grid',
      margin: { left: 14, right: 14 },
    });

    // Booked tickets table
    let y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text(`Tickets Booked (${bookedToday.length})`, 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [['#', 'Ticket No', 'Travels', 'Booked By', 'Mode', 'Amount', 'Status']],
      body: bookedToday.map((e, i) => [
        String(i + 1),
        e.ticket_no,
        e.travels_name,
        e.booked_by || '-',
        e.entry_payment_mode || '-',
        `Rs. ${Number(e.amount).toLocaleString('en-IN')}`,
        e.collection_status,
      ]),
      foot: [[
        { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `Rs. ${collectionTotal.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: {} },
      ]],
      styles: { fontSize: 9, cellPadding: 2.5, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
      footStyles: { fillColor: [255, 237, 213], textColor: brandDark as any },
      alternateRowStyles: { fillColor: [252, 250, 247] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        5: { halign: 'right' },
        6: { halign: 'center', fontStyle: 'bold' },
      },
      theme: 'grid',
      margin: { left: 14, right: 14 },
    });

    if (paidToday.length) {
      y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.text(`Paid Out to Travels (${paidToday.length})`, 14, y);

      autoTable(doc, {
        startY: y + 3,
        head: [['#', 'Ticket No', 'Travels', 'Receiver', 'Mode', 'Amount']],
        body: paidToday.map((e, i) => {
          const cp = travelsCommission[e.travels_name] ?? 0;
          const payable = Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100;
          return [
            String(i + 1),
            e.ticket_no,
            e.travels_name,
            e.receiver_name || '-',
            e.payment_mode || '-',
            `Rs. ${payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          ];
        }),
        foot: [[
          { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `Rs. ${paidOutTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, styles: { halign: 'right', fontStyle: 'bold' } },
        ]],
        styles: { fontSize: 9, cellPadding: 2.5, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
        footStyles: { fillColor: [255, 237, 213], textColor: brandDark as any },
        alternateRowStyles: { fillColor: [252, 250, 247] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 9 },
          5: { halign: 'right', fontStyle: 'bold', textColor: brandDark as any },
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });
    }

    // Cash in Hand summary card
    const boxY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(250, 245, 235);
    doc.setDrawColor(brand[0], brand[1], brand[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageW - 90, boxY, 76, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('CASH IN HAND', pageW - 88, boxY + 6);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFontSize(15);
    doc.text(
      `Rs. ${cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      pageW - 16,
      boxY + 14,
      { align: 'right' }
    );

    // Left meta
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Total Booked: ${bookedToday.length}  |  Paid Out: ${paidToday.length}`, 14, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(110);
    doc.text('Note: Paid Out amount is after deducting travels commission.', 14, boxY + 13);

    // Footer band
    doc.setFillColor(brand[0], brand[1], brand[2]);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
      pageW / 2,
      pageH - 10,
      { align: 'center' }
    );

    doc.save(`Hisab_${currentStaffName.replace(/\s+/g, '_')}_${format(start, 'yyyy-MM-dd')}.pdf`);
  };

  // Admin picker view
  if (isAdmin && !selectedStaff) {
    return (
      <Layout>
        <div className="max-w-5xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Daily Hisab</h1>
              <p className="text-sm text-muted-foreground">Select a staff member to view their hisab</p>
            </div>
            <div className="flex items-center gap-2">
              <CalIcon className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            </div>
          </div>

          {staffList.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No staff members yet. Add them from Settings.</CardContent></Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {staffList.map(s => {
                const t = staffTotals[s.user_id] || { count: 0, amount: 0 };
                return (
                  <Card key={s.user_id} className="cursor-pointer hover:border-primary transition" onClick={() => setSelectedStaff(s.user_id)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{s.full_name}</div>
                          <div className="text-xs text-muted-foreground">@{s.username}</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">{t.count} ticket(s)</span>
                        <span className="font-semibold flex items-center"><IndianRupee className="h-3 w-3" />{t.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Admin drill-in view: wide desktop layout with summary grid + tables
  if (isAdmin) {
    return (
      <Layout>
        <div className="max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedStaff(null)} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentStaffName}</h1>
                <p className="text-sm text-muted-foreground">{format(start, 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <CalIcon className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/tickets"><FileText className="h-4 w-4" />View Tickets</Link>
              </Button>
              <Button onClick={downloadPDF} className="gap-2"><Download className="h-4 w-4" />Download PDF</Button>
            </div>

          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" />Tickets Booked</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bookedToday.length}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center"><IndianRupee className="h-3 w-3" />{collectionTotal.toLocaleString('en-IN')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Paid Out to Travels</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center"><IndianRupee className="h-6 w-6" />{paidOutTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="text-sm text-muted-foreground mt-1">{paidToday.length} ticket(s) settled</div>
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Cash In Hand</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold flex items-center ${cashInHand >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  <IndianRupee className="h-6 w-6" />{cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Collection - Paid out</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Tickets booked</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : bookedToday.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tickets booked.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Ticket No</th><th>Travels</th><th>Booked By</th><th>Mode</th><th className="text-right">Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {bookedToday.map(e => (
                      <tr key={e.id} className="border-b">
                        <td className="py-2 font-mono text-xs">{e.ticket_no}</td>
                        <td>{e.travels_name}</td>
                        <td>{e.booked_by || '-'}</td>
                        <td>{e.entry_payment_mode || '-'}</td>
                        <td className="text-right">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                        <td><span className={e.collection_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{e.collection_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {paidToday.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Paid out to travels</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Ticket No</th><th>Travels</th><th>Mode</th><th>Receiver</th><th className="text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {paidToday.map(e => {
                      const cp = travelsCommission[e.travels_name] ?? 0;
                      const payable = Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100;
                      return (
                        <tr key={e.id} className="border-b">
                          <td className="py-2 font-mono text-xs">{e.ticket_no}</td>
                          <td>{e.travels_name}</td>
                          <td>{e.payment_mode || '-'}</td>
                          <td>{e.receiver_name || '-'}</td>
                          <td className="text-right">₹{payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    );
  }

  // Staff drill-in view: mobile-first stacked cards
  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{currentStaffName}</h1>
            <p className="text-xs text-muted-foreground">{format(start, 'dd MMM yyyy')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/tickets"><FileText className="h-4 w-4" />Tickets</Link>
            </Button>
            <Button onClick={downloadPDF} size="sm" className="gap-1.5">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>

        </div>

        <div className="flex items-center gap-2">
          <CalIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tickets Booked</p>
                  <p className="text-xl font-bold leading-tight">{bookedToday.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Collection</p>
                <p className="text-lg font-semibold flex items-center justify-end"><IndianRupee className="h-4 w-4" />{collectionTotal.toLocaleString('en-IN')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid Out</p>
                  <p className="text-xs text-muted-foreground">{paidToday.length} settled</p>
                </div>
              </div>
              <p className="text-lg font-semibold flex items-center"><IndianRupee className="h-4 w-4" />{paidOutTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">Cash In Hand</p>
              </div>
              <p className={`text-xl font-bold flex items-center ${cashInHand >= 0 ? 'text-primary' : 'text-destructive'}`}>
                <IndianRupee className="h-5 w-5" />{cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tickets booked ({bookedToday.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : bookedToday.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No tickets today.</div>
            ) : (
              bookedToday.map(e => (
                <div key={e.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-muted-foreground">{e.ticket_no}</p>
                      <p className="text-sm font-medium truncate">{e.travels_name}</p>
                    </div>
                    <span className={`text-xs font-semibold ${e.collection_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {e.collection_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{e.entry_payment_mode || '-'}</span>
                    <span className="font-semibold text-foreground">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {paidToday.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Paid out ({paidToday.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {paidToday.map(e => {
                const cp = travelsCommission[e.travels_name] ?? 0;
                const payable = Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100;
                return (
                  <div key={e.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-muted-foreground">{e.ticket_no}</p>
                        <p className="text-sm font-medium truncate">{e.travels_name}</p>
                      </div>
                      <p className="text-sm font-semibold">₹{payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{e.receiver_name || '-'}</span>
                      <span>{e.payment_mode || '-'}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
