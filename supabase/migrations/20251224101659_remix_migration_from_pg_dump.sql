CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'ROYAL TRAVELS'::text NOT NULL,
    address text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    logo_url text,
    footer_note text DEFAULT 'Wish you a Happy Journey!'::text,
    ticket_width integer DEFAULT 280,
    ticket_height integer DEFAULT 140,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    received_by_name text NOT NULL,
    payment_mode text NOT NULL,
    paid_amount numeric(10,2) NOT NULL,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_payment_mode_check CHECK ((payment_mode = ANY (ARRAY['Cash'::text, 'UPI'::text, 'Card'::text, 'Other'::text])))
);


--
-- Name: receivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_counters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    counter_date date NOT NULL,
    counter_value integer DEFAULT 0 NOT NULL
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ticket_no text NOT NULL,
    booking_date_time timestamp with time zone DEFAULT now() NOT NULL,
    journey_date date NOT NULL,
    passenger_name text NOT NULL,
    passenger_phone text NOT NULL,
    passenger_address text,
    tours_to text NOT NULL,
    no_of_tourist integer DEFAULT 1 NOT NULL,
    seat_no text,
    rep_time text,
    dep_time text,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    surcharges numeric(10,2) DEFAULT 0,
    travels_name text,
    bus_name text,
    bus_no text,
    branch text,
    booked_by text,
    with_family boolean DEFAULT false,
    collection_status text DEFAULT 'Unpaid'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tickets_collection_status_check CHECK ((collection_status = ANY (ARRAY['Paid'::text, 'Unpaid'::text])))
);


--
-- Name: travels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    commission_percent numeric(5,2) DEFAULT 10 NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_user_id_key UNIQUE (user_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: receivers receivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receivers
    ADD CONSTRAINT receivers_pkey PRIMARY KEY (id);


--
-- Name: ticket_counters ticket_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_counters
    ADD CONSTRAINT ticket_counters_pkey PRIMARY KEY (id);


--
-- Name: ticket_counters ticket_counters_user_id_counter_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_counters
    ADD CONSTRAINT ticket_counters_user_id_counter_date_key UNIQUE (user_id, counter_date);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_no_key UNIQUE (ticket_no);


--
-- Name: travels travels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travels
    ADD CONSTRAINT travels_pkey PRIMARY KEY (id);


--
-- Name: company_settings update_company_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tickets update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments payments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_counters Users can create their own counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own counters" ON public.ticket_counters FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: payments Users can create their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: receivers Users can create their own receivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own receivers" ON public.receivers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: company_settings Users can create their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own settings" ON public.company_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: travels Users can create their own travels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own travels" ON public.travels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: payments Users can delete their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: receivers Users can delete their own receivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own receivers" ON public.receivers FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tickets Users can delete their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tickets" ON public.tickets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: travels Users can delete their own travels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own travels" ON public.travels FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ticket_counters Users can update their own counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own counters" ON public.ticket_counters FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: payments Users can update their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: receivers Users can update their own receivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own receivers" ON public.receivers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: company_settings Users can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own settings" ON public.company_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tickets Users can update their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tickets" ON public.tickets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: travels Users can update their own travels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own travels" ON public.travels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ticket_counters Users can view their own counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own counters" ON public.ticket_counters FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payments Users can view their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: receivers Users can view their own receivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own receivers" ON public.receivers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: company_settings Users can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own settings" ON public.company_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: travels Users can view their own travels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own travels" ON public.travels FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: company_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: receivers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.receivers ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: travels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;