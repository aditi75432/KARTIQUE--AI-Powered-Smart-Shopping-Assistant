const mongoose = require('mongoose');
const Review = require('./Review');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    img: {
        type: String,
        trim: true,
        default: '/images/product.jpg'
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    desc: {
        type: String,
        trim: true
    },
    avgRating: {
        type: Number,
        default:0 
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    brand: {
        type: String,
        trim: true
    },
    subcategory: String,
    category: String, 
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Review'
        }
    ]
});


productSchema.post('findOneAndDelete',async function(product) {
    if (product.reviews.length > 0) {
        await Review.deleteMany({ _id: { $in: product.reviews } });
    }
});

// ✅ Full-text search index
productSchema.index({ name: "text", desc: "text" });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
