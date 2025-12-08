-- Create product_variants table for linking related products (e.g., same product in different sizes)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL, -- 'size', 'color', 'volume', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate variants
  UNIQUE(parent_product_id, variant_product_id),
  -- Prevent self-reference
  CHECK (parent_product_id != variant_product_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_parent ON product_variants(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_variant ON product_variants(variant_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON product_variants(variant_type);

-- RLS Policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Anyone can view product variants
CREATE POLICY "Anyone can view product variants"
  ON product_variants
  FOR SELECT
  USING (true);

-- Only admins can manage product variants
CREATE POLICY "Admins can manage product variants"
  ON product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add variant_group column to products table to group related products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS variant_group UUID;

-- Index for variant groups
CREATE INDEX IF NOT EXISTS idx_products_variant_group ON products(variant_group);

COMMENT ON TABLE product_variants IS 'Links related product variants (e.g., same product in different sizes/colors)';
COMMENT ON COLUMN products.variant_group IS 'UUID to group related product variants together';
