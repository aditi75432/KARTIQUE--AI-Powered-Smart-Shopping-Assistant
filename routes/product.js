const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');
const { validateProduct , isLoggedIn  , isSeller ,isProductAuthor} = require('../middleware');
const {showAllProducts, productForm , createProduct , showProduct , editProductForm , updateProduct , deleteProduct} =  require('../controllers/product')
const mongoose = require('mongoose');

const dbURL = process.env.dbURL || 'mongodb://localhost:27017/shopping-adi-app';
const User = require('../models/User');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('user_data.db');

router.get('/', showAllProducts);

router.get('/new', isLoggedIn, isSeller, productForm);

router.post('/', isLoggedIn, isSeller, validateProduct, createProduct);

// router.get('/:id', isLoggedIn, showProduct);

router.get('/:id/edit', isLoggedIn, isProductAuthor, editProductForm);

router.patch('/:id', isLoggedIn, isProductAuthor, validateProduct, updateProduct);

router.delete('/:id', isLoggedIn, isProductAuthor, deleteProduct);




// AI-powered Recommendations Route
router.get('/recommendations', isLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;

        const response = await axios.get(`http://localhost:8000/api/recommend?user_id=${userId}`);
        const recommendedProducts = response.data.recommended_products;

        res.render('products/recommendations', { recommendedProducts });
    } catch (error) {
        console.error('Recommendation error:', error.message);
        req.flash('error', 'Failed to fetch recommendations.');
        res.redirect('/products');
    }
});

// Function to update user interests dynamically
async function updateUserInterests(userId, category) {
    try {
        const user = await User.findById(userId);
        if (!user || !category) return;

        await User.findByIdAndUpdate(userId, { 
            $addToSet: { interests: category } // ✅ Ensures unique category
        });

        // ✅ Sync SQLite AFTER MongoDB update
        db.run(`UPDATE users SET interests = ? WHERE user_id = ?`, 
               [user.interests.join(', '), userId], 
               (err) => {
                   if (err) console.error("SQLite update error:", err.message);
                   else console.log(`✅ Updated interests for user ${userId}`);
               });
    } catch (error) {
        console.error("Error updating user interests:", error);
    }
}




// Route to fetch product details and track interest

router.get('/:id', isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).render('error', { error: 'Invalid Product ID' });
        }

        const product = await Product.findById(id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/products');
        }

        // 🔄 Track interest
        if (req.isAuthenticated()) {
            await updateUserInterests(req.user._id.toString(), product.category);
        }

        // 🔍 Render using controller logic
        res.render('products/show', { product });

    } catch (e) {
        next(e);
    }
});








module.exports = router;