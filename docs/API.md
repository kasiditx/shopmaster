# E-commerce Platform API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the E-commerce platform. The API is built with Node.js, Express, and MongoDB, and follows RESTful principles.

**Base URL:** `http://localhost:5000/api` (development)

**Authentication:** Most endpoints require JWT authentication via Bearer token in the Authorization header.

**Response Format:** All responses follow a consistent format:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Product APIs](#product-apis)
3. [Cart APIs](#cart-apis)
4. [Order APIs](#order-apis)
5. [Payment APIs](#payment-apis)
6. [Wishlist APIs](#wishlist-apis)
7. [Review APIs](#review-apis)
8. [Admin APIs](#admin-apis)
9. [Error Codes](#error-codes)

---

## Authentication APIs

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication documentation.

### POST /api/users/register

Register a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies Set:**
- `refreshToken`: httpOnly, secure (production), sameSite: strict, 7 days expiry

**Errors:**
- `400 INVALID_INPUT`: Email already registered or invalid data
- `400 MISSING_REQUIRED_FIELD`: Missing required fields

---

### POST /api/users/login

Login with email and password.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limiting:** 5 attempts per 15 minutes per IP

**Errors:**
- `401 INVALID_CREDENTIALS`: Wrong email or password
- `429 RATE_LIMIT_EXCEEDED`: Too many login attempts

---

### POST /api/users/refresh-token

Refresh access token using refresh token from cookie.

**Authentication:** Refresh token in httpOnly cookie

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes:** New refresh token is issued and old one is invalidated (token rotation)

**Errors:**
- `401 TOKEN_INVALID`: Invalid or expired refresh token

---

### POST /api/users/logout

Logout user by invalidating refresh token.

**Authentication:** Required (Bearer token)

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/users/me

Get current user information.

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "wishlist": ["product_id_1", "product_id_2"]
  }
}
```

---

## Product APIs

### GET /api/products

Get list of products with search, filtering, and pagination.

**Authentication:** None required

**Query Parameters:**
- `query` (string): Search term for product name or description
- `category` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `minRating` (number): Minimum rating filter (0-5)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sort` (string): Sort field (price, rating, createdAt)
- `order` (string): Sort order (asc, desc)

**Example Request:**
```
GET /api/products?query=laptop&category=electronics&minPrice=500&maxPrice=2000&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "description": "High-performance gaming laptop",
        "price": 1299.99,
        "images": ["https://cdn.example.com/image1.jpg"],
        "stock": 15,
        "category": "electronics",
        "averageRating": 4.5,
        "reviewCount": 42,
        "active": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20
    }
  }
}
```

---

### GET /api/products/:id

Get detailed information about a specific product.

**Authentication:** None required

**URL Parameters:**
- `id` (string): Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4070",
    "price": 1299.99,
    "images": [
      "https://cdn.example.com/image1.jpg",
      "https://cdn.example.com/image2.jpg"
    ],
    "stock": 15,
    "category": "electronics",
    "tags": ["gaming", "laptop", "rtx"],
    "averageRating": 4.5,
    "reviewCount": 42,
    "lowStockThreshold": 10,
    "active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:22:00.000Z"
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found

---

### POST /api/products

Create a new product (Admin only).

**Authentication:** Required (Bearer token) + Admin role

**Request Body:**
```json
{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "category": "electronics",
  "tags": ["gaming", "laptop"],
  "stock": 50,
  "lowStockThreshold": 10,
  "images": ["https://cdn.example.com/image1.jpg"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop",
    "price": 1299.99,
    "stock": 50,
    "category": "electronics",
    "tags": ["gaming", "laptop"],
    "images": ["https://cdn.example.com/image1.jpg"],
    "averageRating": 0,
    "reviewCount": 0,
    "lowStockThreshold": 10,
    "active": true
  }
}
```

**Errors:**
- `400 INVALID_INPUT`: Invalid product data
- `403 INSUFFICIENT_PERMISSIONS`: Not an admin user

---

### PUT /api/products/:id

Update product information (Admin only).

**Authentication:** Required (Bearer token) + Admin role

**URL Parameters:**
- `id` (string): Product ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Gaming Laptop",
  "price": 1199.99,
  "stock": 25,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Gaming Laptop",
    "price": 1199.99,
    "stock": 25,
    "description": "Updated description"
  }
}
```

**Notes:** Cache entries for this product are automatically invalidated

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `403 INSUFFICIENT_PERMISSIONS`: Not an admin user

---

### DELETE /api/products/:id

Delete a product (Admin only).

**Authentication:** Required (Bearer token) + Admin role

**URL Parameters:**
- `id` (string): Product ID

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Notes:** Product is soft-deleted (marked as inactive) and removed from search results

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `403 INSUFFICIENT_PERMISSIONS`: Not an admin user

---

### PUT /api/products/:id/stock

Update product stock quantity (Admin only).

**Authentication:** Required (Bearer token) + Admin role

**URL Parameters:**
- `id` (string): Product ID

**Request Body:**
```json
{
  "stock": 100
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "stock": 100
  }
}
```

**Notes:** WebSocket event is broadcast to all clients viewing this product

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `400 INVALID_INPUT`: Invalid stock value
- `403 INSUFFICIENT_PERMISSIONS`: Not an admin user

---

## Cart APIs

All cart endpoints require authentication.

### GET /api/cart

Get current user's shopping cart.

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "price": 1299.99,
        "quantity": 2,
        "image": "https://cdn.example.com/image1.jpg",
        "stock": 15
      }
    ],
    "subtotal": 2599.98,
    "tax": 207.99,
    "shippingCost": 0,
    "total": 2807.97
  }
}
```

---

### POST /api/cart/items

Add item to cart.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "subtotal": 2599.98,
    "total": 2807.97
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `422 INSUFFICIENT_STOCK`: Not enough stock available
- `422 OUT_OF_STOCK`: Product out of stock

---

### PUT /api/cart/items/:productId

Update quantity of item in cart.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `productId` (string): Product ID

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "subtotal": 3899.97,
    "total": 4211.96
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not in cart
- `422 INSUFFICIENT_STOCK`: Not enough stock available

---

### DELETE /api/cart/items/:productId

Remove item from cart.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `productId` (string): Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "subtotal": 1299.99,
    "total": 1403.98
  }
}
```

---

### DELETE /api/cart

Clear entire cart.

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## Order APIs

All order endpoints require authentication.

### POST /api/orders

Create a new order from cart.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "shippingAddress": {
    "line1": "123 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentIntentId": "pi_xxx"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-20240115-ABC123",
    "user": "user_id",
    "items": [
      {
        "product": "product_id",
        "name": "Gaming Laptop",
        "price": 1299.99,
        "qty": 2
      }
    ],
    "subtotal": 2599.98,
    "tax": 207.99,
    "shippingCost": 0,
    "total": 2807.97,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentIntentId": "pi_xxx",
    "shippingAddress": {...},
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notes:** 
- Cart is cleared after successful order creation
- Product inventory is reduced
- Confirmation email is sent

**Errors:**
- `422 OUT_OF_STOCK`: One or more items out of stock
- `400 INVALID_INPUT`: Missing or invalid shipping address

---

### GET /api/orders

Get current user's order history.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "orderNumber": "ORD-20240115-ABC123",
        "total": 2807.97,
        "status": "delivered",
        "paymentStatus": "completed",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "itemCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### GET /api/orders/:id

Get detailed information about a specific order.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (string): Order ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-20240115-ABC123",
    "items": [...],
    "subtotal": 2599.98,
    "tax": 207.99,
    "shippingCost": 0,
    "total": 2807.97,
    "status": "delivered",
    "paymentStatus": "completed",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "status": "paid",
        "timestamp": "2024-01-15T10:31:00.000Z"
      }
    ],
    "shippingAddress": {...},
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Order not found
- `403 INSUFFICIENT_PERMISSIONS`: Not your order

---

### PUT /api/orders/:id/cancel

Cancel a pending order.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (string): Order ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled",
    "message": "Order cancelled successfully"
  }
}
```

**Notes:** 
- Only orders with status "pending" can be cancelled
- Product inventory is restored

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Order not found
- `422 CANNOT_CANCEL_ORDER`: Order cannot be cancelled (not pending)
- `403 INSUFFICIENT_PERMISSIONS`: Not your order

---

## Payment APIs

See [PAYMENT.md](./PAYMENT.md) for detailed payment documentation.

### POST /api/payment/create-intent

Create a payment intent for checkout.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "amount": 2807.97,
  "currency": "usd",
  "orderId": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-20240115-ABC123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 280797,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

---

### POST /api/payment/confirm

Confirm or check payment status.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxx",
    "status": "succeeded",
    "amount": 280797,
    "currency": "usd"
  }
}
```

---

### POST /api/payment/webhook

Stripe webhook endpoint for payment events.

**Authentication:** Verified by Stripe signature

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Response (200):**
```json
{
  "success": true,
  "data": {
    "received": true,
    "processed": true,
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

---

## Wishlist APIs

All wishlist endpoints require authentication.

### GET /api/wishlist

Get current user's wishlist.

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "price": 1299.99,
        "images": ["https://cdn.example.com/image1.jpg"],
        "stock": 15,
        "averageRating": 4.5,
        "inStock": true
      }
    ]
  }
}
```

---

### POST /api/wishlist/:productId

Add product to wishlist.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `productId` (string): Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "wishlist": ["507f1f77bcf86cd799439011", "..."],
    "message": "Product added to wishlist"
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `400 INVALID_INPUT`: Product already in wishlist

---

### DELETE /api/wishlist/:productId

Remove product from wishlist.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `productId` (string): Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "wishlist": ["..."],
    "message": "Product removed from wishlist"
  }
}
```

