-- Add column to track original amount from agent (before any partial payments)
ALTER TABLE public.seat_bookings 
ADD COLUMN IF NOT EXISTS original_amount_from_agent numeric DEFAULT 0;

-- Update existing rows to set original_amount_from_agent equal to amount_from_agent
UPDATE public.seat_bookings 
SET original_amount_from_agent = amount_from_agent 
WHERE original_amount_from_agent = 0 OR original_amount_from_agent IS NULL;