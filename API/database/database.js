const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../dbcredentials/tic2024-41e34-firebase-adminsdk-m6dc6-6a07f5dec1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "tic2024-41e34.appspot.com",
});

const db = getFirestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket, admin  };