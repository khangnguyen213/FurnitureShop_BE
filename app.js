const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT || 5000;
const mongodbURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.btdla2l.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: mongodbURL,
  collection: 'sessions',
});

const app = express();

// Set trust proxy to configure Express.js
// to trust the proxy server that your app is running behind
app.set('trust proxy', 1);

app.use(
  cors({
    origin: '*',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
    credentials: true,
  })
);

app.use(
  session({
    // Secret used to sign the session ID cookie
    secret: 'my secret',
    // Disable automatic session storage when changes aren't made
    resave: false,
    // Prevent creating a new session if no changes are made
    saveUninitialized: false,
    // Set options object for the session middleware cookie
    cookie: {
      // Set sameSite attribute to lax to allow cross-site requests
      sameSite: 'lax',
      // Disable HTTPS requirement
      secure: false,
      // Set maximum age to 1 hour
      maxAge: 1000 * 60 * 60,
    },
    // Store session data in external store
    store: store,
  })
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res, next) => {
  return res.send('Connected');
});

const accountController = require('./controller/accountController');
const productController = require('./controller/productController');
const cartController = require('./controller/cartController');
const receiptController = require('./controller/receiptController');

const productRouter = express.Router();
const accountRouter = express.Router();
const cartRouter = express.Router();
const receiptRouter = express.Router();

// product Routes
productRouter
  .route('/')
  .get(productController.getProduct)
  .post(productController.addProduct);

// Cart Routes
cartRouter
  .route('/')
  .get(cartController.getProductDetailsInCart)
  .post(cartController.addToCart) // Add a product to the cart
  .put(cartController.editCart) // Edit the cart (update product quantity)
  .delete(cartController.deleteFromCart); // Delete a product from the cart

// Account Routes
accountRouter
  .route('/')
  .get(accountController.getAccount)
  .post(accountController.addAccount);

accountRouter.route('/admin').post(accountController.addAdmin);

receiptRouter
  .route('/')
  .get(receiptController.getReceipt)
  .post(receiptController.createReceipt);

accountRouter.route('/login').post(accountController.login);

accountRouter.route('/logout').get(accountController.logout);

// Mount the routers onto the app
app.use('/product', productRouter);
app.use('/account', accountRouter);
app.use('/cart', cartRouter);
app.use('/receipt', receiptRouter);

mongoose
  .connect(mongodbURL)
  .then((result) => {
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
