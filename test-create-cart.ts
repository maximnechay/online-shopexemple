// Test script to create abandoned cart with 1h trigger time
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
