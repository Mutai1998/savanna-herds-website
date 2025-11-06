const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

/**
 * Verify Firebase ID Token and return user details
 */
router.post("/login", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    
    // Look for user document with the UID as document ID
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: "User not found in database" });
    }
    
    const userData = userDoc.data();
    
    // Check if user has admin role
    if (userData.role !== "admin") {
      return res.status(403).json({ error: "Admin privileges required" });
    }

    res.json({ 
      uid: decoded.uid, 
      email: decoded.email, 
      name: userData.name || decoded.email.split('@')[0],
      role: userData.role 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

/**
 * Verify token endpoint
 */
router.post("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ valid: false, error: "No token" });

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    
    // Look for user document with the UID as document ID
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ valid: false, error: "User not found" });
    }
    
    const userData = userDoc.data();

    res.json({ 
      valid: true, 
      uid: decoded.uid, 
      email: decoded.email, 
      name: userData.name,
      role: userData.role 
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

module.exports = router;