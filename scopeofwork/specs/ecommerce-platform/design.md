# Design Document / เอกสารการออกแบบ

## Overview / ภาพรวม

แพลตฟอร์ม E-commerce นี้ถูกออกแบบเป็นระบบ full-stack ที่ทันสมัย ประกอบด้วย:
- **Backend**: Node.js + Express + MongoDB สำหรับ REST API และ business logic
- **Frontend**: React + Redux Toolkit สำหรับ UI และ state management
- **Real-time**: WebSocket (Socket.io) สำหรับการแจ้งเตือนแบบเรียลไทม์
- **Payment**: Stripe integration สำหรับการชำระเงินที่ปลอดภัย
- **Caching**: Redis สำหรับ caching และ session management
- **Storage**: Cloudinary หรือ AWS S3 สำหรับจัดเก็บรูปภาพ

This E-commerce platform is designed as a modern full-stack system consisting of Node.js + Express + MongoDB backend, React + Redux frontend, WebSocket for real-time features, Stripe for payments, Redis for caching, and cloud storage for images.

## Architecture / สถาปัตยกรรม

### System Architecture / สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React + Redux + React Router + Socket.io Client            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  Express.js + CORS + Rate Limiting + JWT Middleware         │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
┌────────┴──────────┐    ┌──────────┴─────────────────────────┐
│  Business Logic   │    │    Real-time Communication         │
│  Controllers      │    │    Socket.io Server                │
│  Services         │    │    Event Handlers                  │
└────────┬──────────┘    └──────────┬─────────────────────────┘
         │                           │
┌────────┴───────────────────────────┴─────────────────────────┐
│                     Data Layer                                │
│  MongoDB (Primary) + Redis (Cache/Sessions)                  │
└───────────────────────────────────────────────────────────────┘
         │
┌────────┴──────────────────────────────────────────────────────┐
│                  External Services                             │
│  Stripe API + Email Service + Cloud Storage (CDN)             │
└────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities / ความรับผิดชอบของแต่ละชั้น


**Client Layer / ชั้นไคลเอนต์:**
- User interface rendering and interaction / การแสดงผลและการโต้ตอบกับผู้ใช้
- State management with Redux / การจัดการ state ด้วย Redux
- Client-side routing / การจัดการเส้นทางฝั่งไคลเอนต์
- Real-time event handling / การจัดการเหตุการณ์แบบเรียลไทม์

**API Gateway Layer / ชั้น API Gateway:**
- Request routing and validation / การกำหนดเส้นทางและตรวจสอบคำขอ
- Authentication and authorization / การยืนยันตัวตนและการอนุญาต
- Rate limiting and security / การจำกัดอัตราและความปลอดภัย
- Error handling / การจัดการข้อผิดพลาด

**Business Logic Layer / ชั้น Business Logic:**
- Core application logic / ตรรกะหลักของแอปพลิเคชัน
- Data validation and transformation / การตรวจสอบและแปลงข้อมูล
- Business rules enforcement / การบังคับใช้กฎทางธุรกิจ

**Data Layer / ชั้นข้อมูล:**
- Data persistence and retrieval / การจัดเก็บและดึงข้อมูล
- Caching for performance / การแคชเพื่อประสิทธิภาพ
- Data integrity and consistency / ความสมบูรณ์และความสอดคล้องของข้อมูล

## Components and Interfaces / คอมโพเนนต์และอินเทอร์เฟซ

### Backend Components / คอมโพเนนต์ Backend

#### 1. Authentication Service / บริการยืนยันตัวตน
```javascript
// Interface
class AuthService {
  async register(userData) // สร้างบัญชีผู้ใช้ใหม่
  async login(email, password) // เข้าสู่ระบบและออก JWT
  async verifyToken(token) // ตรวจสอบ JWT token
  async refreshToken(refreshToken) // รีเฟรช JWT token
}
```


#### 2. Product Service / บริการสินค้า
```javascript
class ProductService {
  async createProduct(productData) // สร้างสินค้าใหม่
  async updateProduct(id, updates) // อัปเดตข้อมูลสินค้า
  async deleteProduct(id) // ลบสินค้า
  async getProduct(id) // ดึงข้อมูลสินค้าตาม ID
  async searchProducts(query, filters, pagination) // ค้นหาและกรองสินค้า
  async updateStock(id, quantity) // อัปเดตสต็อกสินค้า
}
```

#### 3. Cart Service / บริการตะกร้าสินค้า
```javascript
class CartService {
  async getCart(userId) // ดึงตะกร้าสินค้าของผู้ใช้
  async addToCart(userId, productId, quantity) // เพิ่มสินค้าลงตะกร้า
  async updateCartItem(userId, productId, quantity) // อัปเดตจำนวนสินค้า
  async removeFromCart(userId, productId) // ลบสินค้าออกจากตะกร้า
  async clearCart(userId) // ล้างตะกร้าสินค้า
  async validateCart(userId) // ตรวจสอบความถูกต้องของตะกร้า
}
```

#### 4. Order Service / บริการคำสั่งซื้อ
```javascript
class OrderService {
  async createOrder(userId, cartData, shippingAddress) // สร้างคำสั่งซื้อ
  async getOrder(orderId) // ดึงข้อมูลคำสั่งซื้อ
  async getUserOrders(userId, filters) // ดึงคำสั่งซื้อของผู้ใช้
  async updateOrderStatus(orderId, status) // อัปเดตสถานะคำสั่งซื้อ
  async cancelOrder(orderId) // ยกเลิกคำสั่งซื้อ
}
```

#### 5. Payment Service / บริการชำระเงิน
```javascript
class PaymentService {
  async createPaymentIntent(amount, currency, metadata) // สร้าง payment intent
  async confirmPayment(paymentIntentId) // ยืนยันการชำระเงิน
  async refundPayment(paymentIntentId, amount) // คืนเงิน
  async handleWebhook(event) // จัดการ webhook จาก Stripe
}
```


