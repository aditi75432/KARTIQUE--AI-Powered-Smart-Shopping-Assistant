if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport =  require('passport');
const LocalStrategy =  require('passport-local');
const User = require('./models/User');
const seedDB = require('./seed')
const MongoStore = require('connect-mongo');



const dbURL = process.env.dbURL || 'mongodb://localhost:27017/shopping-adi-app';

mongoose.set('strictQuery', true);
mongoose.connect(dbURL)
    .then(() => console.log('DB Connected'))
    .catch((err) => console.log(err));


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));





let secret = process.env.SECRET || 'weneedabettersecretkey';

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.originalUrl}`);
        next();
    });
}


let store = MongoStore.create({
    secret:secret,
    mongoUrl: dbURL,
    touchAfter:24*60*60
})

const sessionConfig = {
    store:store,
    name:'bhaukaal',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,
        expires:Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



passport.use(new LocalStrategy(User.authenticate()));


app.use((req, res, next) => {
    // console.log("🔹 Checking session user globally:", req.user);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//seedDB();

// Routes require
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const reviewRoutes = require('./routes/review');
const cartRoutes = require('./routes/cart');
const productApi = require('./routes/api/productapi');
const paymentRoutes = require('./routes/payment');
const visionSearchRoutes = require('./routes/api/visionSearch');
const aiRecommendationRoutes = require('./routes/aiRecommendations');




app.get('/' , (req,res)=>{
    res.render('home');
})
app.get('/favicon.ico', (req, res) => res.status(204));




// middle express

app.use('/', visionSearchRoutes); 

// app.use(productRoutes);
// app.use(reviewRoutes);
// app.use(authRoutes);
// app.use(cartRoutes);
// app.use(productApi);
// app.use(paymentRoutes);
app.use('/products', productRoutes);       // All product routes under /products/*
app.use('/reviews', reviewRoutes);         // Review-specific routes
app.use('/', authRoutes);                  // Login, register, logout routes stay at root
app.use(cartRoutes);              // Cart under /cart/*
app.use('/api/products', productApi);      // APIs for products
app.use(paymentRoutes);        // Payment-specific routes

app.use('/uploads', express.static('uploads'));
app.use(aiRecommendationRoutes);


const port = 5000;

// Catch-all error handler (e.g., unhandled routes or exceptions)
app.use((err, req, res, next) => {
    console.error("🔥 Global error handler caught:", err.stack || err);
    res.status(500).render('error', { err: err.message || "Unexpected error" });
});


app.listen(port, () => {
    console.log(`server running at port ${port}`);
});
