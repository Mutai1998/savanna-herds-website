// models/comments.js
const { db, bucket } = require("../firebase");
const { v4: uuidv4 } = require("uuid");

const commentsCollection = db.collection("comments");

// Upload image to Firebase Storage
async function uploadImage(file) {
  if (!file) return null;

  const fileName = `comments/${uuidv4()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  // Generate public URL
  const [url] = await fileUpload.getSignedUrl({
    action: "read",
    expires: "03-09-2099",
  });

  return url;
}

// Create new comment
async function addComment(data, imageUrl = null) {
  const {
    fullName,
    email,
    company,
    phone,
    website,
    message,
    products,
  } = data;

  const newComment = {
    fullName,
    email,
    company: company || "",
    phone: phone || "",
    website: website || "",
    message,
    products: products || "",
    imageUrl, // ✅ add image URL
    approved: false,
    createdAt: new Date(),
  };

  const docRef = await commentsCollection.add(newComment);
  return { id: docRef.id, ...newComment };
}

// Get all comments
async function getAllComments() {
  const snapshot = await commentsCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Get comment by ID
async function getCommentById(id) {
  try {
    console.log("🔍 Looking for comment with ID:", id);
    const doc = await commentsCollection.doc(id).get();
    
    if (!doc.exists) {
      console.log("❌ Comment not found for ID:", id);
      return null;
    }
    
    const commentData = { id: doc.id, ...doc.data() };
    console.log("✅ Found comment:", commentData);
    return commentData;
  } catch (error) {
    console.error("❌ Error getting comment by ID:", error);
    throw error;
  }
}

// Approve a comment
async function approveComment(id) {
  await commentsCollection.doc(id).update({ approved: true });
  return { success: true, id };
}

// Update a comment
async function updateComment(id, data, newImageUrl = null, removeImage = false) {
  try {
    console.log("🔄 Updating comment ID:", id);
    console.log("Update data:", data);
    console.log("New image URL:", newImageUrl);
    console.log("Remove image:", removeImage);

    // Get current comment data
    const currentComment = await commentsCollection.doc(id).get();
    
    if (!currentComment.exists) {
      throw new Error("Comment not found");
    }

    const currentData = currentComment.data();
    
    let imageUrl = currentData.imageUrl;

    // Handle image logic
    if (removeImage) {
      console.log("🗑️ Removing image");
      imageUrl = null;
    } else if (newImageUrl) {
      console.log("📸 Setting new image");
      imageUrl = newImageUrl;
    }
    // Otherwise keep the existing imageUrl

    const updateData = {
      fullName: data.fullName !== undefined ? data.fullName : currentData.fullName,
      email: data.email !== undefined ? data.email : currentData.email,
      company: data.company !== undefined ? data.company : currentData.company,
      message: data.message !== undefined ? data.message : currentData.message,
      products: data.products !== undefined ? data.products : currentData.products,
      approved: data.approved !== undefined ? (data.approved === 'true' || data.approved === true) : currentData.approved,
      imageUrl: imageUrl,
      updatedAt: new Date()
    };

    console.log("📝 Final update data:", updateData);

    await commentsCollection.doc(id).update(updateData);
    
    return { 
      success: true, 
      id, 
      ...updateData 
    };
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    throw error;
  }
}

// Delete a comment
async function deleteComment(id) {
  await commentsCollection.doc(id).delete();
  return { success: true, id };
}

// Export all functions
module.exports = {
  addComment,
  getAllComments,
  getCommentById,
  approveComment,
  updateComment,
  deleteComment,
  uploadImage // Only if you need it elsewhere, otherwise remove this export
};