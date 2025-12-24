-- Add payment_mode column to tickets table
ALTER TABLE public.tickets ADD COLUMN payment_mode text DEFAULT NULL;