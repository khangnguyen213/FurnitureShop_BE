const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  paymentDate: { type: Date, default: Date.now },
  productList: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalPayment: { type: Number, required: true },
});

module.exports = mongoose.model('Receipt', receiptSchema);
