-- Create attributes system for product filtering
-- This migration creates tables for managing product attributes and their values

-- Drop existing tables if they exist (to handle partial migrations)
DROP TABLE IF EXISTS public.product_attributes CASCADE;
DROP TABLE IF EXISTS public.attribute_values CASCADE;
DROP TABLE IF EXISTS public.attributes CASCADE;

-- 1. Create attributes table (e.g., "Color", "Size", "Material")
CREATE TABLE public.attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('select', 'multiselect', 'text', 'number', 'boolean')),
    display_order INTEGER DEFAULT 0,
    filterable BOOLEAN DEFAULT true,
    visible_in_catalog BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create attribute_values table (e.g., "Red", "Blue", "Large", "Small")
CREATE TABLE public.attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attribute_id, slug)
);

-- 3. Create product_attributes junction table (connects products with attribute values)
CREATE TABLE public.product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
    attribute_value_id UUID REFERENCES public.attribute_values(id) ON DELETE CASCADE,
    custom_value TEXT, -- For text/number types where value is not predefined
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, attribute_id, attribute_value_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attributes_slug ON public.attributes(slug);
CREATE INDEX IF NOT EXISTS idx_attributes_filterable ON public.attributes(filterable);
CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute_id ON public.attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_slug ON public.attribute_values(slug);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute_id ON public.product_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_value_id ON public.product_attributes(attribute_value_id);

-- Enable Row Level Security
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attributes
CREATE POLICY "Anyone can view attributes"
    ON public.attributes FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Admins can manage attributes"
    ON public.attributes FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for attribute_values
CREATE POLICY "Anyone can view attribute values"
    ON public.attribute_values FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Admins can manage attribute values"
    ON public.attribute_values FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for product_attributes
CREATE POLICY "Anyone can view product attributes"
    ON public.product_attributes FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Admins can manage product attributes"
    ON public.product_attributes FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert some common attributes for beauty salon shop
INSERT INTO public.attributes (name, slug, type, display_order) VALUES
    ('Farbe', 'farbe', 'select', 1),
    ('Größe', 'grosse', 'select', 2),
    ('Material', 'material', 'select', 3),
    ('Hauttyp', 'hauttyp', 'multiselect', 4),
    ('Marke', 'marke', 'select', 5),
    ('Volumen', 'volumen', 'select', 6),
    ('Duft', 'duft', 'select', 7),
    ('Bio', 'bio', 'boolean', 8),
    ('Vegan', 'vegan', 'boolean', 9),
    ('Tierversuchsfrei', 'tierversuchsfrei', 'boolean', 10)
ON CONFLICT (slug) DO NOTHING;

-- Insert common attribute values
DO $$
DECLARE
    farbe_id UUID;
    grosse_id UUID;
    hauttyp_id UUID;
    volumen_id UUID;
BEGIN
    -- Get attribute IDs
    SELECT id INTO farbe_id FROM public.attributes WHERE slug = 'farbe';
    SELECT id INTO grosse_id FROM public.attributes WHERE slug = 'grosse';
    SELECT id INTO hauttyp_id FROM public.attributes WHERE slug = 'hauttyp';
    SELECT id INTO volumen_id FROM public.attributes WHERE slug = 'volumen';

    -- Colors
    IF farbe_id IS NOT NULL THEN
        INSERT INTO public.attribute_values (attribute_id, value, slug, display_order) VALUES
            (farbe_id, 'Schwarz', 'schwarz', 1),
            (farbe_id, 'Weiß', 'weiss', 2),
            (farbe_id, 'Rot', 'rot', 3),
            (farbe_id, 'Rosa', 'rosa', 4),
            (farbe_id, 'Blau', 'blau', 5),
            (farbe_id, 'Gold', 'gold', 6),
            (farbe_id, 'Silber', 'silber', 7)
        ON CONFLICT (attribute_id, slug) DO NOTHING;
    END IF;

    -- Sizes
    IF grosse_id IS NOT NULL THEN
        INSERT INTO public.attribute_values (attribute_id, value, slug, display_order) VALUES
            (grosse_id, 'Klein', 'klein', 1),
            (grosse_id, 'Mittel', 'mittel', 2),
            (grosse_id, 'Groß', 'gross', 3),
            (grosse_id, 'Extra Groß', 'extra-gross', 4)
        ON CONFLICT (attribute_id, slug) DO NOTHING;
    END IF;

    -- Skin types
    IF hauttyp_id IS NOT NULL THEN
        INSERT INTO public.attribute_values (attribute_id, value, slug, display_order) VALUES
            (hauttyp_id, 'Normale Haut', 'normale-haut', 1),
            (hauttyp_id, 'Trockene Haut', 'trockene-haut', 2),
            (hauttyp_id, 'Fettige Haut', 'fettige-haut', 3),
            (hauttyp_id, 'Mischhaut', 'mischhaut', 4),
            (hauttyp_id, 'Empfindliche Haut', 'empfindliche-haut', 5)
        ON CONFLICT (attribute_id, slug) DO NOTHING;
    END IF;

    -- Volumes
    IF volumen_id IS NOT NULL THEN
        INSERT INTO public.attribute_values (attribute_id, value, slug, display_order) VALUES
            (volumen_id, '30ml', '30ml', 1),
            (volumen_id, '50ml', '50ml', 2),
            (volumen_id, '100ml', '100ml', 3),
            (volumen_id, '200ml', '200ml', 4),
            (volumen_id, '500ml', '500ml', 5),
            (volumen_id, '1L', '1l', 6)
        ON CONFLICT (attribute_id, slug) DO NOTHING;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attributes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attributes table
DROP TRIGGER IF EXISTS update_attributes_timestamp ON public.attributes;
CREATE TRIGGER update_attributes_timestamp
    BEFORE UPDATE ON public.attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_attributes_updated_at();

COMMENT ON TABLE public.attributes IS 'Stores attribute definitions (e.g., Color, Size, Material)';
COMMENT ON TABLE public.attribute_values IS 'Stores predefined values for select/multiselect attributes';
COMMENT ON TABLE public.product_attributes IS 'Junction table linking products with their attribute values';
