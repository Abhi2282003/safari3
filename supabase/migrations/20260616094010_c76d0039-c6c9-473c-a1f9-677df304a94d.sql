
ALTER TABLE public.luggage_rates ADD COLUMN IF NOT EXISTS item_name text NOT NULL DEFAULT 'Default';
ALTER TABLE public.luggage_rates DROP CONSTRAINT IF EXISTS luggage_rates_user_id_destination_key;
ALTER TABLE public.luggage_rates ADD CONSTRAINT luggage_rates_user_dest_item_key UNIQUE (user_id, destination, item_name);

ALTER TABLE public.luggage_bookings ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE public.luggage_bookings ADD COLUMN IF NOT EXISTS party_name text;
