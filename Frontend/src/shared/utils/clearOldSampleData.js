// Earlier builds seeded sample (fake) records into the browser's localStorage for screens that had no server data.
// That data is gone from the code; this removes what is still saved in a browser, once, so nobody keeps seeing it.
// Real preferences and caches (cart, recent searches, applied coupon, app config, theme...) are not touched.
const DONE_KEY = 'pvp_sample_data_cleared_v1';

const SAMPLE_KEYS = [
  // store manager: orders, kitchen, staff, inventory, delivery, profile, tasks
  'pvp_incoming_orders', 'pvp_ready_orders', 'pvp_completed_orders', 'pvp_cancelled_orders', 'pvp_refunds', 'pvp_riders',
  'pvp_available_riders', 'pvp_delivery_assignments', 'pvp_delayed_orders', 'pvp_escalations', 'pvp_management_staff',
  'pvp_kitchen_chefs', 'pvp_kitchen_staff', 'pvp_kitchen_issues', 'pvp_kitchen_attendance', 'pvp_kitchen_shifts',
  'pvp_kitchen_performance', 'pvp_kitchen_tasks_data', 'pvp_baking_items', 'pvp_baking_staff', 'pvp_ovens_status',
  'pvp_packaging_logs', 'pvp_packaging_orders', 'pvp_packaging_staff', 'pvp_pizza_station_items', 'pvp_preparation_items',
  'pvp_ingredient_shortages', 'pvp_ingredients_stock', 'pvp_inventory_alerts', 'pvp_inventory_ingredients',
  'pvp_inventory_shortages', 'pvp_inventory_transactions', 'pvp_stock_requests', 'pvp_stock_transfers', 'pvp_waste_logs',
  'pvp_store_profile_data', 'demo_user_role',
  // franchise admin: products, store pricing
  'pvp_products_db', 'pvp_variants_db', 'pvp_store_pricing_db', 'pvp_product_images_db', 'pvp_price_history_db', 'pvp_store_products_db',
  // super admin marketing (the coupons cache refills from the server)
  'pvp_campaigns', 'pvp_notifications', 'pvp_queue_jobs', 'pvp_coupons',
];
const SAMPLE_PREFIXES = ['mock_db_', 'pv_']; // franchise inventory (mock_db_*) and customers / loyalty / reviews (pv_*)

export function clearOldSampleData() {
  try {
    if (localStorage.getItem(DONE_KEY)) return;
    for (const key of SAMPLE_KEYS) localStorage.removeItem(key);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && SAMPLE_PREFIXES.some((p) => key.startsWith(p))) localStorage.removeItem(key);
    }
    localStorage.setItem(DONE_KEY, '1');
  } catch (_) {
    // storage blocked (private mode): nothing saved there anyway
  }
}
