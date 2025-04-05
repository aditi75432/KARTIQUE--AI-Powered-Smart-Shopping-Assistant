const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isLoggedIn } = require('../middleware');

// AI-powered product recommendations route
router.get('/recommendations', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Hit your Python AI API
    const response = await axios.get(`http://localhost:8000/api/recommend?user_id=${userId}`);
    const recommendedProductIds = response.data.recommended_products; // Expecting product _ids

    // Fetch actual product documents from MongoDB
    const Product = require('../models/Product');
    const products = await Product.find({ _id: { $in: recommendedProductIds } });

    res.render('products/recommendations', { recommendedProducts: products });
  } catch (err) {
    console.error('AI fetch error:', err.message);
    res.status(500).send("Failed to fetch recommendations.");
  }
});

module.exports = router;


