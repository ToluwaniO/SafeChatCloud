const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const db = admin.database();

exports.saveAuthInfo = functions.auth.user().onCreate((event) => {
    const user = event.data;
    const userEmail = user.email; // The email of the user.
    const displayName = user.displayName; // The display name of the user.
    const userId = user.uid;

    return db.ref("users").push().set({
        uid: userId,
        email: userEmail,
        name: displayName
    })
})
