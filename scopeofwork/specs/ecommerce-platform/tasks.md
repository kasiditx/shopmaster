# Implementation Plan / แผนการพัฒนา

## Overview / ภาพรวม

This implementation plan breaks down the E-commerce platform development into manageable tasks. Each task builds incrementally on previous work, with property-based tests integrated throughout to catch bugs early.

แผนการพัฒนานี้แบ่งการพัฒนาแพลตฟอร์ม E-commerce เป็นงานที่จัดการได้ แต่ละงานสร้างขึ้นจากงานก่อนหน้าอย่างค่อยเป็นค่อยไป พร้อมการทดสอบแบบ property-based ที่รวมอยู่ตลอดเพื่อจับข้อบักก่อน

## Tasks / งาน

- [x] 1. Setup project infrastructure and core dependencies





  - Install and configure Redis for caching and sessions
  - Install fast-check for property-based testing
  - Setup Socket.io for WebSocket support
  - Configure Stripe SDK
  - Setup email service (Nodemailer)
  - Configure image storage (Cloudinary or AWS S3)
  - Setup testing framework (Jest + Supertest + fast-check)
  - _Requirements: All_

- [x] 2. Enhance data models with new features




  - [x] 2.1 Extend User model with wishlist field


    - Add wishlist array field to User schema
    - Create indexes for wishlist queries
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 2.2 Create Review model


    - Implement Review schema with product, user, order, rating, comment fields
    - Add compound unique index on (product, user)
    - Add index on (product, createdAt)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 2.3 Enhance Product model


    - Add averageRating and reviewCount fields
    - Add lowStockThreshold field
    - Update indexes for search and filtering
    - _Requirements: 1.2, 1.3, 7.3, 10.2_

  
  - [x] 2.4 Enhance Order model

    - Add orderNumber field with auto-generation
    - Add statusHistory array for tracking status changes
    - Add paymentStatus field
    - Add subtotal, tax, shippingCost fields
    - _Requirements: 4.1, 5.4, 9.1_


- [x] 3. Implement caching layer with Redis



  - [x] 3.1 Create CacheService





    - Implement get, set, delete, invalidatePattern methods
    - Configure TTL for different cache types
    - Add error handling for Redis connection failures
    - _Requirements: 1.5, 8.2, 14.1_
  
  - [ ]*  3.2 Write property test for cache operations
    - **Property 4: Cache utilization**
    - **Validates: Requirements 1.5**
  
  - [x] 3.3 Integrate caching in product routes





    - Cache product listings and details
    - Implement cache invalidation on product updates
    - _Requirements: 1.5, 8.2_

- [x] 4. Implement advanced product search and filtering




  - [x] 4.1 Create ProductService with search functionality


    - Implement search by name and description (case-insensitive)
    - Implement filtering by category, price range, rating
    - Implement pagination (20 items per page)
    - _Requirements: 1.2, 1.3, 14.4_
  
  - [ ]* 4.2 Write property test for search query matching
    - **Property 1: Search query matching**
    - **Validates: Requirements 1.2**
  
  - [ ]* 4.3 Write property test for filter criteria compliance
    - **Property 2: Filter criteria compliance**
    - **Validates: Requirements 1.3**
  
  - [ ]* 4.4 Write property test for pagination
    - **Property 47: Pagination implementation**
    - **Validates: Requirements 14.4**
  
  - [x] 4.5 Create product search API endpoints


    - GET /api/products with query, filters, pagination
    - Integrate caching for search results
    - _Requirements: 1.2, 1.3, 1.5_


