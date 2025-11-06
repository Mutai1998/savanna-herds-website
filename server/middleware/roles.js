function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}

function isUser(req, res, next) {
  if (["user", "admin"].includes(req.user.role)) {
    return next();
  }
  res.status(403).json({ error: "Access denied." });
}

module.exports = { isAdmin, isUser };