---

### POST /api/wishlist/:productId/move-to-cart

Move product from wishlist to cart.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `productId` (string): Product ID

**Request Body:**
```json
{
  "quantity": 1,
  "removeFromWishlist": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {...},
    "wishlist": [...],
    "message": "Product moved to cart"
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found or not in wishlist
- `422 OUT_OF_STOCK`: Product out of stock

---

## Review APIs

### GET /api/products/:id/reviews

Get reviews for a specific product.

**Authentication:** None required

**URL Parameters:**
- `id` (string): Product ID

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "user": {
          "_id": "user_id",
          "name": "John Doe"
        },
        "rating": 5,
        "comment": "Excellent product!",
        "verified": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 42
    },
    "averageRating": 4.5
  }
}
```

---

### POST /api/products/:id/reviews

Create a review for a product.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (string): Product ID

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product! Highly recommended."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "product": "product_id",
    "user": "user_id",
    "rating": 5,
    "comment": "Excellent product! Highly recommended.",
    "verified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notes:** 
- User must have purchased the product to review
- Product's average rating is automatically updated

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Product not found
- `422 CANNOT_REVIEW_UNPURCHASED`: User hasn't purchased this product
- `400 INVALID_INPUT`: User already reviewed this product

---

### PUT /api/reviews/:id

