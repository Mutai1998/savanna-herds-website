const admin = require("firebase-admin");
const serviceAccount = require("./savannaherds-a96de-firebase-adminsdk-fbsvc-11e56f7d6b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;
