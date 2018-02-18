const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision').v1;
const language = require('@google-cloud/language');
const nodemailer = require('nodemailer');
admin.initializeApp(functions.config().firebase);

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "safechat9@gmail.com",
        pass: "Boomchakalaka1",
    },
});
const APP_NAME = 'SafeChat';


const db = admin.database();
// Instantiates a client
const languageClient = new language.LanguageServiceClient();
const visionClient = new vision.ImageAnnotatorClient();
const bucketName = "gs://safechat-4ca62.appspot.com";


exports.saveAuthInfo = functions.auth.user().onCreate((event) => {
    const user = event.data;
    const userEmail = user.email; // The email of the user.
    const displayName = user.displayName; // The display name of the user.
    const userId = user.uid;
    const imageUrl = user.photoURL || null;

    console.log("")

    return db.ref(`users/${userId}`).set({
        uid: userId,
        email: userEmail,
        name: displayName,
        photoUrl: imageUrl
    })
})

exports.sanitizeMessage = functions.database.ref('/rooms/{roomId}/{messageId}').onCreate((message) => {
    const promises = []
    const attachments = []
    var bad = false;
    const obj = message.data.val();
    var newObj = obj;
    const oldMessage = obj.text;
    var email = "";
    var uid = message.auth.variable ? message.auth.variable.uid : null;

    if(uid){
        const getEmail = db.ref(`emails/${uid}`).on("value", function(snapshot) {
            console.log(snapshot.val());
            if(snapshot.val().email){
                email = snapshot.val().email
                console.log("EMAIL", email)
            } else {
                email = null
                console.log("EMAIL not found")
            }
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
        promises.push(getEmail)
    }

    console.log("Object", obj);
    const document = {
        type:"PLAIN_TEXT",
        language: "EN",
        content: obj.text
    };
    const textCheck = languageClient
        .analyzeSentiment({document: document})
        .then(results => {
            console.log("RESULTS:", results);
            results.forEach(function (a) {
                console.log("A", a);
                const sentences = a.sentences;
                for(var i = 0; i < sentences.length; i++) {
                    var b = sentences[i];
                    console.log("SENTIMENT", b);
                    const sentence = b.text.content;
                    const sentiment = b.sentiment.score;
                    console.log("SENTENCE:", sentence);

                    if(sentiment <= -0.20) {
                        console.log("Replacing vulgar text")
                        newObj.text = newObj.text.replace(sentence, '***');
                        console.log("NEW OBJECT", newObj)
                        bad = true;
                    }
                }
            })

        })
        .catch(err => {
            console.error('ERROR:', err);
        });
    promises.push(textCheck);
    if(obj.media) {
        const imageCheck = visionClient
            .safeSearchDetection(`${bucketName}${obj.media.path}`)
            .then(result => {
                const detections = result[0].safeSearchAnnotation;
                console.log("DETECTION", detections);
                const img = {
                    filename: "image.jpg",
                    path: obj.media.url
                }
                attachments.push(img);
                //console.log(`ADULT: ${detections.adult}`);

                if (getNum(detections.medical) >= 1 || getNum(detections.spoof) >= 1 || getNum(detections.violence) >= 1
                    || getNum(detections.adult) >= 1 || getNum(detections.racy) >= 1) {
                    newObj.media.safe = false;
                    bad = true;
                }
            }).catch(err => {
                console.error('ERROR:', err);
            })
        promises.push(imageCheck);
    }

    return Promise.all(promises).then(() => {
        if(email && bad) {
            sendEmail(email, oldMessage, attachments)
        } else {
            console.log("Can't send email. No email or text is clean")
        }
        newObj.checked = true;
        db.ref(`rooms/${message.params.roomId}/${message.params.messageId}`).set(newObj)
    })
})

function getNum(value) {
    if(value == 'POSSIBLE') {
        return 1
    } else if(value == 'LIKELY'){
        return 2
    } else  if(value == 'VERY_LIKELY'){
        return 3
    }
    return 0
}

function sendEmail(email, message, attachments) {
    console.log("Sending email")
    const mailOptions = {
        from: `${APP_NAME} <noreply@safechat.com>`,
        to: email,
    };

    // The user subscribed to the newsletter.
    mailOptions.subject = `${APP_NAME} Alert!`;
    mailOptions.text = `Your child sent this "${message}"`;
    mailOptions.attachments = attachments;
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('New email sent to:', email);
    });
}

