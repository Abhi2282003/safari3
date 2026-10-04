import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';

interface Staff {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  active: boolean;
  created_at: string;
}

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load staff');
    setStaff((data as Staff[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setUsername(''); setFullName(''); setPin(''); };

  const handleAdd = async () => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return toast.error('Username 3-20 chars (letters, numbers, _)');
    if (!fullName.trim()) return toast.error('Full name required');
    if (!/^\d{6}$/.test(pin)) return toast.error('PIN must be exactly 6 digits');
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-create-staff', {
      body: { username: username.toLowerCase(), full_name: fullName.trim(), pin },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Failed to create staff');
      return;
    }
    toast.success('Staff added');
    setOpen(false);
    reset();
    load();
  };

  const toggleActive = async (s: Staff) => {
    const { error } = await supabase.from('staff_members').update({ active: !s.active }).eq('id', s.id);
    if (error) return toast.error('Failed to update');
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Staff Members</CardTitle>
          <CardDescription>Create staff accounts (username + 6-digit PIN). They can only access Pay Collection and Daily Hisab.</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><UserPlus className="h-4 w-4" />Add Staff</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-muted-foreground">No staff added yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.username}</TableCell>
                  <TableCell>
                    <Badge variant={s.active ? 'default' : 'secondary'}>{s.active ? 'Active' : 'Disabled'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>They sign in with this username and 6-digit PIN.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Santosh Kumar" />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="santosh" autoCapitalize="none" />
            </div>
            <div className="space-y-2">
              <Label>6-Digit PIN</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" maxLength={6} className="text-center tracking-[0.5em] font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
