import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Package, Trash2 } from 'lucide-react';
import { LuggageBooking } from '@/hooks/useLuggageBookings';
import { useLuggageRates } from '@/hooks/useLuggageRates';
import { useLuggageParties } from '@/hooks/useLuggageParties';

interface LuggageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: { id: string; name: string; active: boolean }[];
  onSave: (data: {
    destination: string;
    itemName: string;
    partyName: string;
    quantity: number;
    rate?: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  editingLuggage?: LuggageBooking | null;
}

const OTHER = '__other__';

export function LuggageDialog({
  open,
  onOpenChange,
  destinations,
  onSave,
  onDelete,
  editingLuggage,
}: LuggageDialogProps) {
  const { getItemsFor } = useLuggageRates();
  const { parties } = useLuggageParties();

  // Selected preset party id, or OTHER, or '' (none yet)
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [formData, setFormData] = useState({
    destination: '',
    itemName: '',
    partyName: '',
    quantity: '1',
    rate: '',
  });

  useEffect(() => {
    if (!open) return;
    if (editingLuggage) {
      // Try matching existing preset
      const match = parties.find(
        (p) =>
          p.partyName === editingLuggage.partyName &&
          p.destination === editingLuggage.destination &&
          (p.itemName === editingLuggage.itemName || !editingLuggage.itemName)
      );
      setSelectedPartyId(match ? match.id : OTHER);
      setFormData({
        destination: editingLuggage.destination || '',
        itemName: editingLuggage.itemName || '',
        partyName: editingLuggage.partyName || '',
        quantity: editingLuggage.quantity?.toString() || '1',
        rate: editingLuggage.quantity && editingLuggage.totalAmount ? String(editingLuggage.totalAmount / editingLuggage.quantity) : '',
      });
    } else {
      setSelectedPartyId('');
      setFormData({
        destination: '',
        itemName: '',
        partyName: '',
        quantity: '1',
        rate: '',
      });
    }
  }, [open, editingLuggage, parties]);

  const isOther = selectedPartyId === OTHER;
  const availableItems = useMemo(
    () => getItemsFor(formData.destination),
    [formData.destination, getItemsFor]
  );

  const handlePartyChange = (val: string) => {
    setSelectedPartyId(val);
    if (val === OTHER) {
      setFormData({ destination: '', itemName: '', partyName: '', quantity: formData.quantity, rate: '' });
    } else {
      const p = parties.find((x) => x.id === val);
      if (p) {
        setFormData({
          destination: p.destination,
          itemName: p.itemName,
          partyName: p.partyName,
          quantity: formData.quantity,
          rate: '',
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.partyName.trim()) return;
    if (!formData.destination) return;
    if (!formData.itemName.trim()) return;
    const qty = parseInt(formData.quantity) || 1;
    if (qty <= 0) return;
    const preset = !isOther && selectedPartyId ? parties.find((p) => p.id === selectedPartyId) : undefined;
    let rate: number | undefined = preset?.rate;
    if (isOther) {
      const r = parseFloat(formData.rate);
      if (isNaN(r) || r < 0) return;
      rate = r;
    }
    await onSave({
      destination: formData.destination,
      itemName: formData.itemName.trim(),
      partyName: formData.partyName.trim(),
      quantity: qty,
      rate,
    });
  };

  const activeParties = parties.filter((p) => p.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {editingLuggage ? 'Edit Luggage' : 'Add Luggage'}
          </DialogTitle>
          <DialogDescription>
            Pick a saved party, or choose Other to enter details manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Party</Label>
            <Select value={selectedPartyId} onValueChange={handlePartyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
              <SelectContent>
                {activeParties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.partyName} — {p.destination} ({p.itemName})
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Other (enter manually)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <>
              <div className="grid gap-2">
                <Label>Party Name</Label>
                <Input
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  placeholder="Enter party name"
                />
              </div>

              <div className="grid gap-2">
                <Label>Destination</Label>
                <Select
                  value={formData.destination}
                  onValueChange={(v) => setFormData({ ...formData, destination: v, itemName: '' })}
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
                <Label>Item</Label>
                <Select
                  value={formData.itemName}
                  onValueChange={(v) => setFormData({ ...formData, itemName: v })}
                  disabled={!formData.destination || availableItems.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.destination
                          ? 'Select destination first'
                          : availableItems.length === 0
                          ? 'No items configured for this destination'
                          : 'Select item'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((it) => (
                      <SelectItem key={it.id} value={it.itemName}>
                        {it.itemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {!isOther && selectedPartyId && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <div><span className="text-muted-foreground">Destination:</span> {formData.destination}</div>
              <div><span className="text-muted-foreground">Item:</span> {formData.itemName}</div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {editingLuggage && onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedPartyId}>
            {editingLuggage ? 'Update' : 'Add Luggage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
