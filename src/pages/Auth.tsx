import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  pin: z.string()
    .regex(/^(\d{4}|\d{6})$/, 'PIN must be 4 or 6 digits'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({ username: '', pin: '' });

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Convert username to email format for Supabase
  const usernameToEmail = (username: string) => `${username.toLowerCase()}@tickets.local`;

  const handleSubmit = async (mode: 'login' | 'signup') => {
    try {
      const validated = authSchema.parse(formData);
      setIsSubmitting(true);
      
      const email = usernameToEmail(validated.username);
      // Use PIN as password (Supabase requires min 6 chars, so we pad it)
      const password = `pin_${validated.pin}_secure`;

      if (mode === 'login') {
        const uname = validated.username.toLowerCase();
        const { data: lockedUntil } = await supabase.rpc('login_locked_until' as any, { _username: uname });
        if (lockedUntil && new Date(lockedUntil as string) > new Date()) {
          const mins = Math.ceil((new Date(lockedUntil as string).getTime() - Date.now()) / 60000);
          toast.error(`Too many wrong PINs. Try again in ${mins} min.`);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            await supabase.rpc('record_login_attempt' as any, { _username: uname, _success: false });
            toast.error('Invalid username or PIN');
          } else {
            toast.error(error.message);
          }
          return;
        }
        await supabase.rpc('record_login_attempt' as any, { _username: uname, _success: true });
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('This username is already taken. Please choose another.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created successfully!');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pin: digits }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Bus className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Royal Safari</CardTitle>
          <CardDescription>Enter your username and PIN</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="pl-10"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pin">PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="••••"
                    value={formData.pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="pl-10 pr-10 text-center text-xl tracking-[0.5em] font-mono"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => handleSubmit('login')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