#### 6. Review Service / บริการรีวิว
```javascript
class ReviewService {
  async createReview(userId, productId, rating, comment) // สร้างรีวิว
  async getProductReviews(productId, pagination) // ดึงรีวิวของสินค้า
  async updateReview(reviewId, updates) // อัปเดตรีวิว
  async deleteReview(reviewId) // ลบรีวิว
  async canUserReview(userId, productId) // ตรวจสอบว่าผู้ใช้สามารถรีวิวได้หรือไม่
}
```

#### 7. Wishlist Service / บริการรายการสินค้าที่สนใจ
```javascript
class WishlistService {
  async getWishlist(userId) // ดึงรายการสินค้าที่สนใจ
  async addToWishlist(userId, productId) // เพิ่มสินค้าลงรายการ
  async removeFromWishlist(userId, productId) // ลบสินค้าออกจากรายการ
  async moveToCart(userId, productId) // ย้ายสินค้าไปยังตะกร้า
}
```

#### 8. Notification Service / บริการแจ้งเตือน
```javascript
class NotificationService {
  async sendEmail(to, subject, template, data) // ส่งอีเมล
  async sendWebSocketNotification(userId, event, data) // ส่งการแจ้งเตือนผ่าน WebSocket
  async notifyOrderStatusChange(orderId, status) // แจ้งเตือนการเปลี่ยนสถานะคำสั่งซื้อ
  async notifyPriceChange(productId, oldPrice, newPrice) // แจ้งเตือนการเปลี่ยนราคา
  async notifyStockAvailable(productId) // แจ้งเตือนสินค้ากลับมามีสต็อก
}
```

#### 9. Cache Service / บริการแคช
```javascript
class CacheService {
  async get(key) // ดึงข้อมูลจากแคช
  async set(key, value, ttl) // บันทึกข้อมูลลงแคช
  async delete(key) // ลบข้อมูลจากแคช
  async invalidatePattern(pattern) // ลบแคชตามรูปแบบ
}
```


### Frontend Components / คอมโพเนนต์ Frontend

#### React Components Structure / โครงสร้างคอมโพเนนต์ React

```
src/
├── components/          # Reusable components / คอมโพเนนต์ที่ใช้ซ้ำได้
│   ├── common/         # Common UI components / คอมโพเนนต์ UI ทั่วไป
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Modal.js
│   │   └── Notification.js
│   ├── product/        # Product-related components / คอมโพเนนต์เกี่ยวกับสินค้า
│   │   ├── ProductCard.js
│   │   ├── ProductList.js
│   │   ├── ProductFilter.js
│   │   └── ProductReviews.js
│   ├── cart/           # Cart components / คอมโพเนนต์ตะกร้า
│   │   ├── CartItem.js
│   │   └── CartSummary.js
│   └── order/          # Order components / คอมโพเนนต์คำสั่งซื้อ
│       ├── OrderCard.js
│       └── OrderTracking.js
├── pages/              # Page components / คอมโพเนนต์หน้า
│   ├── HomePage.js
│   ├── ProductPage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   ├── OrdersPage.js
│   ├── WishlistPage.js
│   └── AdminDashboard.js
├── store/              # Redux store / Redux store
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── productSlice.js
│   │   ├── cartSlice.js
│   │   ├── orderSlice.js
│   │   ├── wishlistSlice.js
│   │   └── notificationSlice.js
│   └── index.js
├── services/           # API services / บริการ API
│   ├── api.js
│   ├── authService.js
│   ├── productService.js
│   ├── cartService.js
│   └── socketService.js
└── hooks/              # Custom hooks / Custom hooks
    ├── useAuth.js
    ├── useCart.js
    ├── useNotifications.js
    └── useWebSocket.js
```


## Data Models / โมเดลข้อมูล

### MongoDB Schemas / MongoDB Schemas

#### User Schema / Schema ผู้ใช้
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  passwordHash: String (required),
  role: String (enum: ['customer', 'admin'], default: 'customer'),
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  wishlist: [ObjectId] (ref: 'Product'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Product Schema / Schema สินค้า
```javascript
{
  _id: ObjectId,
  name: String (required, indexed),
  description: String,
  price: Number (required, min: 0),
  images: [String], // URLs to images / URLs ของรูปภาพ
  stock: Number (default: 0, min: 0),
  category: String (indexed),
  tags: [String],
  active: Boolean (default: true),
  averageRating: Number (default: 0, min: 0, max: 5),
  reviewCount: Number (default: 0),
  lowStockThreshold: Number (default: 10),
  createdAt: Date,
  updatedAt: Date
}
```

#### Order Schema / Schema คำสั่งซื้อ
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique, indexed), // Auto-generated / สร้างอัตโนมัติ
  user: ObjectId (ref: 'User', required),
  items: [{
    product: ObjectId (ref: 'Product', required),
    name: String, // Snapshot at order time / ข้อมูลสำรองเมื่อสั่งซื้อ
    price: Number (required),
    qty: Number (required, min: 1)
  }],
  subtotal: Number (required),
  tax: Number (required),
  shippingCost: Number (required),
  total: Number (required),
  status: String (enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending'),
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  paymentIntentId: String,
  paymentStatus: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date
}
```


#### Review Schema / Schema รีวิว
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: 'Product', required, indexed),
  user: ObjectId (ref: 'User', required),
  order: ObjectId (ref: 'Order', required), // Must have purchased / ต้องซื้อแล้ว
  rating: Number (required, min: 1, max: 5),
  comment: String,
  helpful: Number (default: 0), // Helpful votes / โหวตว่ามีประโยชน์
  verified: Boolean (default: true), // Verified purchase / การซื้อที่ยืนยันแล้ว
  createdAt: Date,
  updatedAt: Date
}
// Compound index on (product, user) for uniqueness
// ดัชนีรวมบน (product, user) เพื่อความไม่ซ้ำกัน
```

#### Cart Schema (Redis) / Schema ตะกร้า (Redis)
```javascript
// Stored in Redis with key: cart:{userId}
// จัดเก็บใน Redis ด้วย key: cart:{userId}
{
  userId: String,
  items: [{
    productId: String,
    quantity: Number,
    addedAt: Date
  }],
  updatedAt: Date,
  expiresAt: Date // TTL: 7 days / หมดอายุ: 7 วัน
}
```

