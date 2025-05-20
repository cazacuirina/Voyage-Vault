const express = require('express');
const router = express.Router();
const { checkAuthorization } = require("../middleware/checkAuthorization");
const {
  saveSubscriptionPayment,
  savePostPayment,
  createSubscriptionCheckout,
  createPostCheckout
} = require('../controllers/payments');

router.post('/subscriber', checkAuthorization, saveSubscriptionPayment);
router.post('/post', checkAuthorization, savePostPayment);
router.post('/stripe/create-checkout-session', checkAuthorization, createSubscriptionCheckout);
router.post('/stripe/create-post-checkout-session', checkAuthorization, createPostCheckout);

module.exports = router;