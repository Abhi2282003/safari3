-- Create buses table for managing bus numbers
CREATE TABLE public.buses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own buses" 
ON public.buses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own buses" 
ON public.buses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buses" 
ON public.buses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buses" 
ON public.buses FOR DELETE 
USING (auth.uid() = user_id);