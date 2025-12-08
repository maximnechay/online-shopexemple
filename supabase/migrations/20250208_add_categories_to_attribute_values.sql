-- Add category relationships to attribute values
-- This allows filtering attribute values by category (e.g., different brands for different categories)

ALTER TABLE attribute_values 
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Add index for efficient category filtering on values
CREATE INDEX IF NOT EXISTS idx_attribute_values_categories ON attribute_values USING GIN (categories);

COMMENT ON COLUMN attribute_values.categories IS 'Array of category slugs where this attribute value is applicable. If empty, value is shown in all categories where the attribute is used.';

-- Example: You could set specific brands for specific categories
-- UPDATE attribute_values SET categories = ARRAY['face-care', 'body-care']::TEXT[] WHERE value = 'Brand A';
-- UPDATE attribute_values SET categories = ARRAY['hair-care']::TEXT[] WHERE value = 'Brand B';
