const jwt = require("jsonwebtoken");
const SECRET = "your_jwt_secret";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function isAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin access only" });
  next();
}

module.exports = { verifyToken, isAdmin };
