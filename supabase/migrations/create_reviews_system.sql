-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
-- Everyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
    ON public.reviews
    FOR SELECT
    USING (status = 'approved');

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
CREATE POLICY "Users can update own pending reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policy (using custom claims or specific role check)
-- For now, we'll handle admin operations through service role

-- Function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product's average rating and review count
    UPDATE public.products
    SET 
        rating = (
            SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
            FROM public.reviews
            WHERE product_id = NEW.product_id AND status = 'approved'
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE product_id = NEW.product_id AND status = 'approved'
        )
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating when review is approved/updated/deleted
CREATE TRIGGER update_rating_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Add rating and reviews_count columns to products if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'rating') THEN
        ALTER TABLE public.products ADD COLUMN rating NUMERIC(3,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'reviews_count') THEN
        ALTER TABLE public.products ADD COLUMN reviews_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing products with current ratings
UPDATE public.products p
SET 
    rating = COALESCE((
        SELECT AVG(r.rating)::numeric(3,2)
        FROM public.reviews r
        WHERE r.product_id = p.id AND r.status = 'approved'
    ), 0),
    reviews_count = COALESCE((
        SELECT COUNT(*)
        FROM public.reviews r
        WHERE r.product_id = p.id AND r.status = 'approved'
    ), 0);