#### Session Schema (Redis) / Schema Session (Redis)
```javascript
// Stored in Redis with key: session:{sessionId}
// จัดเก็บใน Redis ด้วย key: session:{sessionId}
{
  sessionId: String,
  userId: String,
  socketId: String, // For WebSocket connection / สำหรับการเชื่อมต่อ WebSocket
  createdAt: Date,
  expiresAt: Date // TTL: 24 hours / หมดอายุ: 24 ชั่วโมง
}
```

### Database Indexes / ดัชนีฐานข้อมูล

**User Collection:**
- email (unique)
- role

**Product Collection:**
- name (text index for search / ดัชนีข้อความสำหรับการค้นหา)
- category
- active
- { category: 1, price: 1 } (compound / รวม)
- { averageRating: -1 } (for sorting / สำหรับการเรียง)

**Order Collection:**
- orderNumber (unique)
- user
- status
- { user: 1, createdAt: -1 } (compound / รวม)

**Review Collection:**
- product
- { product: 1, user: 1 } (unique compound / รวมไม่ซ้ำ)
- { product: 1, createdAt: -1 } (compound / รวม)


## Correctness Properties / คุณสมบัติความถูกต้อง

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

*คุณสมบัติคือลักษณะหรือพฤติกรรมที่ควรเป็นจริงในการทำงานที่ถูกต้องทั้งหมดของระบบ - เป็นข้อความที่เป็นทางการเกี่ยวกับสิ่งที่ระบบควรทำ คุณสมบัติทำหน้าที่เป็นสะพานเชื่อมระหว่างข้อกำหนดที่มนุษย์อ่านได้และการรับประกันความถูกต้องที่เครื่องตรวจสอบได้*

### Product Search and Filtering Properties / คุณสมบัติการค้นหาและกรองสินค้า

**Property 1: Search query matching**
*For any* search query string and product catalog, all returned products should contain the search query in either the product name or description (case-insensitive).
**Validates: Requirements 1.2**

**Property 2: Filter criteria compliance**
*For any* combination of filters (category, price range, rating) and product catalog, all returned products should meet ALL specified filter criteria.
**Validates: Requirements 1.3**

**Property 3: Product detail completeness**
*For any* product ID, the product detail response should include all required fields: name, description, price, images array, stock quantity, and reviews array.
**Validates: Requirements 1.4**

**Property 4: Cache utilization**
*For any* frequently accessed product listing request, if cached data exists and is not expired, the system should serve data from cache rather than querying the database.
**Validates: Requirements 1.5**


### Cart Management Properties / คุณสมบัติการจัดการตะกร้า

**Property 5: Cart state consistency**
*For any* cart operation (add, update quantity, remove), the cart total should equal the sum of (item price × item quantity) for all items in the cart.
**Validates: Requirements 2.1, 2.3, 2.4**

**Property 6: Cart display completeness**
*For any* cart, the cart display should include all required fields for each item: product name, price, quantity, and subtotal.
**Validates: Requirements 2.2**

**Property 7: Stock validation at checkout**
*For any* cart with items, if any product's stock becomes zero, the checkout process should be blocked and the customer should receive a notification.
**Validates: Requirements 2.5**

### Authentication and Authorization Properties / คุณสมบัติการยืนยันตัวตนและการอนุญาต

**Property 8: Password encryption**
*For any* user registration or password update, the password stored in the database should be a bcrypt hash, not the plain text password.
**Validates: Requirements 3.1, 13.1**

**Property 9: JWT token issuance**
*For any* valid login credentials (matching email and password), the system should issue a valid JWT token containing the user ID and role.
**Validates: Requirements 3.2**

**Property 10: JWT authorization**
*For any* protected endpoint request, access should be granted if and only if a valid, non-expired JWT token is provided.
**Validates: Requirements 3.3, 3.4**

**Property 11: Profile update persistence**
*For any* valid profile update request, the changes should be persisted to the database and retrievable in subsequent requests.
**Validates: Requirements 3.5**


### Checkout and Payment Properties / คุณสมบัติการชำระเงินและการสั่งซื้อ

**Property 12: Order summary completeness**
*For any* checkout initiation, the order summary should include all required fields: items list, quantities, subtotal, tax, shipping cost, and total.
**Validates: Requirements 4.1**

**Property 13: Checkout validation**
*For any* checkout submission with invalid or missing required fields (shipping address, payment info), the system should reject the request with a validation error.
**Validates: Requirements 4.2**

**Property 14: Payment intent creation**
*For any* valid checkout confirmation, the system should create a payment intent with the Payment Gateway containing the correct amount and order metadata.
**Validates: Requirements 4.3**

**Property 15: Order completion workflow**
*For any* successful payment confirmation, the system should: (1) create an order record, (2) reduce inventory for all ordered products, (3) clear the customer's cart, and (4) send a confirmation email.
**Validates: Requirements 4.4**

**Property 16: Payment failure cart preservation**
*For any* failed payment attempt, the cart contents should remain unchanged and available for retry.
**Validates: Requirements 4.5**

### Order Management Properties / คุณสมบัติการจัดการคำสั่งซื้อ

**Property 17: Order history completeness**
*For any* user's order history request, each order should include: order number, date, total, and status.
**Validates: Requirements 5.1**

**Property 18: Order detail completeness**
*For any* order detail request, the response should include: items, quantities, prices, shipping address, and current status.
**Validates: Requirements 5.2**


**Property 19: Status change notification**
*For any* order status update by admin, the system should send notifications to the customer via both email and WebSocket (if connected).
**Validates: Requirements 5.3, 9.2, 11.1**

**Property 20: Status history tracking**
*For any* order status change, the system should record a status history entry with the new status and timestamp.
**Validates: Requirements 5.4**

