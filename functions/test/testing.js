// var myFunctions, configStub, adminInitStub, functions, admin;
//
// before(() => {
//     // Since index.js makes calls to functions.config and admin.initializeApp at the top of the file,
//     // we need to stub both of these functions before requiring index.js. This is because the
//     // functions will be executed as a part of the require process.
//     // Here we stub admin.initializeApp to be a dummy function that doesn't do anything.
//     admin =  require('firebase-admin');
//     adminInitStub = sinon.stub(admin, 'initializeApp');
//     // Next we stub functions.config(). Normally config values are loaded from Cloud Runtime Config;
//     // here we'll just provide some fake values for firebase.databaseURL and firebase.storageBucket
//     // so that an error is not thrown during admin.initializeApp's parameter check
//     functions = require('firebase-functions');
//     configStub = sinon.stub(functions, 'config').returns({
//         firebase: {
//             databaseURL: 'https://not-a-project.firebaseio.com',
//             storageBucket: 'not-a-project.appspot.com',
//         }
//         // You can stub any other config values needed by your functions here, for example:
//         // foo: 'bar'
//     });
//     // Now we can require index.js and save the exports inside a namespace called myFunctions.
//     // This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
//     // and myFunctions.addMessage
//     myFunctions = require('../index');
// });
//
// after(() => {
//     // Restoring our stubs to the original methods.
//     configStub.restore();
//     adminInitStub.restore();
// });
//
// function sanitizeMessage() {
//     return event.data.ref.parent.child('messages/dgvgw/fgrfrf').set({
//         message: "Fuck you wanker!"
//     });
// }
//
// sanitizeMessage()
// Imports the Google Cloud client library
const language = require('@google-cloud/language');

// Instantiates a client
const client = new language.LanguageServiceClient();

// The text to analyze
const text = 'Hello, world!';

const document = {
    content: text,
    type: 'PLAIN_TEXT',
};

// Detects the sentiment of the text
client
    .analyzeSentiment({document: document})
    .then(results => {
        const sentiment = results[0].documentSentiment;

        console.log(`Text: ${text}`);
        console.log(`Sentiment score: ${sentiment.score}`);
        console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
    })
    .catch(err => {
        console.error('ERROR:', err);
    });