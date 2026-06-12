ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS whatsapp_template text DEFAULT 'Hello {agent_name}, this is a friendly reminder from {company_name}. You have pending collections of ₹{total_pending} for the following bookings:

{bookings}

Total: ₹{total_pending}

Please arrange the payment at your earliest convenience. Thank you!',
ADD COLUMN IF NOT EXISTS whatsapp_reminder_enabled boolean DEFAULT false;