- [x] 5. Implement cart management with Redis





  - [x] 5.1 Create CartService


    - Implement getCart, addToCart, updateCartItem, removeFromCart, clearCart methods
    - Store cart data in Redis with 7-day TTL
    - Implement cart validation (check stock availability)
    - Calculate cart totals (subtotal, tax, shipping, total)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 5.2 Write property test for cart state consistency
    - **Property 5: Cart state consistency**
    - **Validates: Requirements 2.1, 2.3, 2.4**
  
  - [ ]* 5.3 Write property test for cart display completeness
    - **Property 6: Cart display completeness**
    - **Validates: Requirements 2.2**
  
  - [x] 5.4 Create cart API endpoints


    - GET /api/cart
    - POST /api/cart/items
    - PUT /api/cart/items/:productId
    - DELETE /api/cart/items/:productId
    - DELETE /api/cart
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Enhance authentication with JWT refresh tokens





  - [x] 6.1 Update AuthService


    - Implement refresh token generation and validation
    - Store refresh tokens in httpOnly cookies
    - Implement token rotation
    - Add rate limiting for login attempts (5 per 15 min)
    - _Requirements: 3.2, 13.4_
  
  - [ ]* 6.2 Write property test for password encryption
    - **Property 8: Password encryption**
    - **Validates: Requirements 3.1, 13.1**
  
  - [ ]* 6.3 Write property test for JWT authorization
    - **Property 10: JWT authorization**
    - **Validates: Requirements 3.3, 3.4**
  
  - [x] 6.4 Update authentication API endpoints


    - POST /api/auth/refresh-token
    - Implement rate limiting middleware
    - _Requirements: 3.2, 13.4_


- [x] 7. Implement payment integration with Stripe




  - [x] 7.1 Create PaymentService


    - Implement createPaymentIntent method
    - Implement confirmPayment method
    - Implement webhook handler for payment events
    - Add error handling for payment failures
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Write property test for payment intent creation
    - **Property 14: Payment intent creation**
    - **Validates: Requirements 4.3**
  
  - [ ]* 7.3 Write property test for payment data security
    - **Property 44: Payment data security**
    - **Validates: Requirements 13.3**
  
  - [x] 7.4 Create payment API endpoints


    - POST /api/payment/create-intent
    - POST /api/payment/confirm
    - POST /api/payment/webhook
    - _Requirements: 4.3, 4.4_

- [x] 8. Implement order management system





  - [x] 8.1 Create OrderService


    - Implement createOrder method (with inventory reduction)
    - Implement getOrder and getUserOrders methods
    - Implement updateOrderStatus method
    - Implement cancelOrder method (with inventory restoration)
    - Generate unique order numbers
    - Track status history with timestamps
    - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 10.4, 10.5_
  
  - [ ]* 8.2 Write property test for order completion workflow
    - **Property 15: Order completion workflow**
    - **Validates: Requirements 4.4**
  
  - [ ]* 8.3 Write property test for inventory consistency
    - **Property 37: Inventory consistency**
    - **Validates: Requirements 10.4, 10.5**
  
  - [ ]* 8.4 Write property test for pending order cancellation
    - **Property 21: Pending order cancellation**
    - **Validates: Requirements 5.5**
  
  - [x] 8.5 Create order API endpoints


    - GET /api/orders
    - GET /api/orders/:id
    - POST /api/orders
    - PUT /api/orders/:id/cancel
    - _Requirements: 5.1, 5.2, 5.5_


- [x] 9. Implement WebSocket real-time notifications




  - [x] 9.1 Setup Socket.io server


    - Configure Socket.io with Express server
    - Implement JWT authentication for WebSocket connections
    - Setup connection and disconnection handlers
    - Implement room-based subscriptions (user rooms, product rooms)
    - _Requirements: 5.3, 8.5, 11.1, 11.2, 11.3_
  
  - [x] 9.2 Create NotificationService


    - Implement sendWebSocketNotification method
    - Implement sendEmail method with Nodemailer
    - Implement email fallback when WebSocket unavailable
    - Create notification templates
    - _Requirements: 5.3, 11.1, 11.2, 11.3, 11.5_
  
  - [ ]* 9.3 Write property test for status change notification
    - **Property 19: Status change notification**
    - **Validates: Requirements 5.3, 9.2, 11.1**
  
  - [ ]* 9.4 Write property test for email fallback notification
    - **Property 42: Email fallback notification**
    - **Validates: Requirements 11.5**
  
  - [x] 9.5 Integrate notifications in OrderService


    - Send notifications on order status changes
    - _Requirements: 5.3, 11.1_

- [x] 10. Implement wishlist functionality





  - [x] 10.1 Create WishlistService


    - Implement getWishlist, addToWishlist, removeFromWishlist methods
    - Implement moveToCart method
    - Check stock status for wishlist items
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 10.2 Write property test for wishlist operations
    - **Property 22: Wishlist operations**
    - **Validates: Requirements 6.1, 6.3**
  
  - [ ]* 10.3 Write property test for wishlist to cart transfer
    - **Property 24: Wishlist to cart transfer**
    - **Validates: Requirements 6.4**
  
  - [x] 10.4 Create wishlist API endpoints


    - GET /api/wishlist
    - POST /api/wishlist/:productId
    - DELETE /api/wishlist/:productId
    - POST /api/wishlist/:productId/move-to-cart
    - _Requirements: 6.1, 6.2, 6.3, 6.4_


