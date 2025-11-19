const express = require('express');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const reviewRoutes = require('./reviewRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', authRoutes); // Keep for backward compatibility
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
