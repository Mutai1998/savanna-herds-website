const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    
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

// Get all users (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const listUsers = await admin.auth().listUsers();
    const db = admin.firestore();
    
    const usersWithRoles = await Promise.all(
      listUsers.users.map(async (userRecord) => {
        const userDoc = await db.collection("users").doc(userRecord.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        return {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userData.name || userRecord.displayName || userRecord.email.split('@')[0],
          role: userData.role || "user",
          createdAt: userRecord.metadata.creationTime
        };
      })
    );
    
    res.json(usersWithRoles);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create new user (admin only)
router.post("/", requireAdmin, async (req, res) => {
  const { email, password, name, role = "user" } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || email.split('@')[0]
    });

    // Store user data in Firestore with UID as document ID
    const db = admin.firestore();
    await db.collection("users").doc(userRecord.uid).set({
      email: email,
      name: name || email.split('@')[0],
      role: role,
      createdAt: new Date()
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      name: name || userRecord.displayName || email.split('@')[0],
      role: role
    });
  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user role (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["admin", "user"].includes(role)) {
    return res.status(400).json({ error: "Valid role (admin/user) is required" });
  }

  try {
    const db = admin.firestore();
    await db.collection("users").doc(id).update({ role });

    res.json({ success: true, uid: id, role });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(id);
    
    // Delete from Firestore
    const db = admin.firestore();
    await db.collection("users").doc(id).delete();

    res.json({ success: true, uid: id });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;