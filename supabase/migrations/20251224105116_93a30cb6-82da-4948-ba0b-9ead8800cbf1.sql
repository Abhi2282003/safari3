-- Add unique constraint on ticket_id in payments table to allow upsert
ALTER TABLE public.payments ADD CONSTRAINT payments_ticket_id_unique UNIQUE (ticket_id);