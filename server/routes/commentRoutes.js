const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  addComment,
  getAllComments,
  approveComment,
  deleteComment,
  getCommentById,
  updateComment
} = require("../models/comments");

const router = express.Router();

// ✅ Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/comments');
const publicImagesDir = path.join(__dirname, '../public/images/comments');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log('✅ Created public images directory:', publicImagesDir);
}

// ✅ Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    const safeFileName = baseName.replace(/[^a-zA-Z0-9]/g, '_') + '-' + uniqueSuffix + fileExtension;
    cb(null, safeFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ Helper function to handle local image storage
async function handleImageUpload(file, oldImagePath = null) {
  if (!file) return null;

  try {
    console.log('📤 Handling local image upload...');
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });

    // Generate public URL path
    const publicUrl = `/images/comments/${file.filename}`;
    
    // Define source and destination paths
    const sourcePath = file.path;
    const destPath = path.join(publicImagesDir, file.filename);

    console.log('Source path:', sourcePath);
    console.log('Destination path:', destPath);
    console.log('Public URL:', publicUrl);

    // Copy file from uploads to public directory
    await fs.promises.copyFile(sourcePath, destPath);
    console.log('✅ Image copied to public directory');

    // Remove the temporary file from uploads directory
    await fs.promises.unlink(sourcePath);
    console.log('✅ Temporary file removed');

    // Remove old image if it exists
    if (oldImagePath) {
      await removeOldImage(oldImagePath);
    }

    return publicUrl;

  } catch (error) {
    console.error('❌ Error handling image upload:', error);
    
    // Clean up temporary file if it exists
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }
    }
    
    throw new Error('Failed to process image: ' + error.message);
  }
}

// ✅ Helper function to remove old images
async function removeOldImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const imagePath = path.join(publicImagesDir, filename);

    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
      console.log('✅ Old image removed:', filename);
    }
  } catch (error) {
    console.error('❌ Error removing old image:', error);
    // Don't throw error here - we don't want image deletion failures to break the main operation
  }
}

// ✅ Create a new comment
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;
    
    if (req.file) {
      imageUrl = await handleImageUpload(req.file);
    }

    const comment = await addComment(req.body, imageUrl);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    
    // Clean up file if upload failed
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: "Failed to add comment: " + error.message });
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

// ✅ Get single comment by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching comment with ID:", id);
    
    const comment = await getCommentById(id);
    
    if (!comment) {
      console.log("❌ Comment not found for ID:", id);
      return res.status(404).json({ error: "Comment not found" });
    }
    
    console.log("✅ Found comment:", comment.id);
    res.json(comment);
  } catch (error) {
    console.error("❌ Error fetching comment:", error);
    res.status(500).json({ error: "Failed to fetch comment: " + error.message });
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

// ✅ Update a comment
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating comment ID:", id);
    console.log("Request body:", req.body);
    console.log("File:", req.file ? `File present: ${req.file.originalname}` : "No file");

    // Get current comment to handle image updates properly
    const currentComment = await getCommentById(id);
    if (!currentComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    let imageUrl = currentComment.imageUrl;
    let oldImagePath = null;

    // Handle image removal
    if (req.body.removeImage === 'true' && currentComment.imageUrl) {
      oldImagePath = currentComment.imageUrl;
      imageUrl = null;
    }

    // Handle new image upload
    if (req.file) {
      // If there's an existing image, mark it for removal
      if (currentComment.imageUrl) {
        oldImagePath = currentComment.imageUrl;
      }
      imageUrl = await handleImageUpload(req.file, oldImagePath);
    } else if (oldImagePath) {
      // Remove old image if no new image is uploaded but removal is requested
      await removeOldImage(oldImagePath);
    }

    const result = await updateComment(
      id, 
      req.body, 
      imageUrl, 
      req.body.removeImage === 'true'
    );

    res.json(result);
    
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    
    // Clean up file if upload failed
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: "Failed to update comment: " + error.message });
  }
});

// ✅ Delete a comment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comment first to remove associated image
    const comment = await getCommentById(id);
    if (comment && comment.imageUrl) {
      await removeOldImage(comment.imageUrl);
    }

    const result = await deleteComment(id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// ✅ Serve static files from public directory
router.use('/images', express.static(path.join(__dirname, '../public/images')));

module.exports = router;