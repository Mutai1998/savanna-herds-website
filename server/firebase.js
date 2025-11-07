const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const serviceAccount = require("./savannaherds-a96de-firebase-adminsdk-fbsvc-1654b6ae03.json");

// Initialize the Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "savannaherds-a96de.firebasestorage.app" // Make sure this matches your actual bucket
});

// Get a reference to your Firestore database
const db = getFirestore();

// Get a reference to your default Cloud Storage bucket
const bucket = getStorage().bucket();

// Test the bucket connection
async function testBucketConnection() {
  try {
    const [buckets] = await getStorage().getBuckets();
    console.log('✅ Available buckets:', buckets.map(b => b.name));
    
    // Test if our bucket exists
    const [exists] = await bucket.exists();
    if (exists) {
      console.log('✅ Storage bucket exists and is accessible');
    } else {
      console.log('❌ Storage bucket does not exist');
    }
  } catch (error) {
    console.error('❌ Error accessing storage:', error);
  }
}

// Call this to test the connection
testBucketConnection();

module.exports = { db, bucket };