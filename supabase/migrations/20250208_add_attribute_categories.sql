-- Add category relationships to attributes
ALTER TABLE attributes 
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Update existing attributes with relevant categories
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care']::TEXT[] WHERE slug = 'hauttyp';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care', 'makeup']::TEXT[] WHERE slug = 'farbe';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care']::TEXT[] WHERE slug = 'grosse';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care']::TEXT[] WHERE slug = 'material';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care', 'makeup']::TEXT[] WHERE slug = 'marke';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care']::TEXT[] WHERE slug = 'volumen';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care']::TEXT[] WHERE slug = 'duft';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care', 'makeup']::TEXT[] WHERE slug = 'bio';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care', 'makeup']::TEXT[] WHERE slug = 'vegan';
UPDATE attributes SET categories = ARRAY['face-care', 'body-care', 'hair-care', 'makeup']::TEXT[] WHERE slug = 'tierversuchsfrei';

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_attributes_categories ON attributes USING GIN (categories);

COMMENT ON COLUMN attributes.categories IS 'Array of category slugs where this attribute is applicable';
