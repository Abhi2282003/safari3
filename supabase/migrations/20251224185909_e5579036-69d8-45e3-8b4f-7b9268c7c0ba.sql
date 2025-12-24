-- Drop the old unique constraint that doesn't include bus_name
ALTER TABLE public.seat_bookings DROP CONSTRAINT IF EXISTS seat_bookings_user_id_journey_date_seat_number_key;

-- Create new unique constraint that includes bus_name (same seat can be on different buses)
ALTER TABLE public.seat_bookings ADD CONSTRAINT seat_bookings_user_id_journey_date_bus_name_seat_number_key 
UNIQUE (user_id, journey_date, bus_name, seat_number);