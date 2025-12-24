-- Create pickup_locations table
CREATE TABLE public.pickup_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pickups" 
ON public.pickup_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pickups" 
ON public.pickup_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pickups" 
ON public.pickup_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pickups" 
ON public.pickup_locations 
FOR DELETE 
USING (auth.uid() = user_id);