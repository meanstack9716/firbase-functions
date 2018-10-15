const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
let mime = require('mime-types')
let request = require("request");
let nodemailer = require('nodemailer');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://allotments-3f22c.firebaseio.com`,
    storageBucket: "gs://allotments-3f22c.appspot.com"
});

let bucket = admin.storage().bucket();
let db = admin.database();
let ref = db.ref("allotments");

//file uploading function
let uploadFiles = async (files)=> {
    let fileData = []
    await Promise.all(files.map(async function (elements, key) {
        let file = bucket.file(elements.name); //uploading to firebase storage
        await file.save(elements.data, {
            metadata: {
                contentType: mime.lookup(elements.name),
                public: true
            },
        })
        fileData.push(elements.name)
    }))
    return fileData;
}

exports.allotments = functions.https.onRequest(async(req, res) => {
    let files = req.body.file;
    let usersRef = ref.child('/person');
    let fileRef = ref.child('/file');
    let fileNames = await uploadFiles(files);
    await fileRef.set({ fileName: fileNames });
    await usersRef.set({ name: req.body.name, email: req.body.email });

    /*Send Email*/
    let smtpConfig = {
        host: 'smtp-relay.sendinblue.com',
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: 'meanstack9@gmail.com',
            pass: 'ol+SDxIl5ts3runeczsNvrBRNz6KpYGaINCTs4Nj0CA=' //encrypted password
        }
    };
    let mailOptions = {
        from: 'hello@firebace.com',
        to: req.body.email,
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
    };
    let transporter = await nodemailer.createTransport(smtpConfig)


    ref.on('value', async (snapshot)=> {
        // for calling mail function uncomment the below line
        // await transporter.sendMail(mailOptions); 
        res.send(snapshot)
    })
});


