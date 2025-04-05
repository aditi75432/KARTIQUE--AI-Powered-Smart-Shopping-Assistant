const Product = require("../models/Product");
const User = require('../models/User');

const showAllProducts = async (req, res) => {
    try {
        let query = {};
        if (req.query.category) {
            query.category = req.query.category; // Filter products by selected category
        }

        const products = await Product.find(query);
        let topCategories = [];
        let user = null;

        if (req.user) {
            user = await User.findById(req.user._id);
            const freqMap = {};
            user.interests.forEach(cat => {
                freqMap[cat] = (freqMap[cat] || 0) + 1;
            });
            topCategories = Object.entries(freqMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, count]) => ({ name: cat, count }));
        }

        res.render('products/index', { products, topCategories, user }); // Pass user to template
    } catch (e) {
        res.status(500).render('error', { err: e.message });
    }
};

const productForm = (req, res) => {
    try {
        res.render('products/new');
    }
    catch (e) {
         res.status(500).render('error',{err:e.message})
    }  
}

const createProduct = async (req, res) => {
    try {
        const { name, img, desc, price, category } = req.body;
        await Product.create({
            name,
            img,
            price: parseFloat(price),
            desc,
            category,
            author: req.user._id
        });
        req.flash('success', 'Successfully added a new product!');
        res.redirect('/products');
    } catch (e) {
        res.status(500).render('error', { err: e.message });
    }
};

const sqlite3 = require('sqlite3').verbose();

const showProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/products');
    }

    let user = null;
    if (req.user) {
        user = await User.findById(req.user._id);
        
        console.log(`🔍 User found: ${user._id}`);

        if (product.category) {
            console.log(`📌 Product category: ${product.category}`);

            if (!user.interests.includes(product.category)) {
                await User.findByIdAndUpdate(user._id, { 
                    $addToSet: { interests: product.category } 
                });
                console.log(`✅ Added interest: ${product.category}`);
            }
        }

        if (!user.browsingHistory.includes(product.name)) {
            user.browsingHistory.push(product.name);
            console.log(`🛒 Added to browsing history: ${product.name}`);
        }

        if (user.browsingHistory.length > 10) {
            user.browsingHistory = user.browsingHistory.slice(-10);
        }
        await user.save();

        // ✅ Sync SQLite AFTER MongoDB update
        const db = new sqlite3.Database('user_data.db');
        db.run(`
            INSERT OR REPLACE INTO users (user_id, interests, history)
            VALUES (?, ?, ?)
        `, [
            user._id.toString(),
            user.interests.join(', '),
            user.browsingHistory.join(', ')
        ], (err) => {
            if (err) console.error('❌ SQLite insert error:', err.message);
            else console.log(`✅ Synced to SQLite: ${user._id}`);
            db.close();
        });
    }

    res.render('products/show', { product, user });
};



// const sqlite3 = require('sqlite3').verbose();

// const showProduct = async (req, res) => {
//     const { id } = req.params;
//     const product = await Product.findById(id);

//     if (!product) {
//         req.flash('error', 'Product not found.');
//         return res.redirect('/products');
//     }

//     let user = null;
//     if (req.user) {
//         user = await User.findById(req.user._id);

//         if (product.category && !user.interests.includes(product.category)) {
//             user.interests.push(product.category);
//         }

//         if (!user.browsingHistory) user.browsingHistory = [];

//         const lastViewed = user.browsingHistory[user.browsingHistory.length - 1];
//         if (lastViewed !== product.name) {
//             user.browsingHistory.push(product.name);
//         }

//         if (user.browsingHistory.length > 10) {
//             user.browsingHistory = user.browsingHistory.slice(-10);
//         }

//         await user.save();

//         const db = new sqlite3.Database('ai-system/user_data.db');
//         db.run(`
//             INSERT OR REPLACE INTO users (user_id, interests, history)
//             VALUES (?, ?, ?)
//         `, [
//             user._id.toString(),
//             user.interests.join(', '),
//             user.browsingHistory.join(', ')
//         ], (err) => {
//             if (err) console.error('SQLite insert error (view):', err.message);
//             db.close();
//         });
//     }

//     res.render('products/show', { product, user });
// };

// module.exports.showProduct = showProduct;

const editProductForm = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        res.render('products/edit', { product });
    }
    catch (e) {
        res.status(500).render('error',{err:e.message})
    }  
}
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, img, desc, category } = req.body;
        await Product.findByIdAndUpdate(id, {
            name,
            price,
            desc,
            img,
            category
        });
        req.flash('success', 'Edit Your Product Successfully');
        res.redirect(`/products/${id}`);
    } catch (e) {
        res.status(500).render('error', { err: e.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.redirect('/products');
    }
    catch (e) {
        // res.status(500).render('error',{err:e.message}) 
        console.error('❌ Controller Error:', e); // Add this above render
        res.status(500).render('error', { err: e.message || e }); // Fallback to full error if no message
  
    }
}

module.exports = {showAllProducts , productForm , createProduct , showProduct , editProductForm , updateProduct , deleteProduct };



