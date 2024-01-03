const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'favorite', 'purchased'],
    default: 'pending',
  },
});

module.exports = mongoose.model('Cart', cartSchema);
