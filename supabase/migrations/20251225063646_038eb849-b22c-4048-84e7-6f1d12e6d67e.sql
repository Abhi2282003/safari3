-- Create table to track agent collection payments with advance handling
CREATE TABLE public.agent_collection_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  received_by TEXT NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agent_collection_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own agent_collection_payments" 
ON public.agent_collection_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent_collection_payments" 
ON public.agent_collection_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent_collection_payments" 
ON public.agent_collection_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent_collection_payments" 
ON public.agent_collection_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add advance_balance column to agents table to track advance payments
ALTER TABLE public.agents ADD COLUMN advance_balance NUMERIC NOT NULL DEFAULT 0;