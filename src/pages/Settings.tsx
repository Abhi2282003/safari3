import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Building, Ruler, Bus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { 
  getSettings, 
  saveSettings, 
  getReceivers, 
  saveReceiver, 
  deleteReceiver,
  getTravels,
  addTravel,
  updateTravel,
  deleteTravel as deleteTravelStorage
} from '@/lib/storage';
import { CompanySettings, ReceiverName, TravelsConfig } from '@/types/ticket';
import { toast } from 'sonner';

export default function Settings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    logoUrl: '',
    footerNote: '',
    ticketWidth: 280,
    ticketHeight: 140,
  });
  const [receivers, setReceivers] = useState<ReceiverName[]>([]);
  const [travels, setTravels] = useState<TravelsConfig[]>([]);
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newTravelName, setNewTravelName] = useState('');
  const [newTravelPercent, setNewTravelPercent] = useState('10');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTravelId, setDeleteTravelId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCompanySettings(getSettings());
    setReceivers(getReceivers());
    setTravels(getTravels());
  }, []);

  const handleSaveCompany = () => {
    setIsSaving(true);
    try {
      saveSettings(companySettings);
      toast.success('Company settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReceiver = () => {
    if (!newReceiverName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const receiver: ReceiverName = {
      id: crypto.randomUUID(),
      name: newReceiverName.trim(),
      active: true,
    };

    saveReceiver(receiver);
    setReceivers([...receivers, receiver]);
    setNewReceiverName('');
    toast.success('Receiver added successfully');
  };

  const handleToggleReceiver = (receiver: ReceiverName) => {
    const updated = { ...receiver, active: !receiver.active };
    saveReceiver(updated);
    setReceivers(receivers.map(r => r.id === receiver.id ? updated : r));
  };

  const handleDeleteReceiver = () => {
    if (deleteId) {
      deleteReceiver(deleteId);
      setReceivers(receivers.filter(r => r.id !== deleteId));
      toast.success('Receiver deleted');
      setDeleteId(null);
    }
  };

  // Travels management
  const handleAddTravel = () => {
    if (!newTravelName.trim()) {
      toast.error('Please enter a travels name');
      return;
    }
    const percent = parseFloat(newTravelPercent) || 10;
    if (percent < 0 || percent > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }

    const travel: TravelsConfig = {
      id: crypto.randomUUID(),
      name: newTravelName.trim(),
      commissionPercent: percent,
      active: true,
    };

    addTravel(travel);
    setTravels([...travels, travel]);
    setNewTravelName('');
    setNewTravelPercent('10');
    toast.success('Travels added successfully');
  };

  const handleToggleTravel = (travel: TravelsConfig) => {
    const updated = { ...travel, active: !travel.active };
    updateTravel(updated);
    setTravels(travels.map(t => t.id === travel.id ? updated : t));
  };

  const handleDeleteTravel = () => {
    if (deleteTravelId) {
      deleteTravelStorage(deleteTravelId);
      setTravels(travels.filter(t => t.id !== deleteTravelId));
      toast.success('Travels deleted');
      setDeleteTravelId(null);
    }
  };

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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Details
              </CardTitle>
              <CardDescription>
                These details will appear on printed tickets
              </CardDescription>
            </CardHeader>
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
          </Card>

          {/* Ticket Size Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Ticket Size (mm)
              </CardTitle>
              <CardDescription>
                Set the print dimensions for tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ticketWidth">Width (mm)</Label>
                  <Input
                    id="ticketWidth"
                    type="number"
                    value={companySettings.ticketWidth || 280}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, ticketWidth: parseInt(e.target.value) || 280 }))}
                    placeholder="280"
                    min={150}
                    max={400}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ticketHeight">Height (mm)</Label>
                  <Input
                    id="ticketHeight"
                    type="number"
                    value={companySettings.ticketHeight || 140}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, ticketHeight: parseInt(e.target.value) || 140 }))}
                    placeholder="140"
                    min={80}
                    max={250}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Default: 280mm × 140mm. Adjust based on your printer paper size.
              </p>
              <div className="pt-2">
                <Button onClick={handleSaveCompany} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Ticket Size'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Travels Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Travels & Commission
              </CardTitle>
              <CardDescription>
                Add travels with their commission percentage for collection calculation
              </CardDescription>
            </CardHeader>
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
          </Card>

          {/* Receiver Names */}
          <Card>
            <CardHeader>
              <CardTitle>Receiver Names</CardTitle>
              <CardDescription>
                Manage the list of people who can receive payments
              </CardDescription>
            </CardHeader>
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
          </Card>
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
      </div>
    </Layout>
  );
}
