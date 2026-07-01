import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Save, Building, Ruler, Bus, Loader2, MapPin, Navigation, Users, Car, MessageCircle, Download, ChevronDown, Pencil, X, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PrePrintedCalibration } from '@/components/settings/PrePrintedCalibration';
import { StaffManagement } from '@/components/settings/StaffManagement';
import { DEFAULT_PREPRINTED_LAYOUT, type PrePrintedLayout } from '@/components/ticket/PrintOnPrePrintedTicket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CompanySettings, ReceiverName, TravelsConfig, PickupLocation, DestinationCity, BusConfig } from '@/types/ticket';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Agent {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    logoUrl: '',
    footerNote: '',
    ticketWidth: 280,
    ticketHeight: 140,
    whatsappTemplate: '',
    whatsappReminderEnabled: false,
  });
  const [prePrintedLayout, setPrePrintedLayout] = useState<PrePrintedLayout>(DEFAULT_PREPRINTED_LAYOUT);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [receivers, setReceivers] = useState<ReceiverName[]>([]);
  const [travels, setTravels] = useState<TravelsConfig[]>([]);
  const [pickups, setPickups] = useState<PickupLocation[]>([]);
  const [destinations, setDestinations] = useState<DestinationCity[]>([]);
  const [buses, setBuses] = useState<BusConfig[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsTotalCount, setAgentsTotalCount] = useState<number>(0);
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newTravelName, setNewTravelName] = useState('');
  const [newTravelPercent, setNewTravelPercent] = useState('10');
  const [newPickupName, setNewPickupName] = useState('');
  const [newDestinationName, setNewDestinationName] = useState('');
  const [newBusName, setNewBusName] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTravelId, setDeleteTravelId] = useState<string | null>(null);
  const [deletePickupId, setDeletePickupId] = useState<string | null>(null);
  const [deleteDestinationId, setDeleteDestinationId] = useState<string | null>(null);
  const [deleteBusId, setDeleteBusId] = useState<string | null>(null);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [showClearAgentsDialog, setShowClearAgentsDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible sections — closed by default; only open on click
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Inline editing state
  const [editing, setEditing] = useState<{ table: string; id: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const beginEdit = (table: string, id: string, values: Record<string, any>) => {
    setEditing({ table, id });
    setEditValues(values);
  };
  const cancelEdit = () => { setEditing(null); setEditValues({}); };

  const saveEdit = async (
    table: 'agents' | 'travels' | 'receivers' | 'pickup_locations' | 'destination_cities' | 'buses',
    id: string,
    payload: Record<string, any>
  ) => {
    if (!user) return;
    try {
      const { error } = await (supabase.from(table) as any).update(payload).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      if (table === 'agents') setAgents(agents.map(a => a.id === id ? { ...a, ...{ name: payload.name, phone: payload.phone || undefined } } : a));
      if (table === 'travels') setTravels(travels.map(t => t.id === id ? { ...t, name: payload.name, commissionPercent: Number(payload.commission_percent) } : t));
      if (table === 'receivers') setReceivers(receivers.map(r => r.id === id ? { ...r, name: payload.name } : r));
      if (table === 'pickup_locations') setPickups(pickups.map(p => p.id === id ? { ...p, name: payload.name } : p));
      if (table === 'destination_cities') setDestinations(destinations.map(d => d.id === id ? { ...d, name: payload.name } : d));
      if (table === 'buses') setBuses(buses.map(b => b.id === id ? { ...b, name: payload.name } : b));

      toast.success('Updated');
      cancelEdit();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch company settings from Supabase
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setCompanySettings({
          name: settingsData.name || 'ROYAL TRAVELS',
          address: settingsData.address || '',
          phone: settingsData.phone || '',
          logoUrl: settingsData.logo_url || '',
          footerNote: settingsData.footer_note || 'Wish you a Happy Journey!',
          ticketWidth: settingsData.ticket_width || 280,
          ticketHeight: settingsData.ticket_height || 140,
          whatsappTemplate: (settingsData as any).whatsapp_template || '',
          whatsappReminderEnabled: (settingsData as any).whatsapp_reminder_enabled ?? false,
        });
        // Load pre-printed layout from database
        if (settingsData.preprinted_layout) {
          try {
            const savedLayout = settingsData.preprinted_layout as Partial<PrePrintedLayout>;
            const merged = { ...DEFAULT_PREPRINTED_LAYOUT, ...savedLayout } as PrePrintedLayout;

            const outOfBounds = (Object.keys(DEFAULT_PREPRINTED_LAYOUT) as (keyof PrePrintedLayout)[]).some((k) => {
              const p = merged[k];
              return typeof p?.x === 'number' && typeof p?.y === 'number' && (p.x > 105 || p.y > 175);
            });

            if (outOfBounds) {
              setPrePrintedLayout(DEFAULT_PREPRINTED_LAYOUT);
              toast('Old pre-printed layout detected. Please press Reset in Calibration and Save again.');
            } else {
              setPrePrintedLayout(merged);
            }
          } catch {
            // Keep default if parsing fails
          }
        }
      }

      // Fetch receivers from Supabase
      const { data: receiversData } = await supabase
        .from('receivers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (receiversData) {
        setReceivers(receiversData.map(r => ({
          id: r.id,
          name: r.name,
          active: r.active ?? true,
        })));
      }

      // Fetch travels from Supabase
      const { data: travelsData } = await supabase
        .from('travels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (travelsData) {
        setTravels(travelsData.map(t => ({
          id: t.id,
          name: t.name,
          commissionPercent: Number(t.commission_percent),
          active: t.active ?? true,
        })));
      }

      // Fetch pickup locations from Supabase
      const { data: pickupsData } = await supabase
        .from('pickup_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (pickupsData) {
        setPickups(pickupsData.map(p => ({
          id: p.id,
          name: p.name,
          active: p.active ?? true,
        })));
      }

      // Fetch destination cities from Supabase
      const { data: destinationsData } = await supabase
        .from('destination_cities')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (destinationsData) {
        setDestinations(destinationsData.map(d => ({
          id: d.id,
          name: d.name,
          active: d.active ?? true,
        })));
      }

      // Fetch buses from Supabase
      const { data: busesData } = await supabase
        .from('buses')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (busesData) {
        setBuses(busesData.map(b => ({
          id: b.id,
          name: b.name,
          active: b.active ?? true,
        })));
      }

      // Fetch agents count and first 100 from Supabase
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setAgentsTotalCount(agentsCount || 0);

      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(100);

      if (agentsData) {
        setAgents(agentsData.map(a => ({
          id: a.id,
          name: a.name,
          phone: a.phone || undefined,
          active: a.active ?? true,
        })));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsPayload: any = {
        user_id: user.id,
        name: companySettings.name,
        address: companySettings.address,
        phone: companySettings.phone,
        logo_url: companySettings.logoUrl,
        footer_note: companySettings.footerNote,
        ticket_width: companySettings.ticketWidth,
        ticket_height: companySettings.ticketHeight,
        whatsapp_template: companySettings.whatsappTemplate,
        whatsapp_reminder_enabled: companySettings.whatsappReminderEnabled,
      };

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update(settingsPayload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert(settingsPayload);
        if (error) throw error;
      }

      toast.success('Company settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrePrintedLayout = async () => {
    if (!user) return;
    setIsSavingLayout(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({ preprinted_layout: JSON.parse(JSON.stringify(prePrintedLayout)) })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert([{
            user_id: user.id,
            preprinted_layout: JSON.parse(JSON.stringify(prePrintedLayout)),
          }]);
        if (error) throw error;
      }

      toast.success('Pre-printed layout saved successfully');
    } catch (error) {
      console.error('Error saving pre-printed layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleAddReceiver = async () => {
    if (!user) return;
    if (!newReceiverName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('receivers')
        .insert({
          user_id: user.id,
          name: newReceiverName.trim(),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setReceivers([...receivers, {
        id: data.id,
        name: data.name,
        active: data.active ?? true,
      }]);
      setNewReceiverName('');
      toast.success('Receiver added successfully');
    } catch (error) {
      console.error('Error adding receiver:', error);
      toast.error('Failed to add receiver');
    }
  };

  const handleToggleReceiver = async (receiver: ReceiverName) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('receivers')
        .update({ active: !receiver.active })
        .eq('id', receiver.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReceivers(receivers.map(r => 
        r.id === receiver.id ? { ...r, active: !r.active } : r
      ));
    } catch (error) {
      console.error('Error updating receiver:', error);
      toast.error('Failed to update receiver');
    }
  };

  const handleDeleteReceiver = async () => {
    if (!deleteId || !user) return;
    try {
      const { error } = await supabase
        .from('receivers')
        .delete()
        .eq('id', deleteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setReceivers(receivers.filter(r => r.id !== deleteId));
      toast.success('Receiver deleted');
    } catch (error) {
      console.error('Error deleting receiver:', error);
      toast.error('Failed to delete receiver');
    } finally {
      setDeleteId(null);
    }
  };

  // Travels management
  const handleAddTravel = async () => {
    if (!user) return;
    if (!newTravelName.trim()) {
      toast.error('Please enter a travels name');
      return;
    }
    const percent = parseFloat(newTravelPercent) || 10;
    if (percent < 0 || percent > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('travels')
        .insert({
          user_id: user.id,
          name: newTravelName.trim(),
          commission_percent: percent,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setTravels([...travels, {
        id: data.id,
        name: data.name,
        commissionPercent: Number(data.commission_percent),
        active: data.active ?? true,
      }]);
      setNewTravelName('');
      setNewTravelPercent('10');
      toast.success('Travels added successfully');
    } catch (error) {
      console.error('Error adding travels:', error);
      toast.error('Failed to add travels');
    }
  };

  const handleToggleTravel = async (travel: TravelsConfig) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('travels')
        .update({ active: !travel.active })
        .eq('id', travel.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTravels(travels.map(t => 
        t.id === travel.id ? { ...t, active: !t.active } : t
      ));
    } catch (error) {
      console.error('Error updating travels:', error);
      toast.error('Failed to update travels');
    }
  };

  const handleDeleteTravel = async () => {
    if (!deleteTravelId || !user) return;
    try {
      const { error } = await supabase
        .from('travels')
        .delete()
        .eq('id', deleteTravelId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTravels(travels.filter(t => t.id !== deleteTravelId));
      toast.success('Travels deleted');
    } catch (error) {
      console.error('Error deleting travels:', error);
      toast.error('Failed to delete travels');
    } finally {
      setDeleteTravelId(null);
    }
  };

  // Pickup locations management
  const handleAddPickup = async () => {
    if (!user) return;
    if (!newPickupName.trim()) {
      toast.error('Please enter a pickup location name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pickup_locations')
        .insert({
          user_id: user.id,
          name: newPickupName.trim(),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setPickups([...pickups, {
        id: data.id,
        name: data.name,
        active: data.active ?? true,
      }]);
      setNewPickupName('');
      toast.success('Pickup location added successfully');
    } catch (error) {
      console.error('Error adding pickup:', error);
      toast.error('Failed to add pickup location');
    }
  };

  const handleTogglePickup = async (pickup: PickupLocation) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('pickup_locations')
        .update({ active: !pickup.active })
        .eq('id', pickup.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPickups(pickups.map(p => 
        p.id === pickup.id ? { ...p, active: !p.active } : p
      ));
    } catch (error) {
      console.error('Error updating pickup:', error);
      toast.error('Failed to update pickup location');
    }
  };

  const handleDeletePickup = async () => {
    if (!deletePickupId || !user) return;
    try {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', deletePickupId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPickups(pickups.filter(p => p.id !== deletePickupId));
      toast.success('Pickup location deleted');
    } catch (error) {
      console.error('Error deleting pickup:', error);
      toast.error('Failed to delete pickup location');
    } finally {
      setDeletePickupId(null);
    }
  };

  // Destination cities management
  const handleAddDestination = async () => {
    if (!user) return;
    if (!newDestinationName.trim()) {
      toast.error('Please enter a destination city name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('destination_cities')
        .insert({
          user_id: user.id,
          name: newDestinationName.trim(),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setDestinations([...destinations, {
        id: data.id,
        name: data.name,
        active: data.active ?? true,
      }]);
      setNewDestinationName('');
      toast.success('Destination added successfully');
    } catch (error) {
      console.error('Error adding destination:', error);
      toast.error('Failed to add destination');
    }
  };

  const handleToggleDestination = async (destination: DestinationCity) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('destination_cities')
        .update({ active: !destination.active })
        .eq('id', destination.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDestinations(destinations.map(d => 
        d.id === destination.id ? { ...d, active: !d.active } : d
      ));
    } catch (error) {
      console.error('Error updating destination:', error);
      toast.error('Failed to update destination');
    }
  };

  const handleDeleteDestination = async () => {
    if (!deleteDestinationId || !user) return;
    try {
      const { error } = await supabase
        .from('destination_cities')
        .delete()
        .eq('id', deleteDestinationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDestinations(destinations.filter(d => d.id !== deleteDestinationId));
      toast.success('Destination deleted');
    } catch (error) {
      console.error('Error deleting destination:', error);
      toast.error('Failed to delete destination');
    } finally {
      setDeleteDestinationId(null);
    }
  };

  // Bus management
  const handleAddBus = async () => {
    if (!user) return;
    if (!newBusName.trim()) {
      toast.error('Please enter a bus number');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('buses')
        .insert({
          user_id: user.id,
          name: newBusName.trim(),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setBuses([...buses, {
        id: data.id,
        name: data.name,
        active: data.active ?? true,
      }]);
      setNewBusName('');
      toast.success('Bus added successfully');
    } catch (error) {
      console.error('Error adding bus:', error);
      toast.error('Failed to add bus');
    }
  };

  const handleToggleBus = async (bus: BusConfig) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('buses')
        .update({ active: !bus.active })
        .eq('id', bus.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBuses(buses.map(b => 
        b.id === bus.id ? { ...b, active: !b.active } : b
      ));
    } catch (error) {
      console.error('Error updating bus:', error);
      toast.error('Failed to update bus');
    }
  };

  const handleDeleteBus = async () => {
    if (!deleteBusId || !user) return;
    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', deleteBusId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBuses(buses.filter(b => b.id !== deleteBusId));
      toast.success('Bus deleted');
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus');
    } finally {
      setDeleteBusId(null);
    }
  };

  // Agent management
  const handleAddAgent = async () => {
    if (!user) return;
    if (!newAgentName.trim()) {
      toast.error('Please enter agent name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: newAgentName.trim(),
          phone: newAgentPhone.trim() || null,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setAgents([{ id: data.id, name: data.name, phone: data.phone || undefined, active: data.active ?? true }, ...agents]);
      setAgentsTotalCount(agentsTotalCount + 1);
      setNewAgentName('');
      setNewAgentPhone('');
      toast.success('Agent added successfully');
    } catch (error) {
      console.error('Error adding agent:', error);
      toast.error('Failed to add agent');
    }
  };

  const handleDownloadAgentsPdf = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('name, phone, active')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw error;
      const list = data || [];
      if (list.length === 0) {
        toast.error('No agents to export');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const logoMod: any = await import('@/assets/royal-safari-logo.png.asset.json');
      const logoUrl = logoMod.default?.url || logoMod.url;

      let logoData: string | null = null;
      try {
        const res = await fetch(logoUrl);
        const blob = await res.blob();
        logoData = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
      } catch (e) { /* ignore */ }

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const brand: [number, number, number] = [234, 88, 12];
      const brandDark: [number, number, number] = [124, 45, 18];

      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.rect(0, 0, pageW, 6, 'F');

      if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 10, 26, 26); } catch {}
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

      const title = 'AGENT CONTACT DIRECTORY';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const titleW = doc.getTextWidth(title) + 12;
      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.roundedRect((pageW - titleW) / 2, 44, titleW, 9, 2, 2, 'F');
      doc.setTextColor(255);
      doc.text(title, pageW / 2, 50.3, { align: 'center' });

      doc.setTextColor(30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Agents: ${list.length}`, 14, 62);
      doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, pageW - 14, 62, { align: 'right' });

      autoTable(doc, {
        startY: 68,
        head: [['#', 'Agent Name', 'Phone', 'Status']],
        body: list.map((a, i) => [
          String(i + 1),
          a.name,
          a.phone || '-',
          a.active ? 'Active' : 'Inactive',
        ]),
        styles: { fontSize: 10, cellPadding: 3, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: brandDark, textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [252, 250, 247] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          2: { halign: 'left' },
          3: { halign: 'center', cellWidth: 25 },
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.rect(0, pageH - 6, pageW, 6, 'F');

      doc.save(`Agents_Directory_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('Agent directory downloaded');
    } catch (error) {
      console.error('Error generating agents PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentId || !user) return;
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', deleteAgentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAgents(agents.filter(a => a.id !== deleteAgentId));
      setAgentsTotalCount(agentsTotalCount - 1);
      toast.success('Agent deleted');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setDeleteAgentId(null);
    }
  };

  const handleClearAllAgents = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setAgents([]);
      setAgentsTotalCount(0);
      toast.success('All agents cleared');
    } catch (error) {
      console.error('Error clearing agents:', error);
      toast.error('Failed to clear agents');
    } finally {
      setShowClearAgentsDialog(false);
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
      <div className="p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage company details and receiver names
          </p>
        </div>

        <div className="space-y-8">
          {/* Company Settings */}
          <Card>
            <CardHeader onClick={() => toggleSection('company')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Company Details
                  </CardTitle>
                  <CardDescription>These details will appear on printed tickets</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['company'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['company'] && (
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companySettings.name}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., ROYAL TRAVELS"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Shop address, City, PIN"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Numbers</Label>
                <Input
                  id="phone"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., +91 98765 43210 / +91 98765 43211"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="footerNote">Footer Note (Boarding Pass)</Label>
                <Input
                  id="footerNote"
                  value={companySettings.footerNote}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, footerNote: e.target.value }))}
                  placeholder="e.g., Wish you a Happy Journey!"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveCompany} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Company Details'}
                </Button>
              </div>
            </CardContent>
            )}
          </Card>





          {/* Agents Management */}
          <Card>
            <CardHeader onClick={() => toggleSection('agents')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Agents ({agentsTotalCount})
                  </CardTitle>
                  <CardDescription>
                    Add agents manually with name and phone number
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDownloadAgentsPdf(); }}
                    disabled={agents.length === 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['agents'] ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
            {openSections['agents'] && (
            <CardContent>
              {/* Add New Agent */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Agent name"
                  className="flex-1"
                />
                <Input
                  value={newAgentPhone}
                  onChange={(e) => setNewAgentPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-40"
                />
                <Button onClick={handleAddAgent} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* Clear All */}
              {agentsTotalCount > 0 && (
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowClearAgentsDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Agents
                  </Button>
                </div>
              )}
              
              {agents.length > 0 ? (
                <div className="rounded-lg border max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.slice(0, 50).map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>{agent.phone || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={agent.active}
                              onCheckedChange={async () => {
                                await supabase
                                  .from('agents')
                                  .update({ active: !agent.active })
                                  .eq('id', agent.id);
                                setAgents(agents.map(a => 
                                  a.id === agent.id ? { ...a, active: !a.active } : a
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteAgentId(agent.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {agentsTotalCount > 50 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Showing first 50 of {agentsTotalCount} agents
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No agents added yet. Add agents manually above.
                </p>
              )}
            </CardContent>
            )}
          </Card>

          {/* Travels Management */}
          <Card>
            <CardHeader onClick={() => toggleSection('travels')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Travels & Commission
                  </CardTitle>
                  <CardDescription>Add travels with their commission percentage for collection calculation</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['travels'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['travels'] && (
            <CardContent>
              {/* Add New Travels */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newTravelName}
                  onChange={(e) => setNewTravelName(e.target.value)}
                  placeholder="Travels name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={newTravelPercent}
                  onChange={(e) => setNewTravelPercent(e.target.value)}
                  placeholder="%"
                  className="w-20"
                  min={0}
                  max={100}
                />
                <Button onClick={handleAddTravel} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* Travels List */}
              {travels.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Travels Name</TableHead>
                        <TableHead className="text-center">Commission %</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {travels.map((travel) => (
                        <TableRow key={travel.id}>
                          <TableCell className="font-medium">{travel.name}</TableCell>
                          <TableCell className="text-center">{travel.commissionPercent}%</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={travel.active}
                              onCheckedChange={() => handleToggleTravel(travel)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTravelId(travel.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No travels added yet. Add travels to see them in the ticket form dropdown.
                </p>
              )}
            </CardContent>
            )}
          </Card>

          {/* Pickup Locations */}
          <Card>
            <CardHeader onClick={() => toggleSection('pickups')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup Locations
                  </CardTitle>
                  <CardDescription>Add pickup locations to select in the ticket form</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['pickups'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['pickups'] && (
            <CardContent>
              {/* Add New */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newPickupName}
                  onChange={(e) => setNewPickupName(e.target.value)}
                  placeholder="Enter pickup location"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPickup()}
                />
                <Button onClick={handleAddPickup} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              {pickups.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pickups.map((pickup) => (
                        <TableRow key={pickup.id}>
                          <TableCell className="font-medium">{pickup.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={pickup.active}
                              onCheckedChange={() => handleTogglePickup(pickup)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletePickupId(pickup.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No pickup locations added yet
                </p>
              )}
            </CardContent>
            )}
          </Card>

          {/* Destination Cities */}
          <Card>
            <CardHeader onClick={() => toggleSection('destinations')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Destination Cities
                  </CardTitle>
                  <CardDescription>Add destination cities for seat bookings</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['destinations'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['destinations'] && (
            <CardContent>
              {/* Add New */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  placeholder="Enter destination city"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDestination()}
                />
                <Button onClick={handleAddDestination} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              {destinations.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {destinations.map((destination) => (
                        <TableRow key={destination.id}>
                          <TableCell className="font-medium">{destination.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={destination.active}
                              onCheckedChange={() => handleToggleDestination(destination)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDestinationId(destination.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No destinations added yet
                </p>
              )}
            </CardContent>
            )}
          </Card>

          {/* Buses */}
          <Card>
            <CardHeader onClick={() => toggleSection('buses')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Buses
                  </CardTitle>
                  <CardDescription>Add bus numbers for seat bookings</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['buses'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['buses'] && (
            <CardContent>
              {/* Add New */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  placeholder="Enter bus number (e.g., KA-01-1234)"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBus()}
                />
                <Button onClick={handleAddBus} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              {buses.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bus Number</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buses.map((bus) => (
                        <TableRow key={bus.id}>
                          <TableCell className="font-medium">{bus.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={bus.active}
                              onCheckedChange={() => handleToggleBus(bus)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteBusId(bus.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No buses added yet
                </p>
              )}
            </CardContent>
            )}
          </Card>

          {/* Receiver Names */}
          <Card>
            <CardHeader onClick={() => toggleSection('receivers')} className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Receiver Names</CardTitle>
                  <CardDescription>Manage the list of people who can receive payments</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openSections['receivers'] ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {openSections['receivers'] && (
            <CardContent>
              {/* Add New */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newReceiverName}
                  onChange={(e) => setNewReceiverName(e.target.value)}
                  placeholder="Enter new receiver name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReceiver()}
                />
                <Button onClick={handleAddReceiver} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              {receivers.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivers.map((receiver) => (
                        <TableRow key={receiver.id}>
                          <TableCell className="font-medium">{receiver.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={receiver.active}
                              onCheckedChange={() => handleToggleReceiver(receiver)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(receiver.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No receivers added yet
                </p>
              )}
            </CardContent>
            )}
          </Card>

          <StaffManagement />
        </div>


        {/* Delete Receiver Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Receiver</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this receiver? This won't affect existing payment records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteReceiver} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Travels Dialog */}
        <AlertDialog open={!!deleteTravelId} onOpenChange={() => setDeleteTravelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Travels</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this travels? This won't affect existing tickets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTravel} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Pickup Dialog */}
        <AlertDialog open={!!deletePickupId} onOpenChange={() => setDeletePickupId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pickup Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this pickup location? This won't affect existing tickets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePickup} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Destination Dialog */}
        <AlertDialog open={!!deleteDestinationId} onOpenChange={() => setDeleteDestinationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Destination</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this destination city? This won't affect existing bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDestination} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Agent Dialog */}
        <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this agent? This won't affect existing bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Agents Dialog */}
        <AlertDialog open={showClearAgentsDialog} onOpenChange={setShowClearAgentsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Agents</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ALL agents? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllAgents} className="bg-destructive hover:bg-destructive/90">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Bus Dialog */}
        <AlertDialog open={!!deleteBusId} onOpenChange={() => setDeleteBusId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bus</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this bus? This won't affect existing bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBus} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}