**Property 21: Pending order cancellation**
*For any* order with status "pending", the customer should be able to cancel the order, which should update the status to "cancelled" and restore inventory.
**Validates: Requirements 5.5**

### Wishlist Properties / คุณสมบัติรายการสินค้าที่สนใจ

**Property 22: Wishlist operations**
*For any* wishlist add/remove operation, the user's wishlist should be updated accordingly and the change should be persisted.
**Validates: Requirements 6.1, 6.3**

**Property 23: Wishlist display completeness**
*For any* wishlist view, each product should display: name, current price, and current stock status.
**Validates: Requirements 6.2**

**Property 24: Wishlist to cart transfer**
*For any* "move to cart" operation on a wishlist item, the product should be added to the cart and optionally removed from the wishlist.
**Validates: Requirements 6.4**

**Property 25: Wishlist stock notification**
*For any* wishlist product that becomes out of stock, the wishlist display should show an out-of-stock indicator.
**Validates: Requirements 6.5**


### Review Properties / คุณสมบัติรีวิว

**Property 26: Review display completeness**
*For any* product's reviews, each review should include: rating, comment, reviewer name, and date.
**Validates: Requirements 7.1**

**Property 27: Review creation with purchase verification**
*For any* review submission, the review should be saved if and only if the user has a completed order containing that product.
**Validates: Requirements 7.2, 7.4**

**Property 28: Average rating calculation**
*For any* new review submission, the product's average rating should be recalculated as the mean of all review ratings for that product.
**Validates: Requirements 7.3**

**Property 29: Review sorting**
*For any* product's reviews display, reviews should be sorted by creation date in descending order (most recent first).
**Validates: Requirements 7.5**

### Admin Product Management Properties / คุณสมบัติการจัดการสินค้าของผู้ดูแล

**Property 30: Product creation completeness**
*For any* admin product creation, the saved product should include all provided fields: name, description, price, category, images, and initial stock quantity.
**Validates: Requirements 8.1**

**Property 31: Product update with cache invalidation**
*For any* product update by admin, the changes should be persisted and all cache entries related to that product should be invalidated.
**Validates: Requirements 8.2**

**Property 32: Product deletion from catalog**
*For any* product deletion by admin, the product should not appear in any subsequent search results or product listings.
**Validates: Requirements 8.3**


**Property 33: Real-time inventory broadcast**
*For any* product stock update by admin, a WebSocket event should be broadcast to all connected clients currently viewing that product.
**Validates: Requirements 8.5**

### Admin Order Management Properties / คุณสมบัติการจัดการคำสั่งซื้อของผู้ดูแล

**Property 34: Order filtering**
*For any* admin order dashboard request with filters (status, date range, customer), only orders matching ALL filter criteria should be returned.
**Validates: Requirements 9.1**

**Property 35: Order search accuracy**
*For any* admin order search by order number or customer email, all returned orders should match the search term exactly.
**Validates: Requirements 9.4**

**Property 36: Sales report calculation**
*For any* sales report generation for a date range, the report should correctly calculate: total revenue (sum of all order totals), order count, and identify top-selling products by quantity sold.
**Validates: Requirements 9.5**

### Inventory Management Properties / คุณสมบัติการจัดการสต็อก

**Property 37: Inventory consistency**
*For any* order completion, the stock quantity for each ordered product should decrease by the ordered quantity. For any order cancellation, the stock should increase by the ordered quantity.
**Validates: Requirements 10.4, 10.5**

**Property 38: Low stock alerting**
*For any* product whose stock falls below its configured threshold, a low stock alert should be sent to admin users.
**Validates: Requirements 10.2**

**Property 39: Stock update persistence**
*For any* admin stock quantity update, the new quantity should be persisted and the inventory timestamp should be updated.
**Validates: Requirements 10.3**


### Notification Properties / คุณสมบัติการแจ้งเตือน

**Property 40: Price change notification**
*For any* product price decrease, all users with that product in their wishlist should receive a notification.
**Validates: Requirements 11.2**

**Property 41: Stock availability notification**
*For any* product that comes back in stock (stock changes from 0 to > 0), all users with that product in their wishlist should receive a notification.
**Validates: Requirements 11.3**

**Property 42: Email fallback notification**
*For any* notification event, if the target user is not connected via WebSocket, the notification should be sent via email.
**Validates: Requirements 11.5**

### Error Handling Properties / คุณสมบัติการจัดการข้อผิดพลาด

**Property 43: HTTP error status codes**
*For any* API request, the response status code should be: 400 for invalid input, 401 for authentication failure, 403 for authorization failure, and 500 for server errors.
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**


### Security Properties / คุณสมบัติความปลอดภัย

**Property 44: Payment data security**
*For any* payment processing, credit card details should never be stored in the database - only the payment intent ID from the Payment Gateway.
**Validates: Requirements 13.3**

**Property 45: Rate limiting**
*For any* IP address with multiple failed login attempts (>5 within 15 minutes), subsequent login attempts from that IP should be blocked temporarily.
**Validates: Requirements 13.4**

**Property 46: Input sanitization**
*For any* user input, the system should sanitize the input to remove or escape potentially dangerous characters before processing.
**Validates: Requirements 13.5**

### Performance Properties / คุณสมบัติประสิทธิภาพ

**Property 47: Pagination implementation**
*For any* product listing request, the response should be paginated with a maximum of 20 products per page, and include pagination metadata (current page, total pages, total items).
**Validates: Requirements 14.4**


## Error Handling / การจัดการข้อผิดพลาด

### Error Response Format / รูปแบบการตอบกลับข้อผิดพลาด

```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message',
    details: {} // Optional additional details
  }
}
```

### Error Categories / หมวดหมู่ข้อผิดพลาด

**Validation Errors (400):**
- INVALID_INPUT: ข้อมูลที่ส่งมาไม่ถูกต้อง
- MISSING_REQUIRED_FIELD: ขาดฟิลด์ที่จำเป็น
- INVALID_FORMAT: รูปแบบข้อมูลไม่ถูกต้อง

