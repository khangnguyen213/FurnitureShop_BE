const Receipt = require('../model/receipt');
const Account = require('../model/account');
const Product = require('../model/product');
const Cart = require('../model/cart');

async function createReceipt(req, res) {
  const { accountId } = req.body; // Assuming accountId is provided in the request body

  try {
    const account = await Account.findById(accountId);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const cart = await Cart.findOne({ account: accountId, status: 'pending' });

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ message: 'Pending cart not found' });
    }

    let totalPayment = 0;
    let productList = cart.products;

    for (const item of productList) {
      const product = item.product;
      const productDetail = await Product.findById(product._id);

      if (productDetail) {
        const { price, discountedprice } = productDetail;
        const quantity = item.quantity;
        totalPayment += (discountedprice || price) * quantity;
      }
    }

    const newReceipt = await Receipt.create({
      accountId,
      productList,
      totalPayment,
    });

    // Update cart status to 'purchased'
    cart.status = 'purchased';
    await cart.save();

    // Create new pending cart
    const newCart = await Cart.create({
      account: accountId,
      status: 'pending',
      products: [],
    });

    return res.status(201).json({
      message: 'Receipt created successfully',
      receipt: newReceipt,
      newCart,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error creating receipt', error: error.message });
  }
}

async function getReceipt(req, res) {
  const { id } = req.query;

  if (!id)
    return res
      .status(500)
      .json({ message: 'Error fetching receipts', error: error.message });

  try {
    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const receipts = await Receipt.find({ accountId: id })
      .populate({
        path: 'accountId',
        select: 'fullname', // Assuming 'fullname' is the field containing the user's name in the Account model
      })
      .populate({
        path: 'productList.product',
        select: 'title images', // Assuming 'title' and 'images' are relevant fields in the Product model
      });

    return res.status(200).json({ receipts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error fetching receipts', error: error.message });
  }
}

module.exports = {
  createReceipt,
  getReceipt,
};
