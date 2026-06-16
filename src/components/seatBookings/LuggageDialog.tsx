import { useState, useEffect } from 'react';
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

interface LuggageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: { id: string; name: string; active: boolean }[];
  onSave: (data: { destination: string; quantity: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
  editingLuggage?: LuggageBooking | null;
}

export function LuggageDialog({
  open,
  onOpenChange,
  destinations,
  onSave,
  onDelete,
  editingLuggage,
}: LuggageDialogProps) {
  const [formData, setFormData] = useState({ destination: '', quantity: '1' });

  useEffect(() => {
    if (open) {
      if (editingLuggage) {
        setFormData({
          destination: editingLuggage.destination || '',
          quantity: editingLuggage.quantity?.toString() || '1',
        });
      } else {
        setFormData({
          destination: destinations.find((d) => d.active)?.name || '',
          quantity: '1',
        });
      }
    }
  }, [open, editingLuggage, destinations]);

  const handleSave = async () => {
    if (!formData.destination) return;
    const qty = parseInt(formData.quantity) || 1;
    if (qty <= 0) return;
    await onSave({ destination: formData.destination, quantity: qty });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {editingLuggage ? 'Edit Luggage' : 'Add Luggage'}
          </DialogTitle>
          <DialogDescription>Enter destination and quantity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
          <Button onClick={handleSave}>{editingLuggage ? 'Update' : 'Add Luggage'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
