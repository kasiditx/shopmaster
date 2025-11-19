/**
 * Central configuration module
 * Exports all configuration utilities for the application
 */

const { connectRedis, getRedisClient, disconnectRedis } = require('./redis');
const { initializeSocket, getIO, emitToUser, emitToProduct, broadcast } = require('./socket');
const { initializeEmailService, getEmailTransporter, sendEmail, emailTemplates } = require('./email');
const { initializeCloudinary, uploadImage, uploadMultipleImages, deleteImage, deleteMultipleImages, getOptimizedImageUrl, cloudinary } = require('./cloudinary');
const { initializeStripe, getStripeClient, verifyWebhookSignature } = require('./stripe');

module.exports = {
  // Redis
  redis: {
    connect: connectRedis,
    getClient: getRedisClient,
    disconnect: disconnectRedis
  },
  
  // Socket.io
  socket: {
    initialize: initializeSocket,
    getIO,
    emitToUser,
    emitToProduct,
    broadcast
  },
  
  // Email
  email: {
    initialize: initializeEmailService,
    getTransporter: getEmailTransporter,
    send: sendEmail,
    templates: emailTemplates
  },
  
  // Cloudinary
  cloudinary: {
    initialize: initializeCloudinary,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    deleteMultipleImages,
    getOptimizedImageUrl,
    client: cloudinary
  },
  
  // Stripe
  stripe: {
    initialize: initializeStripe,
    getClient: getStripeClient,
    verifyWebhook: verifyWebhookSignature
  }
};
