const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 * @returns {Object} Nodemailer transporter
 */
const initializeEmailService = () => {
  if (transporter) {
    return transporter;
  }

  // Configure transporter based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production configuration (e.g., SendGrid, AWS SES, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development configuration (Ethereal for testing)
    // In production, replace with actual email service
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASSWORD || 'test'
      }
    });
  }

  console.log('Email service: Initialized');
  return transporter;
};

/**
 * Get email transporter instance
 * @returns {Object} Nodemailer transporter
 */
const getEmailTransporter = () => {
  if (!transporter) {
    return initializeEmailService();
  }
  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const emailTransporter = getEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"E-commerce Platform" <noreply@ecommerce.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl(info) // Only works with Ethereal
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Email templates
 */
const emailTemplates = {
  orderConfirmation: (orderData) => ({
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html: `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
      <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
      <p>We'll send you another email when your order ships.</p>
    `
  }),

  orderStatusUpdate: (orderData) => ({
    subject: `Order Status Update - ${orderData.orderNumber}`,
    html: `
      <h1>Order Status Update</h1>
      <p>Your order status has been updated.</p>
      <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
      <p><strong>New Status:</strong> ${orderData.status}</p>
    `
  }),

  priceDropAlert: (productData) => ({
    subject: `Price Drop Alert - ${productData.name}`,
    html: `
      <h1>Price Drop Alert!</h1>
      <p>Good news! A product in your wishlist has dropped in price.</p>
      <p><strong>Product:</strong> ${productData.name}</p>
      <p><strong>New Price:</strong> $${productData.price.toFixed(2)}</p>
    `
  }),

  stockAvailableAlert: (productData) => ({
    subject: `Back in Stock - ${productData.name}`,
    html: `
      <h1>Back in Stock!</h1>
      <p>A product in your wishlist is now available.</p>
      <p><strong>Product:</strong> ${productData.name}</p>
      <p>Order now before it sells out again!</p>
    `
  }),

  lowStockAlert: (productData) => ({
    subject: `Low Stock Alert - ${productData.name}`,
    html: `
      <h1>Low Stock Alert</h1>
      <p>The following product is running low on stock:</p>
      <p><strong>Product:</strong> ${productData.name}</p>
      <p><strong>Current Stock:</strong> ${productData.stock}</p>
      <p><strong>Threshold:</strong> ${productData.lowStockThreshold}</p>
    `
  })
};

module.exports = {
  initializeEmailService,
  getEmailTransporter,
  sendEmail,
  emailTemplates
};