- [x] 11. Implement product review system




  - [x] 11.1 Create ReviewService


    - Implement createReview method (verify purchase first)
    - Implement getProductReviews method with pagination
    - Implement updateReview and deleteReview methods
    - Implement canUserReview method (check if user purchased product)
    - Update product averageRating on review creation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 11.2 Write property test for review creation with purchase verification
    - **Property 27: Review creation with purchase verification**
    - **Validates: Requirements 7.2, 7.4**
  
  - [ ]* 11.3 Write property test for average rating calculation
    - **Property 28: Average rating calculation**
    - **Validates: Requirements 7.3**
  
  - [ ]* 11.4 Write property test for review sorting
    - **Property 29: Review sorting**
    - **Validates: Requirements 7.5**
  
  - [x] 11.5 Create review API endpoints

    - GET /api/products/:id/reviews
    - POST /api/products/:id/reviews
    - PUT /api/reviews/:id
    - DELETE /api/reviews/:id
    - _Requirements: 7.1, 7.2_

- [x] 12. Implement admin product management





  - [x] 12.1 Enhance ProductService for admin operations


    - Implement createProduct method
    - Implement updateProduct method with cache invalidation
    - Implement deleteProduct method
    - Implement updateStock method with WebSocket broadcast
    - Implement image upload and optimization
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 12.2 Write property test for product update with cache invalidation
    - **Property 31: Product update with cache invalidation**
    - **Validates: Requirements 8.2**
  
  - [ ]* 12.3 Write property test for product deletion from catalog
    - **Property 32: Product deletion from catalog**
    - **Validates: Requirements 8.3**
  
  - [ ]* 12.4 Write property test for real-time inventory broadcast
    - **Property 33: Real-time inventory broadcast**
    - **Validates: Requirements 8.5**
  
  - [x] 12.5 Create admin product API endpoints


    - POST /api/products (admin only)
    - PUT /api/products/:id (admin only)
    - DELETE /api/products/:id (admin only)
    - PUT /api/products/:id/stock (admin only)
    - _Requirements: 8.1, 8.2, 8.3, 8.5_


- [x] 13. Implement admin order management and reporting





  - [x] 13.1 Create admin OrderService methods


    - Implement getAllOrders with filtering (status, date range, customer)
    - Implement searchOrders by order number or customer email
    - Implement generateSalesReport method
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
  
  - [ ]* 13.2 Write property test for order filtering
    - **Property 34: Order filtering**
    - **Validates: Requirements 9.1**
  
  - [ ]* 13.3 Write property test for order search accuracy
    - **Property 35: Order search accuracy**
    - **Validates: Requirements 9.4**
  
  - [ ]* 13.4 Write property test for sales report calculation
    - **Property 36: Sales report calculation**
    - **Validates: Requirements 9.5**
  
  - [x] 13.5 Create admin order API endpoints


    - GET /api/admin/orders (admin only)
    - PUT /api/admin/orders/:id/status (admin only)
    - GET /api/admin/orders/search (admin only)
    - GET /api/admin/reports/sales (admin only)
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [-] 14. Implement inventory management and alerts


  - [x] 14.1 Create InventoryService


    - Implement getInventoryDashboard method
    - Implement checkLowStock method
    - Implement sendLowStockAlert method
    - Schedule periodic low stock checks
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 14.2 Write property test for low stock alerting
    - **Property 38: Low stock alerting**
    - **Validates: Requirements 10.2**
  
  - [ ]* 14.3 Write property test for stock update persistence
    - **Property 39: Stock update persistence**
    - **Validates: Requirements 10.3**
  
  - [x] 14.4 Create inventory API endpoints



    - GET /api/admin/inventory (admin only)
    - _Requirements: 10.1_


- [x] 15. Implement wishlist price and stock notifications



  - [x] 15.1 Create background job for wishlist monitoring


    - Monitor price changes for wishlist products
    - Monitor stock availability for wishlist products
    - Send notifications to affected users
    - _Requirements: 11.2, 11.3_
  
  - [ ]* 15.2 Write property test for price change notification
    - **Property 40: Price change notification**
    - **Validates: Requirements 11.2**
  
  - [ ]* 15.3 Write property test for stock availability notification
    - **Property 41: Stock availability notification**
    - **Validates: Requirements 11.3**