**Authentication Errors (401):**
- INVALID_CREDENTIALS: ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง
- TOKEN_EXPIRED: Token หมดอายุ
- TOKEN_INVALID: Token ไม่ถูกต้อง

**Authorization Errors (403):**
- INSUFFICIENT_PERMISSIONS: สิทธิ์ไม่เพียงพอ
- RESOURCE_FORBIDDEN: ไม่สามารถเข้าถึงทรัพยากรนี้ได้

**Resource Errors (404):**
- RESOURCE_NOT_FOUND: ไม่พบทรัพยากรที่ร้องขอ

**Business Logic Errors (422):**
- OUT_OF_STOCK: สินค้าหมด
- INSUFFICIENT_STOCK: สต็อกไม่เพียงพอ
- PAYMENT_FAILED: การชำระเงินล้มเหลว
- CANNOT_REVIEW_UNPURCHASED: ไม่สามารถรีวิวสินค้าที่ยังไม่ได้ซื้อ

**Server Errors (500):**
- INTERNAL_SERVER_ERROR: ข้อผิดพลาดภายในเซิร์ฟเวอร์
- DATABASE_ERROR: ข้อผิดพลาดฐานข้อมูล
- EXTERNAL_SERVICE_ERROR: ข้อผิดพลาดบริการภายนอก


## Testing Strategy / กลยุทธ์การทดสอบ

### Unit Testing / การทดสอบหน่วย

**Framework:** Jest for both backend and frontend
**Coverage Target:** 80% code coverage

**Unit Test Focus Areas:**
- Service layer business logic / ตรรกะทางธุรกิจในชั้น service
- Data validation functions / ฟังก์ชันตรวจสอบข้อมูล
- Utility functions / ฟังก์ชันยูทิลิตี้
- React component rendering / การแสดงผลคอมโพเนนต์ React
- Redux reducers and actions / Redux reducers และ actions

**Example Unit Tests:**
- Test that cart total calculation is correct
- Test that password hashing works properly
- Test that product filtering returns correct results
- Test that React components render with correct props

### Property-Based Testing / การทดสอบแบบ Property-Based

**Framework:** fast-check (JavaScript property-based testing library)
**Configuration:** Minimum 100 iterations per property test

**Property Test Implementation:**
Each correctness property defined in this document MUST be implemented as a property-based test. Each test MUST:
1. Be tagged with a comment referencing the property: `// Feature: ecommerce-platform, Property X: [property description]`
2. Generate random valid inputs using fast-check generators
3. Verify the property holds for all generated inputs
4. Run at least 100 iterations

**Example Property Tests:**
```javascript
// Feature: ecommerce-platform, Property 5: Cart state consistency
fc.assert(
  fc.property(
    fc.array(cartItemArbitrary),
    (items) => {
      const cart = { items };
      const calculatedTotal = calculateCartTotal(cart);
      const expectedTotal = items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
      return calculatedTotal === expectedTotal;
    }
  ),
  { numRuns: 100 }
);
```


### Integration Testing / การทดสอบการรวมระบบ

**Focus Areas:**
- API endpoint testing with real database / ทดสอบ API endpoint กับฐานข้อมูลจริง
- Payment gateway integration / การรวมระบบช่องทางชำระเงิน
- WebSocket communication / การสื่อสารผ่าน WebSocket
- Email service integration / การรวมระบบบริการอีเมล

**Tools:**
- Supertest for API testing
- MongoDB Memory Server for test database
- Stripe test mode for payment testing

### End-to-End Testing / การทดสอบแบบ End-to-End

**Framework:** Playwright or Cypress
**Focus:** Critical user flows / เส้นทางผู้ใช้ที่สำคัญ

**Critical Flows to Test:**
1. Complete purchase flow: Browse → Add to cart → Checkout → Payment → Order confirmation
2. User registration and login flow
3. Product search and filtering
4. Wishlist management
5. Order tracking
6. Admin product management
7. Admin order management

### Test Data Management / การจัดการข้อมูลทดสอบ

**Approach:**
- Use factories/builders for test data generation / ใช้ factories/builders สำหรับสร้างข้อมูลทดสอบ
- Seed database with realistic test data / เติมฐานข้อมูลด้วยข้อมูลทดสอบที่สมจริง
- Clean up test data after each test / ล้างข้อมูลทดสอบหลังแต่ละการทดสอบ
- Use separate test database / ใช้ฐานข้อมูลทดสอบแยกต่างหาก


## API Endpoints / API Endpoints

### Authentication APIs / API การยืนยันตัวตน

```
POST   /api/auth/register          - ลงทะเบียนผู้ใช้ใหม่
POST   /api/auth/login             - เข้าสู่ระบบ
POST   /api/auth/logout            - ออกจากระบบ
POST   /api/auth/refresh-token     - รีเฟรช JWT token
GET    /api/auth/me                - ดึงข้อมูลผู้ใช้ปัจจุบัน
PUT    /api/auth/profile           - อัปเดตโปรไฟล์
PUT    /api/auth/password          - เปลี่ยนรหัสผ่าน
```

### Product APIs / API สินค้า

```
GET    /api/products               - ดึงรายการสินค้า (with search, filters, pagination)
GET    /api/products/:id           - ดึงรายละเอียดสินค้า
POST   /api/products               - สร้างสินค้าใหม่ (admin only)
PUT    /api/products/:id           - อัปเดตสินค้า (admin only)
DELETE /api/products/:id           - ลบสินค้า (admin only)
PUT    /api/products/:id/stock     - อัปเดตสต็อก (admin only)
GET    /api/products/:id/reviews   - ดึงรีวิวของสินค้า
POST   /api/products/:id/reviews   - สร้างรีวิว
```

### Cart APIs / API ตะกร้า

```
GET    /api/cart                   - ดึงตะกร้าสินค้า
POST   /api/cart/items             - เพิ่มสินค้าลงตะกร้า
PUT    /api/cart/items/:productId  - อัปเดตจำนวนสินค้า
DELETE /api/cart/items/:productId  - ลบสินค้าออกจากตะกร้า
DELETE /api/cart                   - ล้างตะกร้า
```

