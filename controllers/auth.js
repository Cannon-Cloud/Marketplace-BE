import User from "../models/user";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  // validation
  if (!name) return res.status(400).send("Name is required");
  if (!password || password.length < 6)
    return res
      .status(400)
      .send("Password is required and should have at least 6 characters");
  let userExists = await User.findOne({ email: email }).exec();
  if (userExists) return res.status(400).send("Email is in use");
  // register
  const user = new User(req.body);
  try {
    await user.save();
    console.log("USER CREATED", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log("CREATE USER FAILED", err);
    return res.status(400).send("Error. Try again.");
  }
};

export const login = async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;
  try {
    // check if user email exists
    let user = await User.findOne({ email }).exec();
    if (!user) res.status(400).send("User not found");
    // compare password
    user.comparePassword(password, (err, match) => {
      if (!match || err) return res.status(400).send("Wrong password");
      // GENERATE A TOKEN THEN SEND AS RES TO CLIENT
      let token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stripe_account_id: user.stripe_account_id,
          striple_seller: user.striple_seller,
          stripeSession: user.stripeSession,
        },
      });
    });
  } catch (err) {
    console.log("LOGIN ERROR", err);
    res.status(400).send("Signin failed");
  }
};
