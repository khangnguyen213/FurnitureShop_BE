const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  discountedprice: { type: Number },
});

module.exports = mongoose.model('Product', productSchema);
