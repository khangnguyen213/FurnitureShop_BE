const Account = require('../model/account');
const Cart = require('../model/cart');

const bcrypt = require('bcryptjs');

//GET ACCOUNT / ACCOUNTS
exports.getAccount = (req, res, next) => {
  // If accountID is provided, only retrieve details if current user matches
  const accountID = req.query.accountID;
  if (accountID) {
    // Check if user is authorized to view account information
    if (req.session.account?._id.toString() === accountID) {
      findOpts._id = accountID;
    } else {
      return res.sendStatus(403);
    }
  }
};

// ADD ACCOUNT
exports.addAccount = async (req, res, next) => {
  try {
    // Check if an account with the specified email already exists
    const existingAccount = await Account.findOne({ email: req.body.email });

    if (existingAccount) {
      // Return a 402 status code if the email is already taken
      return res.status(400).send('This email already exists');
    }

    // Create a new account instance and save it to the database
    const newAccount = new Account({
      ...req.body,
      password: bcrypt.hashSync(req.body.password, 12),
      isAdmin: false,
    });
    await newAccount.save();

    await Cart.create({
      account: newAccount._id,
      products: [],
      status: 'pending',
    });

    return res.sendStatus(200);
  } catch (error) {
    // Handle any errors and return a 500 status code
    return res.status(500).send(error.toString());
  }
};

// ADD ADMIN
exports.addAdmin = async (req, res, next) => {
  try {
    const existingAccount = await Account.findOne({ email: req.body.email });

    if (existingAccount) {
      return res.status(400).send('This email already exists');
    }

    const newAccount = new Account({
      ...req.body,
      password: bcrypt.hashSync(req.body.password, 12),
      isAdmin: true,
    });
    await newAccount.save();

    await Cart.create({
      account: newAccount._id,
      products: [],
      status: 'pending',
    });
    return res.sendStatus(200);
  } catch (error) {
    // handle error
    return res.status(500).send(error.toString());
  }
};

// LOGIN
// LOGIN
exports.login = async (req, res) => {
  try {
    // Find an account with the email provided in the request body
    const result = await Account.findOne({ email: req.body.email }).lean();

    // If an account is found
    if (result) {
      // Check if its password matches the hash in the database
      const isMatch = await bcrypt.compare(req.body.password, result.password);

      if (isMatch) {
        // If the account's status is "active"
        // Set the account information as the value of the "account" key in the session object
        req.session.account = result;

        // Extract the fullname, role, and _id fields from the account object and send them as a response
        const { fullname, _id } = result;
        return res.status(200).send({
          fullname,
          _id,
        });
      }
    }

    // If no account is found or the password doesn't match, send an error response
    return res.status(401).send({ error: 'Invalid email or password.' });
  } catch (error) {
    // Handle any other errors
    console.error(error);
    return res
      .status(500)
      .send({ error: 'An error occurred while trying to log in.' });
  }
};

//LOGOUT
exports.logout = (req, res) => {
  req.session.destroy(() => {
    return res.sendStatus(200);
  });
};
