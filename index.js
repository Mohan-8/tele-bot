const admin = require("firebase-admin");
const serviceAccount = require("./firebase/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aelon-7d5aa.firebaseio.com",
});

const db = admin.firestore();

module.exports = { db };
