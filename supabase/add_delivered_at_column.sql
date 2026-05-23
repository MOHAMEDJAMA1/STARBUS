-- ADD DELIVERED_AT COLUMN
-- This column is required for the "Mark as Taken" functionality.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'shipments'
        AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE public.shipments ADD COLUMN delivered_at timestamp with time zone;
    END IF;
END $$;
