import User from "../models/user";
import Stripe from "stripe";
import queryString from "query-string";
import Hotel from "../models/hotel";
import Order from "../models/order";

const stripe = Stripe(process.env.STRIPE_SECRET);

export const createConnectAccount = async (req, res) => {
  // 1. find user from db
  const user = await User.findById(req.user._id).exec();
  console.log("USER ==> ", user);
  // 2. if user don't have stripe_account_id yet, create now
  if (!user.stripe_account_id) {
    const account = await stripe.accounts.create({
      type: "express",
    });
    console.log("ACCOUNT ===> ", account);
    user.stripe_account_id = account.id;
    user.save();
  }
  // 3. create login link based on account id (for frontend to complete onboarding)
  let accountLink = await stripe.accountLinks.create({
    account: user.stripe_account_id,
    refresh_url: process.env.STRIPE_REDIRECT_URL,
    return_url: process.env.STRIPE_REDIRECT_URL,
    type: "account_onboarding",
  });
  // prefill any info such as email
  accountLink = Object.assign(accountLink, {
    "stripe_user[email]": user.email || undefined,
  });
  // console.log("ACCOUNT LINK", accountLink);
  let link = `${accountLink.url}?${queryString.stringify(accountLink)}`;
  console.log("LOGIN LINK", link);
  res.send(link);
  // 4. update payment schedule (optional. default is 2 days
};

const updateDelayDays = async (accountId) => {
  const account = await stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          delay_days: 7,
        },
      },
    },
  });
  return account;
};

export const getAccountStatus = async (req, res) => {
  // console.log("GET ACCOUNT STATUS");
  const user = await User.findById(req.user._id).exec();
  const account = await stripe.accounts.retrieve(user.stripe_account_id);
  // console.log("USER ACCOUNT RETRIEVE", account);
  // update delay days
  const updatedAccount = await updateDelayDays(account.id);
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      stripe_seller: updatedAccount,
    },
    { new: true }
  )
    .select("-password")
    .exec();
  // console.log(updatedUser);
  res.json(updatedUser);
};

export const getAccountBalance = async (req, res) => {
  const user = await User.findById(req.user._id).exec();

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    // console.log("BALANCE ===>", balance);
    res.json(balance);
  } catch (err) {
    console.log(err);
  }
};

export const payoutSetting = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_account_id,
      {
        redirect_url: process.env.STRIPE_SETTING_REDIRECT_URL,
      }
    );
    // console.log("LOGIN LINK FOR PAYOUT SETTING", loginLink);
    res.json(loginLink);
  } catch (err) {
    console.log("STRIPE PAYOUT SETTING ERR ", err);
  }
};

export const stripeSessionId = async (req, res) => {
  const { hotelId } = req.body; //get hotel id

  const item = await Hotel.findById(hotelId).populate("postedBy").exec(); //find hotel

  const fee = (item.price * 20) / 100;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        name: item.title,
        amount: item.price * 100, // needs to be in cents
        currency: "usd",
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: fee * 100, //send in cents // this seller can see balance in frontend dashboard
      transfer_data: {
        destination: item.postedBy.stripe_account_id,
      },
    },
    success_url: `${process.env.STRIPE_SUCCESS_URL}/${item._id}`,
    cancel_url: process.env.STRIPE_CANCEL_URL,
  });

  await User.findByIdAndUpdate(req.user._id, { stripeSession: session }).exec();

  res.send({
    sessionId: session.id,
  });
};

export const stripeSuccess = async (req, res) => {
  try {
    //
    const { hotelId } = req.body;
    const user = await User.findById(req.user._id).exec();

    if (!user.stripeSession.id) {
      return;
    }
    const session = await stripe.checkout.sessions.retrieve(
      user.stripeSession.id
    );
    if (session.payment_status === "paid") {
      const orderExist = await Order.findOne({
        "session.id": session.id,
      }).exec();
      if (orderExist) {
        res.json({ success: true });
      } else {
        let newOrder = await new Order({
          hotel: hotelId,
          session,
          orderedBy: user._id,
        }).save();
        await User.findByIdAndUpdate(user._id, {
          $set: { stripeSession: {} },
        });
        res.json({ success: true });
      }
    }
  } catch (err) {
    console.log("stripe success error: ", err);
  }
};
