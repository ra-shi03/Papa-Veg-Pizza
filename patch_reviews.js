const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/store-manager/customers/Reviews.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const val = localStorage\.getItem\("mock_db_customer_reviews"\);/, '// Local storage read removed');
content = content.replace(/localStorage\.setItem\("mock_db_customer_reviews", JSON\.stringify\(mockReviews\)\);/, '// Removed mock DB seeding');
content = content.replace(/localStorage\.setItem\("mock_db_customers", JSON\.stringify\(mockCustomers\)\);/, '');
content = content.replace(/localStorage\.setItem\("mock_db_store_orders", JSON\.stringify\(mockOrders\)\);/, '');
content = content.replace(/localStorage\.setItem\("mock_db_order_items", JSON\.stringify\(mockOrderItems\)\);/, '');

fs.writeFileSync(file, content);
