// Тестирование системы abandoned cart emails
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailSystem() {
    console.log('\n=== Тестирование системы Abandoned Cart Emails ===\n');
    console.log('Текущее время:', new Date().toISOString());

    // 1. Создаем тестовую корзину (1.5 часа назад)
    console.log('\n1. Создание тестовой корзины (1.5 часа назад)...');
    const { data: newCart, error: insertError } = await supabase
        .from('abandoned_carts')
        .insert({
            email: 'test-1h@example.com',
            cart_items: [
                {
                    name: 'Test Product',
                    slug: 'test',
                    price: 50,
                    quantity: 1,
                    product_id: '5b602d30-ac78-4fd5-892a-2ece588e23e2'
                }
            ],
            cart_total: 50.00,
            recovery_token: 'test-token-' + Math.random().toString(36).substring(7),
            created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 часа назад
            updated_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

    if (insertError) {
        console.error('Ошибка создания корзины:', insertError);
        return;
    }

    console.log('✓ Корзина создана:', newCart.id);
    console.log('  Email:', newCart.email);
    console.log('  Created:', newCart.created_at);

    // 2. Проверяем, какие корзины попадают в 1h окно
    console.log('\n2. Проверка корзин для 1h email...');
    const { data: carts1h, error: error1h } = await supabase
        .rpc('get_carts_for_email_trigger', { email_type: '1h' });

    if (error1h) {
        console.error('Ошибка:', error1h);
    } else {
        console.log(`  Найдено корзин: ${carts1h?.length || 0}`);
        if (carts1h && carts1h.length > 0) {
            carts1h.forEach((cart, idx) => {
                console.log(`  ${idx + 1}. ${cart.email} - ${cart.id}`);
            });
        }
    }

    // 3. Отправляем email через API
    console.log('\n3. Отправка 1h emails через API...');
    const response = await fetch('http://localhost:3000/api/abandoned-cart/send-emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer my_super_secret_cron_key_2024_beauty_salon',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailType: '1h' })
    });

    const result = await response.json();
    console.log('  Результат:', JSON.stringify(result, null, 2));

    // 4. Проверяем статус отправки
    console.log('\n4. Проверка статуса корзины после отправки...');
    const { data: updatedCart, error: selectError } = await supabase
        .from('abandoned_carts')
        .select('id, email, email_1h_sent, email_1h_sent_at, created_at')
        .eq('id', newCart.id)
        .single();

    if (selectError) {
        console.error('Ошибка:', selectError);
    } else {
        console.log('  ID:', updatedCart.id);
        console.log('  Email:', updatedCart.email);
        console.log('  1h email sent:', updatedCart.email_1h_sent);
        console.log('  Sent at:', updatedCart.email_1h_sent_at);
    }

    // 5. Показываем все корзины
    console.log('\n5. Все активные корзины:');
    const { data: allCarts } = await supabase
        .from('abandoned_carts')
        .select('id, email, created_at, email_1h_sent, email_24h_sent, recovered_at')
        .is('recovered_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (allCarts && allCarts.length > 0) {
        allCarts.forEach((cart, idx) => {
            const age = Math.round((Date.now() - new Date(cart.created_at).getTime()) / (60 * 60 * 1000) * 10) / 10;
            console.log(`  ${idx + 1}. ${cart.email}`);
            console.log(`     Возраст: ${age}ч | 1h: ${cart.email_1h_sent ? '✓' : '✗'} | 24h: ${cart.email_24h_sent ? '✓' : '✗'}`);
        });
    }

    console.log('\n=== Тест завершен ===\n');
}

testEmailSystem().catch(console.error);
