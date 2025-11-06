const express = require("express");
const multer = require("multer");
const { db, bucket } = require("../firebase");
const {
  addComment,
  getAllComments,
  approveComment,
  deleteComment,
} = require("../models/comments");

const router = express.Router();

// ✅ Setup Multer before defining routes
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Helper function for Cloud Storage upload
async function uploadImageToCloudStorage(file) {
  if (!file) return null;

  const filename = `${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(filename);
  const blobStream = fileUpload.createWriteStream({
    metadata: { contentType: file.mimetype },
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (error) => {
      console.error("Error uploading image:", error);
      reject(new Error("Failed to upload image"));
    });

    blobStream.on("finish", async () => {
      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
}

// ✅ Create a new comment
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file ? await uploadImageToCloudStorage(req.file) : null;
    const comment = await addComment(req.body, imageUrl);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ✅ Get all comments
router.get("/", async (req, res) => {
  try {
    const comments = await getAllComments();
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ✅ Approve a comment
router.put("/:id/approve", async (req, res) => {
  try {
    const result = await approveComment(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({ error: "Failed to approve comment" });
  }
});

// ✅ Delete a comment
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
