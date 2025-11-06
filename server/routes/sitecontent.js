const express = require("express");
const { db } = require("../firebase");
const admin = require("firebase-admin");

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get site content (public)
router.get("/content", async (req, res) => {
  try {
    const doc = await db.collection("siteContent").doc("homepage").get();
    
    if (doc.exists) {
      res.json(doc.data());
    } else {
      // Return default content if none exists
      res.json({
        heroTitle: "Welcome to Our Website",
        heroSubtitle: "Discover amazing products and services",
        aboutText: "We are a company dedicated to providing the best services to our customers.",
        contactInfo: "Contact us at info@example.com"
      });
    }
  } catch (error) {
    console.error("Error fetching site content:", error);
    res.status(500).json({ error: "Failed to fetch site content" });
  }
});

// Update site content (admin only)
router.put("/content", requireAdmin, async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, aboutText, contactInfo } = req.body;

    const contentData = {
      heroTitle,
      heroSubtitle,
      aboutText,
      contactInfo,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    };

    await db.collection("siteContent").doc("homepage").set(contentData, { merge: true });

    res.json({ success: true, ...contentData });
  } catch (error) {
    console.error("Error updating site content:", error);
    res.status(500).json({ error: "Failed to update site content" });
  }
});

module.exports = router;