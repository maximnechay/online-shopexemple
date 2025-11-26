// Test race condition protection
// Run: npx ts-node test-race-condition.ts

import { supabaseAdmin } from './lib/supabase/admin';
import { decreaseStock } from './lib/inventory/stock-manager';

const TEST_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_ORDER_ID = '088802bd-9ad4-4ee0-9cf8-741a414164ef'; // Существующий заказ
const TEST_USER_ID = '9e68a22a-a587-460c-a40a-39d1a9582c59'; // Существующий пользователь

async function setupTestOrder() {
    console.log('📝 Using existing test order...');
    console.log('✅ Test order ready (ID: 088802bd-9ad4-4ee0-9cf8-741a414164ef)');
}

async function setupTestProduct() {
    console.log('📦 Setting up test product...');

    // Сначала проверим существующую структуру
    const { data: existingProduct } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', TEST_PRODUCT_ID)
        .single();

    if (existingProduct) {
        // Просто обновим stock
        const { error } = await supabaseAdmin
            .from('products')
            .update({ stock_quantity: 5 })
            .eq('id', TEST_PRODUCT_ID);

        if (error) {
            console.error('❌ Error updating test product:', error);
            throw error;
        }
    } else {
        // Создаём новый товар (минимальные поля)
        // price в копейках: 9999 = 99.99€
        const { error } = await supabaseAdmin
            .from('products')
            .insert({
                id: TEST_PRODUCT_ID,
                name: 'Test Product - Race Condition',
                slug: 'test-product-race-condition',
                category: 'test',
                price: 9999,  // В копейках (99.99€)
                stock_quantity: 5,
                description: 'Product for testing race condition protection',
            });

        if (error) {
            console.error('❌ Error creating test product:', error);
            throw error;
        }
    }

    console.log('✅ Test product ready with stock = 5');
}

async function getStock(): Promise<number> {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', TEST_PRODUCT_ID)
        .single();

    if (error) throw error;
    return data.stock_quantity;
}

async function test1_NormalPurchase() {
    console.log('\n🧪 Test 1: Normal purchase');

    const result = await decreaseStock(
        [{ productId: TEST_PRODUCT_ID, quantity: 2 }],
        TEST_ORDER_ID,  // Используем тестовый order_id
        'test-payment-1'
    );

    console.log('Result:', result);
    const stock = await getStock();
    console.log('Stock after purchase:', stock);

    if (result.success && stock === 3) {
        console.log('✅ Test 1 passed');
    } else {
        console.log('❌ Test 1 failed');
    }
}

async function test2_InsufficientStock() {
    console.log('\n🧪 Test 2: Purchase with insufficient stock');

    const result = await decreaseStock(
        [{ productId: TEST_PRODUCT_ID, quantity: 10 }],
        TEST_ORDER_ID,
        'test-payment-2'
    );

    console.log('Result:', result);
    const stock = await getStock();
    console.log('Stock after failed purchase:', stock);

    if (!result.success && stock === 3) {
        console.log('✅ Test 2 passed - correctly rejected');
    } else {
        console.log('❌ Test 2 failed');
    }
}

async function test3_RaceCondition() {
    console.log('\n🧪 Test 3: Race condition - two buyers for last item');

    // Reset stock to 1
    await supabaseAdmin
        .from('products')
        .update({ stock_quantity: 1 })
        .eq('id', TEST_PRODUCT_ID);

    console.log('Stock set to 1');

    // Two simultaneous purchases
    console.log('Starting simultaneous purchases...');
    const [result1, result2] = await Promise.all([
        decreaseStock(
            [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
            TEST_ORDER_ID,
            'race-test-1'
        ),
        decreaseStock(
            [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
            TEST_ORDER_ID,
            'race-test-2'
        ),
    ]);

    console.log('Result 1:', result1);
    console.log('Result 2:', result2);

    const finalStock = await getStock();
    console.log('Final stock:', finalStock);

    // One should succeed, one should fail
    const oneSucceeded = (result1.success && !result2.success) ||
        (!result1.success && result2.success);

    if (oneSucceeded && finalStock === 0) {
        console.log('✅ Test 3 passed - race condition prevented!');
        console.log('   - One purchase succeeded');
        console.log('   - One purchase failed');
        console.log('   - Stock = 0 (not negative)');
    } else {
        console.log('❌ Test 3 failed');
        console.log('   - Both succeeded:', result1.success && result2.success);
        console.log('   - Both failed:', !result1.success && !result2.success);
        console.log('   - Final stock:', finalStock);
    }
}

async function test4_MultipleItems() {
    console.log('\n🧪 Test 4: Multiple items in one order');

    // Reset stock to 3
    await supabaseAdmin
        .from('products')
        .update({ stock_quantity: 3 })
        .eq('id', TEST_PRODUCT_ID);

    const result = await decreaseStock(
        [
            { productId: TEST_PRODUCT_ID, quantity: 1 },
            { productId: TEST_PRODUCT_ID, quantity: 1 },
        ],
        TEST_ORDER_ID,
        'test-payment-4'
    );

    console.log('Result:', result);
    const stock = await getStock();
    console.log('Stock after purchase:', stock);

    if (result.success && stock === 1) {
        console.log('✅ Test 4 passed');
    } else {
        console.log('❌ Test 4 failed');
    }
}

async function test5_StressTest() {
    console.log('\n🧪 Test 5: Stress test - 10 concurrent buyers for 5 items');

    // Reset stock to 5
    await supabaseAdmin
        .from('products')
        .update({ stock_quantity: 5 })
        .eq('id', TEST_PRODUCT_ID);

    console.log('Stock set to 5');
    console.log('Starting 10 concurrent purchases...');

    // 10 buyers trying to buy 1 item each
    const purchases = Array.from({ length: 10 }, (_, i) =>
        decreaseStock(
            [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
            TEST_ORDER_ID,
            `stress-test-${i}`
        )
    );

    const results = await Promise.all(purchases);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const finalStock = await getStock();

    console.log(`✅ Succeeded: ${succeeded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📦 Final stock: ${finalStock}`);

    if (succeeded === 5 && failed === 5 && finalStock === 0) {
        console.log('✅ Test 5 passed - exactly 5 purchases succeeded!');
    } else {
        console.log('❌ Test 5 failed');
        console.log('   Expected: 5 succeeded, 5 failed, stock = 0');
        console.log(`   Got: ${succeeded} succeeded, ${failed} failed, stock = ${finalStock}`);
    }
}

async function viewStockLogs() {
    console.log('\n📊 Stock logs:');

    const { data, error } = await supabaseAdmin
        .from('stock_logs')
        .select('*, products(name)')
        .eq('product_id', TEST_PRODUCT_ID)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    data?.forEach(log => {
        console.log(`  ${log.created_at}: ${log.event_type} - ${log.quantity_change} (${log.stock_before} → ${log.stock_after})`);
    });
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    await supabaseAdmin
        .from('stock_logs')
        .delete()
        .eq('product_id', TEST_PRODUCT_ID);

    await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', TEST_PRODUCT_ID);

    // НЕ удаляем реальный заказ
    console.log('✅ Cleanup complete (kept real order)');
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting race condition protection tests\n');
    console.log('='.repeat(50));

    try {
        await setupTestOrder();
        await setupTestProduct();
        await test1_NormalPurchase();
        await test2_InsufficientStock();
        await test3_RaceCondition();
        await test4_MultipleItems();
        await test5_StressTest();
        await viewStockLogs();

        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests completed');

        // Uncomment to cleanup
        // await cleanup();
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

runTests();