- [x] 16. Implement comprehensive error handling





  - [x] 16.1 Create error handling middleware


    - Implement validation error handler (400)
    - Implement authentication error handler (401)
    - Implement authorization error handler (403)
    - Implement not found error handler (404)
    - Implement server error handler (500)
    - Add error logging
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 16.2 Write property test for HTTP error status codes
    - **Property 43: HTTP error status codes**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
  
  - [x] 16.3 Integrate error handling across all routes


    - Apply error middleware to all API endpoints
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 17. Implement security measures




  - [x] 17.1 Implement input sanitization middleware


    - Sanitize all user inputs to prevent XSS
    - Validate and sanitize file uploads
    - _Requirements: 13.5_
  
  - [ ]* 17.2 Write property test for rate limiting
    - **Property 45: Rate limiting**
    - **Validates: Requirements 13.4**
  
  - [ ]* 17.3 Write property test for input sanitization
    - **Property 46: Input sanitization**
    - **Validates: Requirements 13.5**
  
  - [x] 17.4 Configure HTTPS and CORS


    - Setup HTTPS redirect in production
    - Configure CORS with whitelisted origins
    - Add security headers (helmet.js)
    - _Requirements: 13.2_


- [x] 18. Build frontend product browsing and search






  - [x] 18.1 Create Redux slices

    - Create productSlice with actions for fetching, searching, filtering
    - Create cartSlice with actions for cart operations
    - Create authSlice with actions for login, register, logout
    - Create wishlistSlice with actions for wishlist operations
    - Create orderSlice with actions for order operations
    - Create notificationSlice for managing notifications
    - _Requirements: All frontend requirements_
  


  - [x] 18.2 Create product components



    - ProductCard component
    - ProductList component with pagination
    - ProductFilter component (category, price, rating)
    - ProductSearch component with debouncing
    - ProductDetail component


    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 18.3 Create HomePage





    - Display product listings


    - Integrate search and filters
    - Implement pagination
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 18.4 Create ProductPage




    - Display product details
    - Show product reviews
    - Add to cart button
    - Add to wishlist button
    - _Requirements: 1.4, 7.1_

- [x] 19. Build frontend cart and checkout




  - [x] 19.1 Create cart components


    - CartItem component
    - CartSummary component
    - _Requirements: 2.2_
  

  - [x] 19.2 Create CartPage

    - Display cart items
    - Update quantity functionality
    - Remove item functionality
    - Show cart total
    - Proceed to checkout button
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 19.3 Create CheckoutPage


    - Shipping address form
    - Order summary
    - Stripe payment integration
    - Handle payment success/failure
    - _Requirements: 4.1, 4.2, 4.3, 4.5_


- [x] 20. Build frontend order management




  - [x] 20.1 Create order components


    - OrderCard component
    - OrderTracking component
    - _Requirements: 5.1, 5.2_
  
  - [x] 20.2 Create OrdersPage


    - Display order history
    - Show order status
    - Order detail view
    - Cancel order functionality
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 21. Build frontend wishlist and reviews





  - [x] 21.1 Create WishlistPage


    - Display wishlist items
    - Show current price and stock status
    - Remove from wishlist button
    - Move to cart button
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 21.2 Create review components


    - ProductReviews component
    - ReviewForm component
    - ReviewCard component
    - _Requirements: 7.1, 7.2_
  
  - [x] 21.3 Integrate reviews in ProductPage


    - Display reviews list
    - Add review form (if purchased)
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 22. Build frontend authentication




  - [x] 22.1 Create auth components


    - LoginForm component
    - RegisterForm component
    - ProfileForm component
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 22.2 Create LoginPage and RegisterPage


    - Login form with validation
    - Register form with validation
    - Handle authentication errors
    - _Requirements: 3.1, 3.2_
  
  - [x] 22.3 Create ProfilePage


    - Display user information
    - Edit profile functionality
    - Change password functionality
    - _Requirements: 3.5_
  
  - [x] 22.4 Implement protected routes


    - Create PrivateRoute component
    - Redirect to login if not authenticated
    - _Requirements: 3.3, 3.4_


