-- Add pre-printed ticket layout settings to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS preprinted_layout jsonb DEFAULT NULL;