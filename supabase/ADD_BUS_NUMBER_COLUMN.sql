-- ADD BUS NUMBER COLUMN TO SHIPMENTS
-- This script adds the bus_number column to the shipments table to track which bus carried the package.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'bus_number') THEN
        ALTER TABLE public.shipments ADD COLUMN bus_number text;
    END IF;
END $$;

-- Update the stats function to include any necessary logic if needed (usually not for just a column)
-- But ensuring grants are still valid
GRANT ALL ON TABLE public.shipments TO authenticated;
