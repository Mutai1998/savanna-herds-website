// models/comment.js
const db = require("../firebase"); // this imports your initialized firestore instance

const commentsCollection = db.collection("comments");

// Create new comment
async function addComment(data) {
  const { fullName, email, company, phone, website, message, products } = data;

  const newComment = {
    fullName,
    email,
    company: company || "",
    phone: phone || "",
    website: website || "",
    message,
    products: products || "",
    approved: false,
    createdAt: new Date(),
  };

  const docRef = await commentsCollection.add(newComment);
  return { id: docRef.id, ...newComment };
}

// Get all comments
async function getAllComments() {
  const snapshot = await commentsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Approve a comment
async function approveComment(id) {
  await commentsCollection.doc(id).update({ approved: true });
  return { success: true, id };
}

// Delete a comment
async function deleteComment(id) {
  await commentsCollection.doc(id).delete();
  return { success: true, id };
}

module.exports = {
  addComment,
  getAllComments,
  approveComment,
  deleteComment,
};