- [x] 23. Build frontend real-time notifications




  - [x] 23.1 Create WebSocket service


    - Setup Socket.io client
    - Implement connection with JWT authentication
    - Handle connection/disconnection
    - Subscribe to user-specific events
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 23.2 Create notification components


    - NotificationBadge component
    - NotificationList component
    - NotificationItem component
    - _Requirements: 11.4_
  
  - [x] 23.3 Integrate notifications in NavBar


    - Display notification badge
    - Show notification dropdown
    - Handle notification events
    - _Requirements: 11.1, 11.2, 11.3, 11.4_




- [x] 24. Build admin dashboard



  - [x] 24.1 Create admin product management

    - ProductForm component for create/edit
    - ProductList component with admin actions
    - Image upload functionality
    - Stock management interface
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 24.2 Create admin order management


    - OrderList component with filters
    - Order search functionality
    - Order status update interface
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 24.3 Create admin inventory dashboard


    - Display all products with stock levels
    - Highlight low stock items
    - Quick stock update interface
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 24.4 Create admin sales reports


    - Sales report interface
    - Date range selector
    - Display revenue, order count, top products
    - _Requirements: 9.5_


- [x] 25. Checkpoint - Ensure all tests pass



  - Run all unit tests
  - Run all property-based tests
  - Run integration tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.


- [x] 26. Performance optimization



  - [x] 26.1 Implement frontend code splitting


    - Lazy load routes
    - Split vendor bundles
    - Dynamic imports for heavy components
    - _Requirements: 14.5_
  

  - [x] 26.2 Implement image optimization



    - Use WebP format with fallbacks
    - Implement lazy loading for images
    - Integrate CDN for image delivery
    - _Requirements: 14.2_
  
  - [x] 26.3 Optimize Redux state


    - Normalize state structure
    - Use memoized selectors
    - Optimize re-renders
    - _Requirements: 14.5_


- [-] 27. Setup monitoring and logging




  - [x] 27.1 Implement application logging


    - Setup Winston or Pino logger
    - Log all API requests
    - Log authentication events
    - Log order and payment transactions
    - Log errors with stack traces
    - _Requirements: 12.4_
  
  - [x] 27.2 Setup error tracking


    - Integrate Sentry for error tracking
    - Configure source maps
    - Setup error alerts
    - _Requirements: 12.4_
  
  - [x] 27.3 Setup performance monitoring





    - Integrate APM tool (New Relic, Datadog, or Elastic APM)
    - Monitor request rates and response times
    - Monitor database query performance
    - Monitor cache hit/miss rates
    - _Requirements: 14.5_


- [x] 28. Setup deployment infrastructure




- [ ] 28. Setup deployment infrastructure


  - [x] 28.1 Create Docker configuration


    - Create Dockerfile for backend
    - Create Dockerfile for frontend
    - Create docker-compose.yml for local development
    - _Requirements: All_
  
  - [x] 28.2 Setup environment configuration


    - Create .env.example files
    - Document all environment variables
    - Setup different configs for dev/staging/production
    - _Requirements: All_
  
  - [x] 28.3 Setup CI/CD pipeline


    - Configure GitHub Actions or GitLab CI
    - Run tests on every commit
    - Build and deploy on merge to main
    - _Requirements: All_


- [x] 29. End-to-end testing




  - [x] 29.1 Setup Playwright or Cypress


    - Install and configure E2E testing framework
    - Setup test database
  
  - [x] 29.2 Write E2E tests for critical flows



    - Complete purchase flow test
    - User registration and login test
    - Product search and filtering test
    - Wishlist management test
    - Order tracking test
    - Admin product management test
    - Admin order management test


- [x] 30. Documentation and final polish




- [ ] 30. Documentation and final polish

  - [x] 30.1 Write API documentation


    - Document all API endpoints
    - Include request/response examples
    - Document error codes
    - _Requirements: All_
  
  - [x] 30.2 Write deployment guide


    - Document deployment steps
    - Document environment setup
    - Document monitoring setup
    - _Requirements: All_
  
  - [x] 30.3 Write user guide


    - Document customer features
    - Document admin features
    - Include screenshots
    - _Requirements: All_


-

- [x] 31. Final checkpoint - Production readiness




  - Verify all tests pass
  - Verify all features work as expected
  - Verify performance meets requirements
  - Verify security measures are in place
  - Ensure all tests pass, ask the user if questions arise.