Update an existing review.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (string): Review ID

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "rating": 4,
    "comment": "Updated review comment",
    "updatedAt": "2024-01-16T12:00:00.000Z"
  }
}
```

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Review not found
- `403 INSUFFICIENT_PERMISSIONS`: Not your review

---

### DELETE /api/reviews/:id

Delete a review.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (string): Review ID

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Notes:** Product's average rating is automatically recalculated

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Review not found
- `403 INSUFFICIENT_PERMISSIONS`: Not your review

---

## Admin APIs

All admin endpoints require authentication and admin role.

### GET /api/admin/orders

Get all orders with filtering options.

**Authentication:** Required (Bearer token) + Admin role

**Query Parameters:**
- `status` (string): Filter by status (pending, paid, processing, shipped, delivered, cancelled)
- `startDate` (string): Filter orders from this date (ISO 8601)
- `endDate` (string): Filter orders until this date (ISO 8601)
- `customer` (string): Filter by customer email or name
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example Request:**
```
GET /api/admin/orders?status=pending&startDate=2024-01-01&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "orderNumber": "ORD-20240115-ABC123",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "total": 2807.97,
        "status": "pending",
        "paymentStatus": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "itemCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 195
    }
  }
}
```

---

### PUT /api/admin/orders/:id/status

Update order status.

**Authentication:** Required (Bearer token) + Admin role

**URL Parameters:**
- `id` (string): Order ID

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Order shipped via FedEx, tracking: 123456789"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "shipped",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-16T14:00:00.000Z",
        "note": "Order shipped via FedEx, tracking: 123456789"
      }
    ]
  }
}
```

**Notes:** Customer is notified via email and WebSocket

**Errors:**
- `404 RESOURCE_NOT_FOUND`: Order not found
- `400 INVALID_INPUT`: Invalid status value

---

### GET /api/admin/orders/search

Search orders by order number or customer email.

**Authentication:** Required (Bearer token) + Admin role

**Query Parameters:**
- `q` (string): Search query (order number or customer email)

**Example Request:**
```
GET /api/admin/orders/search?q=ORD-20240115
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "orderNumber": "ORD-20240115-ABC123",
        "user": {...},
        "total": 2807.97,
        "status": "delivered"
      }
    ]
  }
}
```

---

### GET /api/admin/reports/sales

Generate sales report for a date range.

**Authentication:** Required (Bearer token) + Admin role

**Query Parameters:**
- `startDate` (string): Start date (ISO 8601, required)
- `endDate` (string): End date (ISO 8601, required)

**Example Request:**
```
GET /api/admin/reports/sales?startDate=2024-01-01&endDate=2024-01-31
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalRevenue": 125430.50,
    "orderCount": 342,
    "averageOrderValue": 366.78,
    "topProducts": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "quantitySold": 45,
        "revenue": 58499.55
      }
    ],
    "ordersByStatus": {
      "delivered": 298,
      "shipped": 32,
      "processing": 8,
      "cancelled": 4
    }
  }
}
```

**Errors:**
- `400 INVALID_INPUT`: Missing or invalid date range

---

### GET /api/admin/inventory

Get inventory dashboard with all products and stock levels.

**Authentication:** Required (Bearer token) + Admin role

