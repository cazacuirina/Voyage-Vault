const { db } = require("../database/database");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const saltRounds = 10;
const path = require('path');

const privateKeyPath = path.join(__dirname, '..', 'private.key');
const privateKey = fs.readFileSync(privateKeyPath);

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (!snapshot.empty) {
      return res.status(409).json({ error: "User with the same email already exists" });
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const user = { name, email, password: hash, lastLogin: admin.firestore.FieldValue.serverTimestamp() };

    const newUser = await usersRef.add(user);
    console.log("User registered:", newUser.id);

    const token = jwt.sign({
      data: { userName: name, userEmail: email },
      exp: Math.floor(Date.now() / 1000) + 3600
    }, privateKey, { algorithm: "RS256" });

    res.status(200).json({ token, userName: name, userEmail: email });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) return res.status(404).json({ error: "No user found with this email" });

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({
      data: { userName: user.name, userEmail: user.email },
      exp: Math.floor(Date.now() / 1000) + 3600
    }, privateKey, { algorithm: "RS256" });

    await usersRef.doc(userDoc.id).update({ lastLogin: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).json({ token, userName: user.name, userEmail: user.email });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No user found with this email" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from the old one" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await usersRef.doc(userDoc.id).update({
      password: hashedPassword
    });

    res.status(200).json({ message: "Password reset successful" });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const redirectToGoogle = (req, res, next) => {
  require("passport").authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

const googleCallback = (req, res, next) => {
  require("passport").authenticate("google", { failureRedirect: "/" }, () => {
    res.redirect("http://localhost:3000");
  })(req, res, next);
};

const getGoogleUser = (req, res) => {
  if (req.isAuthenticated()) {
    const { displayName, emails } = req.user;
    const token = jwt.sign({
      data: { userName: displayName, userEmail: emails[0].value },
      exp: Math.floor(Date.now() / 1000) + 3600
    }, privateKey, { algorithm: "RS256" });

    return res.json({ success: true, userName: displayName, userEmail: emails[0].value, token });
  }
  return res.status(401).json({ success: false, message: "Not authenticated" });
};

const logoutUser = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  redirectToGoogle,
  googleCallback,
  getGoogleUser,
  resetPassword
};