-- SHIPMENT SEARCH INDEXES (OPTIMIZED)
-- These indexes ensure lightning-fast 'ilike' searches across all fields.
-- MUST be run with pg_trgm extension enabled.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram Indexes for broad text searching (Required for ilike %term%)
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_name_trgm ON public.shipments USING gin (receiver_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_name_trgm ON public.shipments USING gin (sender_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone_trgm ON public.shipments USING gin (receiver_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_phone_trgm ON public.shipments USING gin (sender_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_bus_number_trgm ON public.shipments USING gin (bus_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number_trgm ON public.shipments USING gin (tracking_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_description_trgm ON public.shipments USING gin (description gin_trgm_ops);

-- Standard Indexes for exact matches and filtering
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_destination_branch_id ON public.shipments (destination_branch_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments (created_at DESC);
