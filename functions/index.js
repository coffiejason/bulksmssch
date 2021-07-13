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
    databaseURL: "https://bulksmssch-default-rtdb.firebaseio.com"

});

const app = express();
var db = admin.database();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(bodyParser.json());

var eventEmitter = new events.EventEmitter();

eventEmitter.on('readfile', async function (res,message,date) {
  readcsv(res,message,date);
});


const storage = new Storage({
  projectId: "bulksmssch",
  keyFilename: __dirname+'/serviceAccountKey.json'
});

const bucket = storage.bucket("gs://bulksmssch.appspot.com");


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

  //let taskid = req.body.id;
  
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


const downloadFile = async(filename,res,message,date) => {
  let destFilename = './data.csv';
  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
  };

  // Downloads the file
  await storage.bucket('gs://bulksmssch.appspot.com').file(filename).download(options);

  console.log(
    //`gs://${bucket}/${filename} downloaded to ${destFilename}.`
  );

  eventEmitter.emit('readfile',res,message,date);
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

      downloadFile(''+file.originalname,res);
    }).catch((error) => {
      console.error(error);
    });
  }
  else{
    console.log('here 2');
  }
});

app.post('/custom_sms_scheduled', multer.single('file'), async(req, res) => {
  console.log('Upload Image begun');

  let file = req.file;

  let taskid = req.body.id;
  let message = req.body.message;
  let date = req.body.date;

  console.log(message+''+date+''+taskid);
  
  if (file) {
    uploadImageToStorage(file).then((success) => {
      /*console.log(success);
      res.status(200).send({
        status: 'success',
        url: success
      });*/

      downloadFile(''+file.originalname,res,message,date);
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

  function readcsv(res,message,date){
      //__dirname+'/file.csv'

      const csv = require('csv-parser')
      const fs = require('fs')
      const results = [];
      
      fs.createReadStream(__dirname+'/data.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          //console.log(results[0].NAME);

          if(message === '' && date === ''){
            //instant fees
            sendSms(results[0].NAME,results[0].PHONE,results[0].PAID,results[0].REMAINING);
          }
          else if(message !== '' && date === ''){
            //send instant custom

            let contacts = []

            for(let row of results){
              console.log(String(row.PHONE));
              contacts.push(String(row.PHONE));
            }

            sendBulkSms(message,contacts);
          }
          else if(message === '' && date !== ''){
            //send scheduled fees
            sendSms_scheduled(results[0].NAME,results[0].PHONE,results[0].PAID,results[0].REMAINING,date);
          }
          else if(message !== '' && date !== ''){

            //scheduled custom

            let contacts = []

            for(let row of results){
              console.log(String(row.PHONE));
              contacts.push(String(row.PHONE));
            }

            sendBulkSms_scheduled(message,contacts,date);
          }
          
          // [
          //   { NAME: 'Daffy Duck', AGE: '24' },
          //   { NAME: 'Bugs Bunny', AGE: '22' }
          // ]

          res.sendStatus(200);
        });
  }

  async function writeStatus(type,comment){

    var pushid = db.ref('smslogs/').push().getKey();
    var datetime = new Date();
    console.log(datetime);
  
    await db.ref('smslogs/').child(String(pushid)).set({
        id: pushid,
        type: type, //success or error
        comment: comment,
        date: datetime
    }, async function(error) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        createUser(pushid,req.body.phone,req.body.email,req.body.password,res);
      }
    });
  }

  function sendSms(name,phone,paid,remaining){
    // SEND SMS
    const axios = require('axios');
    axios.get('https://sms.arkesel.com/sms/api?action=send-sms&api_key=Ok5uVUZkc0FtQjdERDk2eDg=&to='+phone+'&from=TIAIS&sms=Hello Guardian, An amount of '+
    paid+' has been paid as School fees for '+name+'. the new outstanding balance is '+remaining+'.')
    .then(response => console.log(response))
    .catch(error => console.log(error));
  }

  function sendSms_scheduled(name,phone,paid,remaining,date){

    // SCHEDULE SMS
    const axios = require('axios');
    //format date to match this format: DD-MM-YYYY
    axios.get('https://sms.arkesel.com/sms/api?action=send-sms&api_key=Ok5uVUZkc0FtQjdERDk2eDg=&to='+phone+'&from=TIAIS&sms=Hello Guardian, An amount of '+
    paid+' has been paid as School fees for '+name+'. the new outstanding balance is '+remaining+'.&schedule='+date+' 10:00 AM')
    .then(response => console.log(response))
    .catch(error => console.log(error));

  }

  function sendBulkSms(message,contacts){
    // SEND SMS
    const axios = require('axios');
    const data = {"sender": "TIAIS",
                  "message": message,
                  "recipients": contacts};

    const config = {
    method: 'post',
    url: 'https://sms.arkesel.com/api/v2/sms/send',
    headers: {
        'api-key': 'Ok5uVUZkc0FtQjdERDk2eDg='
    },
    data : data
    };

    axios(config)
    .then(function (response) {
    console.log(JSON.stringify(response.data));
      writeStatus('success',String(response.data));
    })
    .catch(function (error) {
    console.log(error);
      writeStatus('error',String(error.data));
    });
  }

  function sendBulkSms_scheduled(message,contacts,date){

    // SCHEDULE SMS
    const axios = require('axios');
    const data = {"sender": "TIAIS",
                  "message": message,
                  "recipients": contacts,
                  "scheduled_date": date+" 07:00 AM"};

    const config = {
      method: 'post',
      url: 'https://sms.arkesel.com/api/v2/sms/send',
      headers: {
        'api-key': 'Ok5uVUZkc0FtQjdERDk2eDg=',
      },
      data : data
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
        writeStatus('success',String(response.data));
      })
      .catch(function (error) {
        console.log(error);
        writeStatus('error',String(error.data));
    });

  }

  app.post('/register',async(req,res)=>{
    
    var pushid = db.ref('users/').push().getKey();
  
    await db.ref('users/').child(String(pushid)).set({
        id: pushid,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    }, async function(error) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({response: "Success"});
      }
    });
  
    res.send();
  });
  
  app.post('/login',async(req,res)=>{
    
    const eventref = db.ref("users");
    const snapshot = await eventref.once('value');
    const value = snapshot.val();
  
    var data = Object.entries(value);
  
    var response = {response: "User not found"};
  
    for(let val of data){
  
      if((req.body.email === String(val[1].email) || req.body.phone === String(val[1].phone)) && req.body.password ===String(val[1].password)){
        
        response = {response: "Success"}
  
      }
    }
  
    res.send(response);
  });



const port = process.env.PORT || '5000';
app.listen(port, () => console.log('Server Started on port: '+port));