### Order APIs / API คำสั่งซื้อ

```
GET    /api/orders                 - ดึงคำสั่งซื้อของผู้ใช้
GET    /api/orders/:id             - ดึงรายละเอียดคำสั่งซื้อ
POST   /api/orders                 - สร้างคำสั่งซื้อ
PUT    /api/orders/:id/cancel      - ยกเลิกคำสั่งซื้อ
GET    /api/admin/orders           - ดึงคำสั่งซื้อทั้งหมด (admin only)
PUT    /api/admin/orders/:id/status - อัปเดตสถานะคำสั่งซื้อ (admin only)
```

### Payment APIs / API การชำระเงิน

```
POST   /api/payment/create-intent  - สร้าง payment intent
POST   /api/payment/confirm        - ยืนยันการชำระเงิน
POST   /api/payment/webhook        - Stripe webhook handler
```

### Wishlist APIs / API รายการสินค้าที่สนใจ

```
GET    /api/wishlist               - ดึงรายการสินค้าที่สนใจ
POST   /api/wishlist/:productId    - เพิ่มสินค้าลงรายการ
DELETE /api/wishlist/:productId    - ลบสินค้าออกจากรายการ
POST   /api/wishlist/:productId/move-to-cart - ย้ายสินค้าไปยังตะกร้า
```


## WebSocket Events / เหตุการณ์ WebSocket

### Client → Server Events / เหตุการณ์จากไคลเอนต์ไปเซิร์ฟเวอร์

```javascript
'connection'              - เชื่อมต่อ WebSocket
'authenticate'            - ยืนยันตัวตนด้วย JWT
'disconnect'              - ตัดการเชื่อมต่อ
'subscribe:product'       - สมัครรับการอัปเดตสินค้า
'unsubscribe:product'     - ยกเลิกการสมัครรับการอัปเดตสินค้า
```

### Server → Client Events / เหตุการณ์จากเซิร์ฟเวอร์ไปไคลเอนต์

```javascript
'notification'            - การแจ้งเตือนทั่วไป
'order:status_changed'    - สถานะคำสั่งซื้อเปลี่ยนแปลง
'product:stock_updated'   - สต็อกสินค้าอัปเดต
'product:price_changed'   - ราคาสินค้าเปลี่ยนแปลง
'wishlist:stock_available' - สินค้าในรายการสินค้าที่สนใจกลับมามีสต็อก
'inventory:low_stock'     - แจ้งเตือนสต็อกต่ำ (admin only)
```

## Technology Stack / เทคโนโลยีที่ใช้

### Backend Technologies / เทคโนโลยี Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Database:** MongoDB 6.x with Mongoose ODM
- **Cache:** Redis 7.x
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Payment:** Stripe SDK
- **WebSocket:** Socket.io
- **Email:** Nodemailer with SMTP
- **Image Storage:** Cloudinary or AWS S3
- **Validation:** Joi or express-validator
- **Testing:** Jest + Supertest + fast-check
- **Logging:** Winston or Pino

### Frontend Technologies / เทคโนโลยี Frontend

- **Framework:** React 19.x
- **State Management:** Redux Toolkit
- **Routing:** React Router 7.x
- **HTTP Client:** Axios
- **WebSocket Client:** Socket.io-client
- **UI Components:** Custom components or Material-UI/Ant Design
- **Form Handling:** React Hook Form
- **Testing:** Jest + React Testing Library + Playwright/Cypress
- **Build Tool:** Create React App or Vite

### DevOps & Infrastructure / DevOps และโครงสร้างพื้นฐาน

- **Version Control:** Git
- **CI/CD:** GitHub Actions or GitLab CI
- **Containerization:** Docker
- **Hosting:** AWS, Google Cloud, or Heroku
- **CDN:** Cloudflare or AWS CloudFront
- **Monitoring:** Sentry for error tracking
- **Analytics:** Google Analytics or Mixpanel


## Security Considerations / ข้อพิจารณาด้านความปลอดภัย

### Authentication & Authorization / การยืนยันตัวตนและการอนุญาต

1. **JWT Token Management:**
   - Access tokens expire in 15 minutes / Access tokens หมดอายุใน 15 นาที
   - Refresh tokens expire in 7 days / Refresh tokens หมดอายุใน 7 วัน
   - Store refresh tokens in httpOnly cookies / เก็บ refresh tokens ใน httpOnly cookies
   - Implement token rotation / ใช้การหมุนเวียน token

2. **Password Security:**
   - Minimum 8 characters with complexity requirements / อย่างน้อย 8 ตัวอักษรพร้อมความซับซ้อน
   - Bcrypt with salt rounds = 10 / Bcrypt ด้วย salt rounds = 10
   - Rate limit password reset attempts / จำกัดอัตราการรีเซ็ตรหัสผ่าน

3. **Role-Based Access Control (RBAC):**
   - Customer role: Can manage own cart, orders, wishlist, reviews
   - Admin role: Can manage all products, orders, inventory, view reports

### Input Validation & Sanitization / การตรวจสอบและทำความสะอาดข้อมูล

1. **Validation Rules:**
   - Validate all input on both client and server / ตรวจสอบข้อมูลทั้งฝั่งไคลเอนต์และเซิร์ฟเวอร์
   - Use schema validation (Joi/Zod) / ใช้การตรวจสอบ schema
   - Reject requests with invalid data / ปฏิเสธคำขอที่มีข้อมูลไม่ถูกต้อง

2. **Sanitization:**
   - Escape HTML to prevent XSS / Escape HTML เพื่อป้องกัน XSS
   - Use parameterized queries to prevent NoSQL injection / ใช้ parameterized queries เพื่อป้องกัน NoSQL injection
   - Sanitize file uploads / ทำความสะอาดไฟล์ที่อัปโหลด

### Rate Limiting / การจำกัดอัตรา

```javascript
// API Rate Limits
General API: 100 requests per 15 minutes per IP
Login: 5 attempts per 15 minutes per IP
Registration: 3 attempts per hour per IP
Password Reset: 3 attempts per hour per email
```

