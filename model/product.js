const mongoose = require('mongoose');

function arrayLimit(val) {
  return val.length <= 4;
}

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  colors: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 4'],
  },
  images: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 4'],
    required: true,
  },
  price: { type: Number, required: true },
  discountedprice: { type: Number },
  quantity: { type: Number, required: true }, // new field for quantity
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // new field for status
});

module.exports = mongoose.model('Product', productSchema);
