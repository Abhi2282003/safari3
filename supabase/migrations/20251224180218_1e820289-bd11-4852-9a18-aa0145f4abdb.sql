-- Create destination_cities table
CREATE TABLE public.destination_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.destination_cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own destinations" 
ON public.destination_cities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own destinations" 
ON public.destination_cities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own destinations" 
ON public.destination_cities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own destinations" 
ON public.destination_cities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add destination column to seat_bookings
ALTER TABLE public.seat_bookings ADD COLUMN destination TEXT;