**Query Parameters:**
- `lowStockOnly` (boolean): Show only low stock items (default: false)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "stock": 8,
        "lowStockThreshold": 10,
        "isLowStock": true,
        "category": "electronics",
        "price": 1299.99
      }
    ],
    "summary": {
      "totalProducts": 156,
      "lowStockProducts": 12,
      "outOfStockProducts": 3
    },
    "pagination": {...}
  }
}
```

---

### GET /api/admin/inventory/low-stock

Get products with low stock levels.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "lowStockProducts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Gaming Laptop",
        "stock": 8,
        "lowStockThreshold": 10,
        "category": "electronics"
      }
    ],
    "count": 12
  }
}
```

---

### POST /api/admin/inventory/check-low-stock

Manually trigger low stock check and send alerts.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alertsSent": 12,
    "lowStockProducts": [...]
  }
}
```

**Notes:** Sends email alerts to admin users for all low stock products

---

### GET /api/admin/performance/cache-stats

Get Redis cache statistics.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hits": 15420,
    "misses": 3210,
    "hitRate": 0.828,
    "keys": 1250,
    "memory": "45.2 MB"
  }
}
```

---

### GET /api/admin/performance/summary

Get overall performance summary.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uptime": 864000,
    "requestsPerMinute": 125,
    "averageResponseTime": 45,
    "errorRate": 0.002,
    "activeConnections": 342
  }
}
```

---

### GET /api/admin/performance/database-status

Get MongoDB database status.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "collections": 5,
    "totalDocuments": 125430,
    "databaseSize": "2.3 GB",
    "indexes": 18
  }
}
```

---

### GET /api/admin/performance/redis-status

Get Redis connection status.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "uptime": 864000,
    "usedMemory": "45.2 MB",
    "connectedClients": 12,
    "totalKeys": 1250
  }
}
```

---

### GET /api/admin/performance/health

Get overall system health check.

**Authentication:** Required (Bearer token) + Admin role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "connected",
      "redis": "connected",
      "stripe": "operational"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Codes

### 400 - Bad Request

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Invalid input data provided |
| `MISSING_REQUIRED_FIELD` | Required field is missing |
| `INVALID_FORMAT` | Data format is incorrect |

### 401 - Unauthorized

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `TOKEN_EXPIRED` | Access token has expired |
| `TOKEN_INVALID` | Token is invalid or malformed |
| `AUTHENTICATION_REQUIRED` | Authentication is required |

### 403 - Forbidden

| Code | Description |
|------|-------------|
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required permissions |
| `RESOURCE_FORBIDDEN` | Access to this resource is forbidden |

### 404 - Not Found

| Code | Description |
|------|-------------|
| `RESOURCE_NOT_FOUND` | Requested resource not found |

### 422 - Unprocessable Entity

| Code | Description |
|------|-------------|
| `OUT_OF_STOCK` | Product is out of stock |
| `INSUFFICIENT_STOCK` | Not enough stock available |
| `PAYMENT_FAILED` | Payment processing failed |
| `CANNOT_REVIEW_UNPURCHASED` | Cannot review product not purchased |
| `CANNOT_CANCEL_ORDER` | Order cannot be cancelled |

### 429 - Too Many Requests

| Code | Description |
|------|-------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests, try again later |

### 500 - Internal Server Error

| Code | Description |
|------|-------------|
| `INTERNAL_SERVER_ERROR` | Internal server error occurred |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | External service error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Login:** 5 attempts per 15 minutes per IP
- **Registration:** 3 attempts per hour per IP
- **General API:** 100 requests per 15 minutes per IP

When rate limit is exceeded, the API returns:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 900
  }
}
```

---

## WebSocket Events

The platform uses Socket.io for real-time communication.

### Connection

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken
  }
});
```

### Events

**Server → Client:**

- `order:statusUpdate` - Order status changed
  ```json
  {
    "orderId": "507f1f77bcf86cd799439011",
    "status": "shipped",
    "message": "Your order has been shipped"
  }
  ```

- `product:stockUpdate` - Product stock changed
  ```json
  {
    "productId": "507f1f77bcf86cd799439011",
    "stock": 5,
    "isLowStock": true
  }
  ```

- `wishlist:priceChange` - Wishlist product price changed
  ```json
  {
    "productId": "507f1f77bcf86cd799439011",
    "oldPrice": 1299.99,
    "newPrice": 1199.99
  }
  ```

- `wishlist:backInStock` - Wishlist product back in stock
  ```json
  {
    "productId": "507f1f77bcf86cd799439011",
    "stock": 10
  }
  ```

---

## Additional Resources

- [Authentication Documentation](./AUTHENTICATION.md)
- [Payment Integration](./PAYMENT.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [User Guide](./USER_GUIDE.md)

