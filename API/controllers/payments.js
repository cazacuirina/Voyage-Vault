const { db, admin } = require("../database/database");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const { sendSubscriptionEmail, sendPostPaymentEmail } = require('./emailService');

exports.saveSubscriptionPayment = async (req, res) => {
  try {
    const { authorName, amount, isSubscription } = req.body;
    const priceAmount = Number(amount);
    const date = admin.firestore.FieldValue.serverTimestamp();
    const userName = req.userName;
    const userEmail = req.userEmail;
    const isSub = Boolean(isSubscription);

    if (!authorName || !amount || typeof isSubscription === 'undefined') {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();

    if (userSnapshot.empty || authorSnapshot.empty) {
      return res.status(404).json({ error: "User or Author not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const authorId = authorSnapshot.docs[0].id;
    const authorEmail = authorSnapshot.docs[0].data().email;

    await Promise.all([
      usersRef.doc(userId).collection("payments").add({
        author: authorName,
        amount: priceAmount,
        isSubscription: isSub,
        date,
      }),
      usersRef.doc(authorId).collection("earnings").add({
        buyer: userName,
        amount: priceAmount,
        isSubscription: isSub,
        date,
      }),
    ]);

    await sendSubscriptionEmail(userEmail, userName, authorName, amount, false);
    await sendSubscriptionEmail(authorEmail, authorName, userName, amount, true);

    res.status(200).json({ message: "Payment saved successfully!" });
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.savePostPayment = async (req, res) => {
  try {
    const { postTitle, price, authorName } = req.body;
    const priceAmount = Number(price);
    const date = admin.firestore.FieldValue.serverTimestamp();
    const userName = req.userName;
    const userEmail = req.userEmail;

    if (!postTitle || !price || !authorName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();

    if (userSnapshot.empty || authorSnapshot.empty) {
      return res.status(404).json({ error: "User or Author not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const authorId = authorSnapshot.docs[0].id;
    const authorEmail = authorSnapshot.docs[0].data().email;

    await Promise.all([
      usersRef.doc(userId).collection("payments").add({
        postTitle,
        author: authorName,
        amount: priceAmount,
        isSubscription: false,
        date,
      }),
      usersRef.doc(authorId).collection("earnings").add({
        postTitle,
        buyer: userName,
        amount: priceAmount,
        isSubscription: false,
        date,
      }),
    ]);

    await sendPostPaymentEmail(userEmail, userName, authorName, price, postTitle, false);
    await sendPostPaymentEmail(authorEmail, authorName, userName, price, postTitle, true);

    res.status(200).json({ message: "Post payment saved successfully!" });
  } catch (error) {
    console.error("Error saving post payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createSubscriptionCheckout = async (req, res) => {
  try {
    const { authorName, price } = req.body;
    const userEmail = req.userEmail;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Subscription to ${authorName}` },
            unit_amount: price * 100,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/subscription-success?authorName=${encodeURIComponent(authorName)}&price=${encodeURIComponent(price)}`,
      cancel_url: "http://localhost:3000/posts",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createPostCheckout = async (req, res) => {
  try {
    const { postTitle, price, authorName } = req.body;
    const userEmail = req.userEmail;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Payment for post: ${postTitle}` },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/post-pay-success?postTitle=${encodeURIComponent(postTitle)}&authorName=${encodeURIComponent(authorName)}&price=${encodeURIComponent(price)}`,
      cancel_url: "http://localhost:3000/posts",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session for post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
