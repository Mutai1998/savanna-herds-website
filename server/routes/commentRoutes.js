const express = require("express");
const { addComment, getAllComments, approveComment, deleteComment } = require("../models/comments");

const router = express.Router();

// Create new comment
router.post("/", async (req, res) => {
  try {
    const comment = await addComment(req.body);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get all comments (admin)
router.get("/", async (req, res) => {
  try {
    const comments = await getAllComments();
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Approve a comment
router.put("/:id/approve", async (req, res) => {
  try {
    const result = await approveComment(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({ error: "Failed to approve comment" });
  }
});

// Delete a comment
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteComment(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
