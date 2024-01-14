const Product = require('../model/product');

// GET CAUSE
exports.getProduct = (req, res) => {
  // Initialize an empty object to hold options for querying
  let findOpts = {};

  // If there is a causeID in the query parameters, add it as a filter.
  if (req.query.productId) {
    findOpts._id = req.query.productId;
  }
  // If there is a keyword in the query parameters, construct a regex to search
  // for titles and descriptions that match that keyword.
  if (req.query.keyword) {
    const keywordRegEx = new RegExp(req.query.keyword, 'iu'); // 'i' for case-insensitive, 'u' for unicode
    findOpts.title = { $regex: keywordRegEx };
  }

  // configure pagination options
  const pageNumber = req.query.pageNumber ? +req.query.pageNumber : 0;
  const nPerPage = req.query.nPerPage ? +req.query.nPerPage : 15;
  const skip = pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0;

  //promise to find documents base on findOpts
  const findPromise = Product.find({
    ...findOpts,
  })
    .skip(skip)
    .limit(nPerPage);

  //promise to count documents base on findOpts
  const countPromise = Product.countDocuments({
    ...findOpts,
  });

  //handle both find and count promise and response
  Promise.all([findPromise, countPromise])
    .then(([results, count]) => {
      // Handle paginated results and total count here
      const responseDate = {
        currentPage: pageNumber > 0 ? pageNumber : 1,
        totalPage: Math.ceil(count / nPerPage),
        products: results,
        count,
      };
      return res.send(responseDate);
    })
    .catch((error) => {
      // Handle error here
      return res.sendStatus(500);
    });
};

// ADD CAUSE
exports.addProduct = (req, res) => {
  Product.findOne({ title: req.body.title }).then((data) => {
    if (!data) {
      const cause = new Product({
        title: req.body.title,
        description: req.body.description || '',
        colors: req.body.colors || [],
        price: req.body.price,
        discountedprice: req.body.discountedprice,
        images: req.body.images,
        quantity: req.body.quantity || 0,
        status: 'active',
      });
      cause
        .save()
        .then((product) => {
          if (product) {
            // if product created success, send an HTTP status 201 mean created
            res.status(201).send(product._id);
          }
        })
        .catch((err) => {
          res.statusCode = 400;
          res.send(err);
          // return res.end();
        });
    } else {
      // if title existed, send an HTTP status 402
      res.statusCode = 400;
      res.statusMessage =
        "The product's title already exist - which may confuse customer";
      return res.end();
    }
  });
};

// UPDATE CAUSE
exports.updateProduct = (req, res) => {
  Product.findOneAndUpdate(
    { _id: req.params.product_id },
    { $set: req.body },
    { new: true }
  )
    .then((product) => {
      if (!product) {
        // if no product found send an HTTP status 404 (Not found)
        return res.sendStatus(404);
      } else {
        // Send the updated product as a response
        return res.json(product);
      }
    })
    .catch((err) => {
      // Handle any possible database errors
      return res.status(500).send(err);
    });
};

// DELETE CAUSE
exports.deleteProduct = (req, res) => {
  Product.findOneAndUpdate(
    { _id: req.params.product_id },
    { $set: { status: 'inactive' } },
    { new: true }
  )
    .then((product) => {
      if (!product) {
        // if no product found send an HTTP status 404 (Not found)
        return res.sendStatus(404);
      } else {
        // Send the updated product as a response
        return res.status(200).json(product);
      }
    })
    .catch((err) => {
      // Handle any possible database errors
      return res.status(500).send(err);
    });
};

// async function updateProducts() {
//   try {
//     // Update all documents
//     await Product.updateMany(
//       {},
//       {
//         $set: {
//           quantity: 0, // set the default quantity
//           status: 'active', // set the default status
//         },
//       }
//     );

//     console.log('All products updated successfully');
//   } catch (error) {
//     console.error('Error updating products:', error);
//   }
// }

// updateProducts();
