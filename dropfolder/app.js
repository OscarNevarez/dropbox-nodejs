var express = require('express')
var AWS = require('aws-sdk')
var chokidar = require('chokidar');
var watcher = chokidar.watch('./dropfolder', {ignored: /[\/\\]\./}).on('all', (event, path) => {
    console.log(event, path);
  });
var fs = require('fs')
var s3 = new AWS.S3();
var file;

// For details and examples about AWS Node SDK,
// please see https://aws.amazon.com/sdk-for-node-js/

//set watcher behavior
watcher
  .on('add', function(path) {
    console.log('File', path, 'has been added');
    uploadFileToS3(path);})
  .on('unlink', function(path){
      console.log('File', path, 'has been deleted');
      removeFileFromS3(path);})
  .on('change', function(path) {console.log('File', path, 'has been changed');
      uploadFileToS3(path);})
  .on('new-file', function(path) {console.log('File', path, 'has been removed');})
  .on('error', function(error) {console.error('Error happened', error);})

var myBucket = 'hack1cpp';
var app = express()

// This is how your enable CORS for your web service
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.sendfile('index.html')
})

app.get('/list', function(req, res){
	var params = {
	  Bucket: myBucket
	};
	s3.listObjects(params, 	function(err, data){
	  for(var i = 0; i < data.Contents.length; i++) {
	  	data.Contents[i].Url = 'https://s3-us-west-2.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
	  }
	  res.send(data.Contents);
	})
})

function uploadFileToS3(imageFilePath) {
	fs.readFile(imageFilePath, function (err, data) {
		params = {Bucket: myBucket, Key: imageFilePath, Body: data, ACL: "public-read"};
	    s3.putObject(params, function(err, data) {
	         if (err) {
	             console.log(err)
	         } else {
	             console.log("Successfully uploaded data to " + myBucket, data);
	         }
	    });
	});
}

function removeFileFromS3(imageFilePath) {
  fs.readFile(imageFilePath, function(err,data) {
    params = {Bucket: myBucket, Key: imageFilePath};
      s3.deleteObject(params, function(err, data) {
        if(err) {
          console.log(err);
        } else {
          console.log("Succesfully removed data from" + myBucket, data);
        }
      })
    })
  }

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