### HTTPS & CORS / HTTPS และ CORS

1. **HTTPS:**
   - Enforce HTTPS in production / บังคับใช้ HTTPS ใน production
   - Use HSTS headers / ใช้ HSTS headers
   - Redirect HTTP to HTTPS / เปลี่ยนเส้นทาง HTTP ไป HTTPS

2. **CORS Configuration:**
   - Whitelist specific origins / ระบุ origins ที่อนุญาต
   - Allow credentials for authenticated requests / อนุญาต credentials สำหรับคำขอที่ยืนยันตัวตน
   - Restrict allowed methods and headers / จำกัด methods และ headers ที่อนุญาต


## Performance Optimization / การเพิ่มประสิทธิภาพ

### Caching Strategy / กลยุทธ์การแคช

**Redis Cache Keys:**
```
product:{id}                    - TTL: 1 hour / หมดอายุ: 1 ชั่วโมง
products:list:{filters}         - TTL: 15 minutes / หมดอายุ: 15 นาที
product:{id}:reviews           - TTL: 30 minutes / หมดอายุ: 30 นาที
user:{id}:wishlist             - TTL: 1 hour / หมดอายุ: 1 ชั่วโมง
cart:{userId}                  - TTL: 7 days / หมดอายุ: 7 วัน
session:{sessionId}            - TTL: 24 hours / หมดอายุ: 24 ชั่วโมง
```

**Cache Invalidation Rules:**
- Product update → Invalidate `product:{id}` and `products:list:*`
- Review creation → Invalidate `product:{id}:reviews`
- Wishlist update → Invalidate `user:{id}:wishlist`
- Order completion → Invalidate related product caches

### Database Optimization / การเพิ่มประสิทธิภาพฐานข้อมูล

1. **Indexing Strategy:**
   - Create indexes on frequently queried fields / สร้างดัชนีบนฟิลด์ที่สอบถามบ่อย
   - Use compound indexes for multi-field queries / ใช้ดัชนีรวมสำหรับการสอบถามหลายฟิลด์
   - Monitor slow queries and add indexes as needed / ติดตามการสอบถามที่ช้าและเพิ่มดัชนีตามความจำเป็น

2. **Query Optimization:**
   - Use projection to limit returned fields / ใช้ projection เพื่อจำกัดฟิลด์ที่ส่งคืน
   - Implement pagination for large result sets / ใช้การแบ่งหน้าสำหรับผลลัพธ์ขนาดใหญ่
   - Use aggregation pipeline for complex queries / ใช้ aggregation pipeline สำหรับการสอบถามที่ซับซ้อน

3. **Connection Pooling:**
   - Configure appropriate pool size / กำหนดขนาด pool ที่เหมาะสม
   - Monitor connection usage / ติดตามการใช้งานการเชื่อมต่อ

### Frontend Optimization / การเพิ่มประสิทธิภาพ Frontend

1. **Code Splitting:**
   - Lazy load routes / โหลดเส้นทางแบบ lazy
   - Split vendor bundles / แยก vendor bundles
   - Dynamic imports for heavy components / Dynamic imports สำหรับคอมโพเนนต์ที่หนัก

2. **Image Optimization:**
   - Use WebP format with fallbacks / ใช้รูปแบบ WebP พร้อม fallbacks
   - Implement lazy loading for images / ใช้ lazy loading สำหรับรูปภาพ
   - Serve responsive images / ให้บริการรูปภาพที่ตอบสนอง
   - Use CDN for image delivery / ใช้ CDN สำหรับการส่งมอบรูปภาพ

3. **State Management:**
   - Normalize Redux state / ทำให้ Redux state เป็นมาตรฐาน
   - Use selectors with memoization / ใช้ selectors พร้อม memoization
   - Avoid unnecessary re-renders / หลีกเลี่ยงการ re-render ที่ไม่จำเป็น

4. **Network Optimization:**
   - Implement request debouncing for search / ใช้ request debouncing สำหรับการค้นหา
   - Use HTTP/2 for multiplexing / ใช้ HTTP/2 สำหรับ multiplexing
   - Enable gzip compression / เปิดใช้งานการบีบอัด gzip


## Deployment Architecture / สถาปัตยกรรมการปรับใช้

### Production Environment / สภาพแวดล้อม Production

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                    (AWS ALB / Nginx)                         │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
┌────────────┴──────────┐    ┌───────────┴────────────────────┐
│   Web Server 1        │    │   Web Server 2                 │
│   (Node.js + Express) │    │   (Node.js + Express)          │
│   + Socket.io         │    │   + Socket.io                  │
└────────────┬──────────┘    └───────────┬────────────────────┘
             │                            │
             └────────────┬───────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────┴─────┐  ┌──────┴──────┐  ┌─────┴──────────┐
│   MongoDB    │  │    Redis    │  │  Static Files  │
│   Cluster    │  │   Cluster   │  │  (S3/CDN)      │
│  (Primary +  │  │  (Master +  │  │                │
│   Replicas)  │  │   Replicas) │  │                │
└──────────────┘  └─────────────┘  └────────────────┘
```

### Environment Variables / ตัวแปรสภาพแวดล้อม

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb://...
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Email
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...

# Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Client
CLIENT_URL=https://...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```


## Monitoring and Logging / การติดตามและการบันทึก

### Application Monitoring / การติดตามแอปพลิเคชัน

**Metrics to Track:**
- Request rate and response times / อัตราคำขอและเวลาตอบสนอง
- Error rates by endpoint / อัตราข้อผิดพลาดตาม endpoint
- Database query performance / ประสิทธิภาพการสอบถามฐานข้อมูล
- Cache hit/miss rates / อัตราการโดน/พลาดแคช
- WebSocket connection count / จำนวนการเชื่อมต่อ WebSocket
- Payment success/failure rates / อัตราความสำเร็จ/ล้มเหลวของการชำระเงิน

**Tools:**
- Application Performance Monitoring (APM): New Relic, Datadog, or Elastic APM
- Error Tracking: Sentry
- Uptime Monitoring: Pingdom or UptimeRobot

