const {format} = require('util');
const express = require('express');
var admin = require('firebase-admin');
var cors = require('cors');
const {Storage}  = require('@google-cloud/storage');
const Multer = require('multer');
const bodyParser = require('body-parser');
var events = require('events');

var serviceAccount = require(__dirname+'/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ispylegon-default-rtdb.firebaseio.com"
});

const app = express();
var db = admin.database();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(bodyParser.json());

var eventEmitter = new events.EventEmitter();

eventEmitter.on('sendUserNotification', async function (token,res) {
  sendNotification(token,res);
});

eventEmitter.on('sendICNotification', async function (token,res) {
  sendNotification(token,res);
});

const storage = new Storage({
  projectId: "ispylegon",
  keyFilename: __dirname+'/serviceAccountKey.json'
});

const bucket = storage.bucket("gs://ispylegon.appspot.com");


const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // no larger than 5mb, you can change as needed.
  }
});

/**
 * Upload the image file to Google Storage
 * @param {File} file object that will be uploaded to Google Storage
 */
const uploadImageToStorage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No image found');
    }
    let newFileName = `${file.originalname}_${Date.now()}`;

    let fileUpload = bucket.file(file.originalname);
    
    /*
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });*/

    const blobStream = fileUpload.createWriteStream();

    blobStream.on('error', (error) => {
      reject('Something is wrong! Unable to upload at the moment, Please retry.' + error);
    });

    blobStream.on('finish', () => {
      // The public URL can be used to directly access the file via HTTP.
      const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
}

async function writeUrl(taskid,res,success){

  await db.ref('errands/').child(String(taskid)).update({
    proofUrl: success
  }, async function(error) {
    if (error) {
      console.log(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

app.get('/',async(req,res)=>{

  res.send("edey work");
});


app.post('/upload', multer.single('file'), async(req, res) => {
  console.log('Upload Image begun');

  let file = req.file;

  let taskid = req.body.id;
  
  if (file) {
    uploadImageToStorage(file).then((success) => {
      /*console.log(success);
      res.status(200).send({
        status: 'success',
        url: success
      });*/

      writeUrl(taskid,res,success);
    }).catch((error) => {
      console.error(error);
    });
  }
  else{
    console.log('here 2');
  }
});


const downloadFile = async() => {
  let destFilename = './downloadTest.txt';
  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
  };

  // Downloads the file
  await storage.bucket('gs://ispylegon.appspot.com').file('dghfdg.txt').download(options);

  console.log(
    //`gs://${bucket}/${filename} downloaded to ${destFilename}.`
  );
} 

app.post('/bulksms', multer.single('file'), async(req, res) => {
  console.log('Upload Image begun');

  let file = req.file;

  let taskid = req.body.id;
  
  if (file) {
    uploadImageToStorage(file).then((success) => {
      /*console.log(success);
      res.status(200).send({
        status: 'success',
        url: success
      });*/

      writeUrl(taskid,res,success);
    }).catch((error) => {
      console.error(error);
    });
  }
  else{
    console.log('here 2');
  }
});

app.get('/getfile', async(req,res)=>{
  downloadFile();
});



const port = process.env.PORT || '5000';
app.listen(port, () => console.log('Server Started on port: '+port));
