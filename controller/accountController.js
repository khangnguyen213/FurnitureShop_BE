const Account = require('../model/account');

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
      res.statusCode = 400;
      res.statusText = 'This email already exists';
      return res.end();
    }

    // Create a new account instance and save it to the database
    const newAccount = new Account({
      ...req.body,
      password: bcrypt.hashSync(req.body.password, 12),
    });
    await newAccount.save();

    return res.sendStatus(200);
  } catch (error) {
    // Handle any errors and return a 500 status code
    return res.status(500).send(error.toString());
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    // Find an account with the email provided in the request body
    const result = await Account.findOne({ email: req.body.email });

    // If an account is found and its password matches the hash in the database
    if (result && bcrypt.compareSync(req.body.password, result.password)) {
      // If the account's status is "active"
      // Set the account information as the value of the "account" key in the session object
      req.session.account = result;

      // Extract the fullname, role, and _id fields from the account object and send them as a response
      const { fullname, _id } = result;
      return res.status(200).send({
        fullname,
        _id,
      });
    } else {
      // If no account is found or the passwords don't match, throw an error
      throw new Error('Email or Password not correct');
    }
  } catch (err) {
    // If there is an error, return a 401 status code and the error message as a string
    return res.status(401).send(err.toString());
  }
};

//LOGOUT
exports.logout = (req, res) => {
  req.session.destroy(() => {
    return res.sendStatus(200);
  });
};
