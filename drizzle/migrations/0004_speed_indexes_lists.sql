CREATE INDEX IF NOT EXISTS idx_seat_bookings_type_date ON public.seat_bookings (user_id, booking_type, journey_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_user_date_id ON public.seat_bookings (user_id, journey_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_acp_user_date_id ON public.agent_collection_payments (user_id, payment_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_luggage_user_date_id ON public.luggage_bookings (user_id, journey_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_bdt_id ON public.tickets (user_id, booking_date_time DESC, id);