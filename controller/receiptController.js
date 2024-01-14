const Receipt = require('../model/receipt');
const Account = require('../model/account');
const Product = require('../model/product');
const Cart = require('../model/cart');

async function createReceipt(req, res) {
  const { accountId } = req.body; // Assuming accountId is provided in the request body

  try {
    const [account, cart] = await Promise.all([
      Account.findById(accountId),
      Cart.findOne({ account: accountId, status: 'pending' }).populate(
        'products.product'
      ),
    ]);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ message: 'Pending cart not found' });
    }

    let totalPayment = 0;
    const returnProductList = [];

    for (let item of cart.products) {
      const productDetail = item.product;
      const { _id, price, discountedprice, title } = productDetail;
      const quantity = item.quantity;
      totalPayment += (discountedprice || price) * quantity;
      returnProductList.push({
        product: _id,
        title,
        quantity,
        price: discountedprice || price,
      });
    }

    const newReceipt = await Receipt.create({
      accountId,
      productList: returnProductList,
      totalPayment,
    });

    // Update cart status to 'purchased'
    cart.status = 'purchased';
    cart.save();

    // Create new pending cart
    Cart.create({
      account: accountId,
      status: 'pending',
      products: [],
    });

    const receipt = {
      productList: returnProductList,
      buyername: account.fullname,
      totalPayment: newReceipt.totalPayment,
      paymentDate: newReceipt.paymentDate,
    };
    sendEmail(receipt, account.email);

    return res.status(201).json({
      message: 'Receipt created successfully',
      receipt,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error creating receipt', error: error.message });
  }
}

async function getReceipt(req, res) {
  const { id } = req.query;

  if (!id) return res.status(404).json({ message: 'Account not found' });

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
        select: 'title price discountedprice', // Assuming 'title' and 'images' are relevant fields in the Product model
      });
    return res.status(200).json({ receipts });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Error fetching receipts', error: error.message });
  }
}

function formatMoney(amount) {
  // Convert the number to a string and split it into parts before and after the decimal point
  const parts = amount.toString().split('.');

  // Add commas as thousand separators to the part before the decimal point
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Join the parts back together with a period (.) as the decimal separator
  return parts.join('.');
}

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);

async function sendEmail(receipt, email) {
  // Construct the email template data

  const template_data = {
    fullname: receipt.buyername,
    products: receipt.productList.map((product) => {
      return {
        ...product,
        price: formatMoney(product.price),
      };
    }),
    total: formatMoney(receipt.totalPayment),
    date: new Date(receipt.paymentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    }),
  };
  console.log(email);
  try {
    // Send the email using SendGrid API
    await sgMail.send({
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'FURNIO - RECEIPT',
      templateId: 'd-244fea92a20249aa9076763462c3fe67',
      dynamicTemplateData: template_data,
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createReceipt,
  getReceipt,
};
