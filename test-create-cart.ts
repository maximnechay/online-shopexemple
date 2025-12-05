// Test script to create abandoned cart with 1h trigger time
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ftnesgtxepluwpicbydh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmVzZ3R4ZXBsdXdwaWNieWRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3MTc3NywiZXhwIjoyMDc5MTQ3Nzc3fQ.iRgMkjl2PYadAJZuz9iyYZeaPLfw43bTpJz5Wgg4w4Y'
);

async function createTestCart() {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago for 24h email

    const testCart = {
        email: 'nechay1996@gmail.com',
        cart_items: [
            {
                id: 'test-1',
                name: 'Premium Face Serum',
                price: 89.99,
                quantity: 1,
                image: 'https://via.placeholder.com/150/FFC0CB/000000?text=Serum'
            },
            {
                id: 'test-2',
                name: 'Luxus Gesichtscreme',
                price: 125.50,
                quantity: 2,
                image: 'https://via.placeholder.com/150/FFD700/000000?text=Cream'
            }
        ],
        cart_total: 340.99,
        recovery_token: `test-${Date.now()}`,
        created_at: oneDayAgo.toISOString(),
        email_1h_sent: true,  // Already sent 1h
        email_24h_sent: false, // Ready for 24h
        email_3d_sent: false,
        coupon_code: null, // Will be generated
        user_agent: 'Test Script',
        utm_source: 'test',
        utm_medium: 'manual',
        utm_campaign: 'email_design_test'
    };

    const { data, error } = await supabase
        .from('abandoned_carts')
        .insert(testCart)
        .select();

    if (error) {
        console.error('Error creating test cart:', error);
    } else {
        console.log('Test cart created successfully:', data);
    }
}

createTestCart();