### Logging Strategy / กลยุทธ์การบันทึก

**Log Levels:**
- ERROR: Application errors, exceptions / ข้อผิดพลาดแอปพลิเคชัน, ข้อยกเว้น
- WARN: Warnings, deprecated features / คำเตือน, ฟีเจอร์ที่เลิกใช้
- INFO: Important business events / เหตุการณ์ทางธุรกิจที่สำคัญ
- DEBUG: Detailed debugging information / ข้อมูลการดีบักโดยละเอียด

**What to Log:**
- All API requests (method, path, status, duration) / คำขอ API ทั้งหมด
- Authentication events (login, logout, token refresh) / เหตุการณ์การยืนยันตัวตน
- Order creation and status changes / การสร้างคำสั่งซื้อและการเปลี่ยนสถานะ
- Payment transactions / ธุรกรรมการชำระเงิน
- Inventory changes / การเปลี่ยนแปลงสต็อก
- Errors and exceptions with stack traces / ข้อผิดพลาดและข้อยกเว้นพร้อม stack traces

**Log Format (JSON):**
```javascript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "INFO",
  message: "Order created",
  context: {
    userId: "...",
    orderId: "...",
    total: 150.00
  },
  requestId: "..."
}
```

### Alerting / การแจ้งเตือน

**Alert Conditions:**
- Error rate exceeds 5% / อัตราข้อผิดพลาดเกิน 5%
- Response time exceeds 2 seconds / เวลาตอบสนองเกิน 2 วินาที
- Database connection failures / การเชื่อมต่อฐานข้อมูลล้มเหลว
- Payment gateway errors / ข้อผิดพลาดช่องทางชำระเงิน
- Low stock alerts / แจ้งเตือนสต็อกต่ำ
- Server CPU/Memory exceeds 80% / CPU/Memory ของเซิร์ฟเวอร์เกิน 80%

**Alert Channels:**
- Email for non-critical alerts / อีเมลสำหรับการแจ้งเตือนที่ไม่สำคัญ
- SMS/Slack for critical alerts / SMS/Slack สำหรับการแจ้งเตือนที่สำคัญ
- PagerDuty for on-call incidents / PagerDuty สำหรับเหตุการณ์ on-call


## Scalability Considerations / ข้อพิจารณาด้านความสามารถในการขยาย

### Horizontal Scaling / การขยายแนวนอน

1. **Stateless Application Servers:**
   - Store session data in Redis, not in-memory / เก็บข้อมูล session ใน Redis ไม่ใช่ใน memory
   - Use load balancer for distributing traffic / ใช้ load balancer สำหรับกระจายทราฟฟิก
   - Enable auto-scaling based on CPU/memory metrics / เปิดใช้งาน auto-scaling ตามเมตริก CPU/memory

2. **Database Scaling:**
   - MongoDB replica set for read scaling / MongoDB replica set สำหรับการขยายการอ่าน
   - Sharding for write scaling (if needed) / Sharding สำหรับการขยายการเขียน (ถ้าจำเป็น)
   - Read preference to secondary for non-critical reads / ตั้งค่าการอ่านไปที่ secondary สำหรับการอ่านที่ไม่สำคัญ

3. **Redis Scaling:**
   - Redis Cluster for horizontal scaling / Redis Cluster สำหรับการขยายแนวนอน
   - Separate Redis instances for cache vs sessions / แยก Redis instances สำหรับแคชและ sessions

### Vertical Scaling / การขยายแนวตั้ง

- Increase server resources (CPU, RAM) as needed / เพิ่มทรัพยากรเซิร์ฟเวอร์ (CPU, RAM) ตามความจำเป็น
- Optimize database queries before scaling / ปรับแต่งการสอบถามฐานข้อมูลก่อนการขยาย
- Profile application to identify bottlenecks / วิเคราะห์แอปพลิเคชันเพื่อระบุคอขวด

### Microservices Consideration / ข้อพิจารณาเกี่ยวกับ Microservices

For future scaling, consider splitting into microservices:
- **Product Service:** Product catalog, search, reviews
- **Order Service:** Order management, order history
- **Payment Service:** Payment processing, refunds
- **Notification Service:** Email, WebSocket notifications
- **User Service:** Authentication, user profiles

## Future Enhancements / การปรับปรุงในอนาคต

### Phase 2 Features / ฟีเจอร์เฟส 2

1. **Advanced Search:**
   - Elasticsearch integration for full-text search / การรวม Elasticsearch สำหรับการค้นหาข้อความเต็ม
   - Autocomplete suggestions / คำแนะนำอัตโนมัติ
   - Search history and saved searches / ประวัติการค้นหาและการค้นหาที่บันทึกไว้

2. **Personalization:**
   - Product recommendations based on browsing history / คำแนะนำสินค้าตามประวัติการเรียกดู
   - Personalized email campaigns / แคมเปญอีเมลส่วนบุคคล
   - Dynamic pricing / การกำหนดราคาแบบไดนามิก

3. **Social Features:**
   - Share products on social media / แชร์สินค้าบนโซเชียลมีเดีย
   - Follow other users / ติดตามผู้ใช้อื่น
   - Product Q&A section / ส่วนถามตอบเกี่ยวกับสินค้า

4. **Mobile App:**
   - React Native mobile application / แอปพลิเคชันมือถือ React Native
   - Push notifications / การแจ้งเตือนแบบ push
   - Offline mode / โหมดออฟไลน์

5. **Analytics Dashboard:**
   - Sales analytics and reports / การวิเคราะห์การขายและรายงาน
   - Customer behavior tracking / การติดตามพฤติกรรมลูกค้า
   - Inventory forecasting / การคาดการณ์สต็อก

6. **Multi-vendor Support:**
   - Allow multiple sellers / อนุญาตให้มีผู้ขายหลายราย
   - Vendor dashboard / แดชบอร์ดผู้ขาย
   - Commission management / การจัดการค่าคอมมิชชัน

