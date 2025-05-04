const jwt = require("jsonwebtoken");
const fs = require("fs");
const publicKey = fs.readFileSync("public.key");

function checkAuthorization(req, res, next) {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      user=decoded.data
      req.userName=user.userName
      req.userEmail=user.userEmail
      console.log("Authorized user: "+req.userName+" "+req.userEmail)
      next();
    }
  });
}

module.exports = { checkAuthorization };
