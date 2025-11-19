# ShopMaster E-commerce Platform - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Customer Features](#customer-features)
4. [Admin Features](#admin-features)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Introduction

Welcome to ShopMaster, a modern e-commerce platform designed to provide a seamless shopping experience. This guide will help you navigate the platform whether you're a customer looking to shop or an administrator managing the store.

### Key Features

**For Customers:**
- Browse and search products
- Add items to cart and wishlist
- Secure checkout with Stripe
- Track orders in real-time
- Write and read product reviews
- Receive notifications for order updates

**For Administrators:**
- Manage products and inventory
- Process and track orders
- View sales reports and analytics
- Monitor low stock alerts
- Manage customer reviews

---

## Getting Started

### Creating an Account

1. Click **Sign Up** in the top navigation bar
2. Fill in your information:
   - Full Name
   - Email Address
   - Password (minimum 8 characters)
3. Click **Create Account**
4. You'll be automatically logged in

### Logging In

1. Click **Login** in the top navigation bar
2. Enter your email and password
3. Click **Sign In**
4. You'll be redirected to the home page

### Updating Your Profile

1. Click on your name in the top navigation
2. Select **Profile** from the dropdown
3. Update your information:
   - Name
   - Email
   - Password
   - Shipping Address
4. Click **Save Changes**

---

## Customer Features

### 1. Browsing Products

#### Home Page

The home page displays all available products with:
- Product image
- Product name
- Price
- Average rating
- Stock status

#### Searching Products

1. Use the search bar at the top of the page
2. Enter product name or description
3. Press Enter or click the search icon
4. Results will display matching products

**Search Tips:**
- Use specific keywords (e.g., "gaming laptop" instead of "computer")
- Search is case-insensitive
- Searches both product names and descriptions

#### Filtering Products

Use the filter panel on the left side to narrow results:

**By Category:**
- Electronics
- Clothing
- Home & Garden
- Sports & Outdoors
- Books
- And more...

**By Price Range:**
- Drag the price slider to set min/max price
- Or enter specific amounts

**By Rating:**
- Select minimum star rating (1-5 stars)
- Only products with that rating or higher will show

**Sorting Options:**
- Price: Low to High
- Price: High to Low
- Rating: High to Low
- Newest First

#### Viewing Product Details

1. Click on any product card
2. Product detail page shows:
   - Multiple product images
   - Full description
   - Price and stock status
   - Customer reviews
   - Add to Cart button
   - Add to Wishlist button

### 2. Shopping Cart

#### Adding Items to Cart

**From Product List:**
1. Click **Add to Cart** on product card
2. Item is added with quantity 1

**From Product Detail Page:**
1. Select quantity (if available)
2. Click **Add to Cart**
3. Confirmation message appears

#### Viewing Your Cart

1. Click the cart icon in the top navigation
2. Cart page displays:
   - All items in your cart
   - Product image, name, and price
   - Quantity selector
   - Subtotal for each item
   - Order summary with totals

#### Updating Cart

**Change Quantity:**
1. Use the +/- buttons next to quantity
2. Or enter a number directly
3. Cart total updates automatically

**Remove Item:**
1. Click the **Remove** or trash icon
2. Item is removed immediately

**Clear Cart:**
1. Click **Clear Cart** button
2. Confirm the action
3. All items are removed

### 3. Checkout Process

#### Step 1: Review Cart

1. Click **Proceed to Checkout** from cart page
2. Review all items and quantities
3. Verify the total amount

#### Step 2: Shipping Information

Fill in your shipping address:
- Street Address (Line 1)
- Apartment/Suite (Line 2) - Optional
- City
- State/Province
- Postal/ZIP Code
- Country

**Tip:** Save address to your profile for faster checkout next time

#### Step 3: Payment

1. Enter payment information:
   - Card Number
   - Expiration Date (MM/YY)
   - CVC/CVV
   - Cardholder Name
2. Review order summary
3. Click **Place Order**

**Payment Security:**
- All payments processed securely through Stripe
- Card details are never stored on our servers
- SSL encryption protects your information

#### Step 4: Confirmation

After successful payment:
- Order confirmation page displays
- Confirmation email sent to your email
- Order number provided for tracking

**Test Cards (for demo):**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Use any future expiration date and any 3-digit CVC

### 4. Order Management

#### Viewing Order History

1. Click on your name in navigation
2. Select **My Orders**
3. See list of all your orders with:
   - Order number
   - Order date
   - Total amount
   - Current status

#### Tracking an Order

1. Click on any order in your order history
2. Order detail page shows:
   - Order number and date
   - Items ordered
   - Shipping address
   - Payment status
   - Current order status
   - Status history with timestamps

**Order Statuses:**
- **Pending**: Order received, awaiting payment
- **Paid**: Payment confirmed
- **Processing**: Order being prepared
- **Shipped**: Order shipped, on the way
- **Delivered**: Order delivered successfully
- **Cancelled**: Order cancelled

#### Cancelling an Order

1. Go to order details
2. Click **Cancel Order** button (only available for pending orders)
3. Confirm cancellation
4. Order status changes to "Cancelled"
5. Inventory is restored

**Note:** Orders can only be cancelled while in "Pending" status

### 5. Wishlist

#### Adding to Wishlist

**From Product List:**
1. Click the heart icon on product card
2. Heart fills in to show it's added

**From Product Detail Page:**
1. Click **Add to Wishlist** button
2. Confirmation message appears

#### Viewing Wishlist

1. Click **Wishlist** in navigation
2. See all saved products with:
   - Product image and name
   - Current price
   - Stock status
   - Remove button
   - Move to Cart button

#### Managing Wishlist

**Remove from Wishlist:**
1. Click **Remove** or heart icon
2. Item removed immediately

**Move to Cart:**
1. Click **Move to Cart** button
2. Item added to cart
3. Optionally removed from wishlist

**Price Drop Notifications:**
- Receive notification when wishlist item price drops
- Notification appears in real-time
- Also sent via email

**Back in Stock Notifications:**
- Receive notification when out-of-stock item becomes available
- Notification appears in real-time
- Also sent via email

### 6. Product Reviews

#### Writing a Review

1. Go to product detail page
2. Scroll to Reviews section
3. Click **Write a Review** (only if you purchased the product)
4. Fill in:
   - Star rating (1-5 stars)
   - Review comment
5. Click **Submit Review**

**Requirements:**
- Must have purchased the product
- Can only review once per product
- Review appears immediately

#### Reading Reviews

Product detail page shows:
- Average rating
- Total number of reviews
- Individual reviews with:
  - Reviewer name
  - Star rating
  - Review comment
  - Date posted
  - Verified purchase badge

**Sorting Reviews:**
- Most Recent (default)
- Highest Rating
- Lowest Rating

#### Editing Your Review

1. Go to product detail page
2. Find your review
3. Click **Edit**
4. Update rating or comment
5. Click **Save**

#### Deleting Your Review

1. Go to product detail page
2. Find your review
3. Click **Delete**
4. Confirm deletion
5. Review removed and product rating recalculated

### 7. Notifications

#### Real-Time Notifications

Receive instant notifications for:
- Order status changes
- Wishlist price drops
- Wishlist items back in stock
- Payment confirmations

**Viewing Notifications:**
1. Click the bell icon in navigation
2. Dropdown shows recent notifications
3. Click notification to view details

**Notification Badge:**
- Red badge shows unread count
- Updates in real-time
- Clears when notifications are read

#### Email Notifications

Receive emails for:
- Order confirmation
- Order status updates
- Wishlist alerts
- Account changes

**Managing Email Preferences:**
1. Go to Profile settings
2. Update email preferences
3. Choose which emails to receive

---

## Admin Features

### Accessing Admin Dashboard

1. Log in with admin account
2. Click **Admin Dashboard** in navigation
3. Admin panel opens with overview

**Admin Dashboard Sections:**
- Products Management
- Orders Management
- Inventory Dashboard
- Sales Reports
- Performance Monitoring

### 1. Product Management

#### Viewing All Products

1. Go to **Admin Dashboard**
2. Click **Products** in sidebar
3. See list of all products with:
   - Product image
   - Name and category
   - Price
   - Stock quantity
   - Status (Active/Inactive)
   - Actions (Edit/Delete)

#### Adding a New Product

1. Click **Add New Product** button
2. Fill in product information:
   - **Name**: Product name (required)
   - **Description**: Detailed description
   - **Price**: Product price in dollars
   - **Category**: Select from dropdown
   - **Tags**: Add relevant tags
   - **Stock**: Initial stock quantity
   - **Low Stock Threshold**: Alert threshold (default: 10)
   - **Images**: Upload product images
3. Click **Create Product**
4. Product appears in catalog immediately

**Image Upload Tips:**
- Supported formats: JPG, PNG, WebP
- Maximum size: 5MB per image
- Recommended size: 1000x1000 pixels
- Multiple images supported

#### Editing a Product

1. Find product in product list
2. Click **Edit** button
3. Update any fields:
   - Name, description, price
   - Category, tags
   - Stock quantity
   - Images (add/remove)
4. Click **Save Changes**
5. Changes reflect immediately
6. Cache automatically cleared

#### Deleting a Product

1. Find product in product list
2. Click **Delete** button
3. Confirm deletion
4. Product marked as inactive
5. Removed from customer search results
6. Order history preserved

**Note:** Products are soft-deleted (not permanently removed) to maintain order history

#### Updating Stock

**Quick Update:**
1. Find product in product list
2. Click on stock quantity
3. Enter new quantity
4. Press Enter
5. Stock updated immediately
6. Real-time notification sent to users viewing product

**Bulk Update:**
1. Select multiple products (checkboxes)
2. Click **Bulk Actions** → **Update Stock**
3. Enter quantity change (+/- amount)
4. Click **Apply**

#### Managing Product Images

**Upload Images:**
1. Edit product
2. Click **Upload Images**
3. Select files (multiple selection supported)
4. Images automatically optimized and uploaded to CDN
5. Drag to reorder images

**Delete Images:**
1. Edit product
2. Click X on image thumbnail
3. Confirm deletion
4. Image removed from CDN

### 2. Order Management

#### Viewing All Orders

1. Go to **Admin Dashboard**
2. Click **Orders** in sidebar
3. See list of all orders with:
   - Order number
   - Customer name and email
   - Order date
   - Total amount
   - Status
   - Actions

#### Filtering Orders

**By Status:**
- All Orders
- Pending
- Paid
- Processing
- Shipped
- Delivered
- Cancelled

**By Date Range:**
1. Click date filter
2. Select start and end dates
3. Click **Apply**

**By Customer:**
1. Enter customer name or email in search
2. Results filter automatically

#### Viewing Order Details

1. Click on any order
2. Order detail page shows:
   - Customer information
   - Shipping address
   - Items ordered (with quantities and prices)
   - Payment information
   - Status history
   - Total breakdown

#### Updating Order Status

1. Open order details
2. Click **Update Status** button
3. Select new status:
   - Paid
   - Processing
   - Shipped
   - Delivered
4. Add optional note (e.g., tracking number)
5. Click **Update**
6. Customer receives notification via email and WebSocket

**Status Workflow:**
```
Pending → Paid → Processing → Shipped → Delivered
         ↓
      Cancelled
```

#### Searching Orders

**By Order Number:**
1. Enter order number in search box
2. Press Enter
3. Matching order displays

**By Customer Email:**
1. Enter customer email in search box
2. Press Enter
3. All orders for that customer display

### 3. Inventory Management

#### Inventory Dashboard

1. Go to **Admin Dashboard**
2. Click **Inventory** in sidebar
3. Dashboard shows:
   - Total products
   - Low stock products (highlighted in yellow)
   - Out of stock products (highlighted in red)
   - Stock value

#### Viewing Low Stock Items

1. Click **Low Stock** filter
2. See products below threshold
3. Each product shows:
   - Current stock
   - Low stock threshold
   - Recommended reorder quantity

#### Low Stock Alerts

**Automatic Alerts:**
- System checks stock levels periodically
- Email sent when product falls below threshold
- Alert includes product details and current stock

**Manual Check:**
1. Go to Inventory Dashboard
2. Click **Check Low Stock Now**
3. System scans all products
4. Alerts sent for low stock items

#### Updating Stock Thresholds

1. Edit product
2. Update **Low Stock Threshold** field
3. Save changes
4. New threshold applies immediately

### 4. Sales Reports

#### Generating Sales Report

1. Go to **Admin Dashboard**
2. Click **Reports** in sidebar
3. Select date range:
   - Today
   - Last 7 days
   - Last 30 days
   - Custom range
4. Click **Generate Report**

#### Report Contents

**Summary Metrics:**
- Total Revenue
- Number of Orders
- Average Order Value
- Total Items Sold

**Top Products:**
- Best-selling products by quantity
- Revenue per product
- Product performance trends

**Orders by Status:**
- Breakdown of order statuses
- Completion rate
- Cancellation rate

**Revenue Trends:**
- Daily/weekly revenue chart
- Comparison to previous period
- Growth percentage

#### Exporting Reports

1. Generate report
2. Click **Export** button
3. Choose format:
   - PDF
   - CSV
   - Excel
4. Download file

### 5. Performance Monitoring

#### System Health

1. Go to **Admin Dashboard**
2. Click **Performance** in sidebar
3. View system health:
   - Database status
   - Redis status
   - API response times
   - Error rates

#### Cache Statistics

View cache performance:
- Cache hit rate
- Cache miss rate
- Total keys
- Memory usage

**Clearing Cache:**
1. Click **Clear Cache** button
2. Select cache type:
   - Product cache
   - All cache
3. Confirm action
4. Cache cleared immediately

#### Database Status

Monitor database health:
- Connection status
- Total documents
- Database size
- Active connections

#### Performance Metrics

Track application performance:
- Requests per minute
- Average response time
- Error rate
- Active WebSocket connections

### 6. Customer Management

#### Viewing Customers

1. Go to **Admin Dashboard**
2. Click **Customers** in sidebar
3. See list of all customers with:
   - Name and email
   - Registration date
   - Total orders
   - Total spent
   - Status

#### Customer Details

1. Click on any customer
2. View customer profile:
   - Contact information
   - Order history
   - Wishlist items
   - Reviews written
   - Account status

#### Managing Customer Accounts

**Deactivate Account:**
1. Open customer details
2. Click **Deactivate Account**
3. Confirm action
4. Customer cannot log in

**Reactivate Account:**
1. Open customer details
2. Click **Reactivate Account**
3. Account restored

### 7. Review Management

#### Viewing All Reviews

1. Go to **Admin Dashboard**
2. Click **Reviews** in sidebar
3. See all product reviews with:
   - Product name
   - Customer name
   - Rating
   - Comment
   - Date
   - Status

#### Moderating Reviews

**Approve Review:**
1. Find pending review
2. Click **Approve**
3. Review becomes visible to customers

**Flag Review:**
1. Find inappropriate review
2. Click **Flag**
3. Add reason
4. Review hidden from customers

**Delete Review:**
1. Find review to delete
2. Click **Delete**
3. Confirm deletion
4. Review permanently removed
5. Product rating recalculated

---

## Troubleshooting

### Common Customer Issues

#### Can't Add Item to Cart

**Possible Causes:**
- Product out of stock
- Browser cookies disabled
- Network connection issue

**Solutions:**
1. Check product stock status
2. Enable cookies in browser settings
3. Refresh the page
4. Try different browser

#### Payment Declined

**Possible Causes:**
- Insufficient funds
- Incorrect card details
- Card expired
- Bank security block

**Solutions:**
1. Verify card details are correct
2. Check card expiration date
3. Contact your bank
4. Try different payment method

#### Order Not Showing

**Possible Causes:**
- Payment still processing
- Not logged into correct account
- Order confirmation email not received

**Solutions:**
1. Wait 5-10 minutes for processing
2. Check spam/junk folder for email
3. Verify you're logged into correct account
4. Contact support with order number

#### Can't Write Review

**Possible Causes:**
- Haven't purchased the product
- Already reviewed the product
- Not logged in

**Solutions:**
1. Verify you purchased the product
2. Check if you already reviewed it
3. Log in to your account

### Common Admin Issues

#### Can't Upload Product Images

**Possible Causes:**
- File too large (>5MB)
- Unsupported format
- Network issue
- Cloudinary configuration issue

**Solutions:**
1. Compress image to under 5MB
2. Use JPG, PNG, or WebP format
3. Check internet connection
4. Verify Cloudinary credentials in environment variables

#### Stock Not Updating

**Possible Causes:**
- Database connection issue
- Cache not cleared
- Concurrent updates

**Solutions:**
1. Refresh the page
2. Clear cache manually
3. Check database connection
4. Try again in a few seconds

#### Reports Not Generating

**Possible Causes:**
- Invalid date range
- No data for selected period
- Database query timeout

**Solutions:**
1. Select valid date range
2. Try shorter time period
3. Check if orders exist for that period
4. Contact technical support

---

## FAQ

### Customer FAQ

**Q: Is my payment information secure?**
A: Yes, all payments are processed through Stripe, a PCI-compliant payment processor. We never store your credit card details on our servers.

**Q: How long does shipping take?**
A: Shipping times vary by location. You'll receive an estimated delivery date at checkout and tracking information once your order ships.

**Q: Can I change my order after placing it?**
A: You can cancel orders while they're in "Pending" status. Once an order is being processed, please contact customer support for changes.

**Q: What if an item is out of stock?**
A: Add the item to your wishlist and you'll receive a notification when it's back in stock.

**Q: How do I return an item?**
A: Contact customer support with your order number to initiate a return. Return policy details are available in our Terms of Service.

**Q: Can I save multiple shipping addresses?**
A: Currently, you can save one default address in your profile. You can enter a different address at checkout if needed.

**Q: Why can't I review a product?**
A: You can only review products you've purchased. The review button appears after your order is delivered.

**Q: How do I delete my account?**
A: Contact customer support to request account deletion. Note that order history will be retained for legal compliance.

### Admin FAQ

**Q: How do I add an admin user?**
A: Admin users must be created directly in the database with role set to "admin". Contact technical support for assistance.

**Q: Can I bulk import products?**
A: Currently, products must be added individually through the admin panel. Bulk import feature is planned for future release.

**Q: How often are sales reports updated?**
A: Sales reports are generated in real-time based on current data when you request them.

**Q: Can I customize email templates?**
A: Email templates are defined in the code. Contact technical support to customize templates.

**Q: How do I backup the database?**
A: Database backups are handled automatically. Contact technical support for manual backup or restore.

**Q: What happens to reviews when I delete a product?**
A: Reviews are preserved in the database but hidden from customers. They remain linked to order history.

**Q: Can I set different tax rates for different regions?**
A: Currently, a single tax rate is applied globally. Multi-region tax support is planned for future release.

**Q: How do I handle refunds?**
A: Refunds must be processed through the Stripe dashboard. The order status will update automatically via webhook.

---

## Getting Help

### Customer Support

**Email:** support@shopmaster.com
**Hours:** Monday-Friday, 9 AM - 5 PM EST
**Response Time:** Within 24 hours

### Technical Support (Admin)

**Email:** tech@shopmaster.com
**Hours:** 24/7 for critical issues
**Response Time:** Within 4 hours for critical issues

### Documentation

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Payment Integration](./PAYMENT.md)

### Report a Bug

1. Go to GitHub repository
2. Click **Issues** tab
3. Click **New Issue**
4. Select **Bug Report** template
5. Fill in details and submit

### Feature Requests

1. Go to GitHub repository
2. Click **Issues** tab
3. Click **New Issue**
4. Select **Feature Request** template
5. Describe the feature and submit

---

## Appendix

### Keyboard Shortcuts

**Customer:**
- `/` - Focus search bar
- `Esc` - Close modals
- `Ctrl/Cmd + K` - Quick search

**Admin:**
- `Ctrl/Cmd + N` - New product
- `Ctrl/Cmd + S` - Save changes
- `Ctrl/Cmd + F` - Search

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

### System Requirements

**Minimum:**
- Internet connection: 1 Mbps
- Screen resolution: 1024x768
- JavaScript enabled
- Cookies enabled

**Recommended:**
- Internet connection: 5 Mbps+
- Screen resolution: 1920x1080
- Modern browser (latest version)

---

**Last Updated:** January 2024
**Version:** 1.0.0

For the latest updates and announcements, visit our website or follow us on social media.

