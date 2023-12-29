const Cart = require('../model/cart');
const Product = require('../model/product');

async function addToCart(req, res) {
  const { accountId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ account: accountId });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Check if the product already exists in the cart
    const existingProductIndex = cart.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // If the product exists, update its quantity
      cart.products[existingProductIndex].quantity += quantity || 1;
    } else {
      // If the product doesn't exist, add it to the cart
      cart.products.push({ product: productId, quantity: quantity || 1 });
    }

    // Save the updated cart
    await cart.save();

    return res.status(200).json({ message: 'Product added to cart', cart });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error adding product to cart', error: error.message });
  }
}

async function editCart(req, res) {
  const { accountId, productId, newQuantity } = req.body;

  try {
    let cart = await Cart.findOne({ account: accountId });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const existingProductIndex = cart.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // If the product exists in the cart, update its quantity
      cart.products[existingProductIndex].quantity = newQuantity;
      await cart.save();

      return res.status(200).json({ message: 'Cart updated', cart });
    }

    return res.status(404).json({ message: 'Product not found in cart' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error editing cart', error: error.message });
  }
}

async function deleteFromCart(req, res) {
  const { accountId, productId } = req.body;

  try {
    let cart = await Cart.findOne({ account: accountId });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const existingProductIndex = cart.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // If the product exists in the cart, remove it
      cart.products.splice(existingProductIndex, 1);
      await cart.save();

      return res
        .status(200)
        .json({ message: 'Product removed from cart', cart });
    }

    return res.status(404).json({ message: 'Product not found in cart' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error deleting product from cart',
      error: error.message,
    });
  }
}

async function getProductDetailsInCart(req, res) {
  const { accountId } = req.params; // Assuming accountId is passed as a parameter

  try {
    const cart = await Cart.findOne({ account: accountId }).populate(
      'products'
    );

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const productsInCart = cart.products;

    // Extract product details from the cart
    const productDetails = [];

    for (const item of productsInCart) {
      const product = item.product;
      const productDetail = await Product.findById(product._id);

      if (productDetail) {
        // If product details are found, add them to the result
        productDetails.push({
          product: productDetail,
          quantity: item.quantity,
        });
      }
    }

    return res.status(200).json({ productsInCart: productDetails });
  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving product details from cart',
      error: error.message,
    });
  }
}

module.exports = {
  addToCart,
  editCart,
  deleteFromCart,
  getProductDetailsInCart,
};
