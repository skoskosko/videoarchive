"use strict";

process.title = 'jubular';

var webSocketsServerPort = 8000; // port you want to set your webscoket in
var expressPort = 3000; // port you want your express in
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs'),
    path = require('path');
var utf8 = require('utf8');
var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();
var bodyParser = require('body-parser');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
    //assert = require('assert');
var MongoUrl = 'mongodb://localhost:27017/jubular'; // url of your database
var count = 0;
var clients = {};
var fileInfo;



// ###### #    # #    #  ####  ##### #  ####  #    #  ####
// #      #    # ##   # #    #   #   # #    # ##   # #
// #####  #    # # #  # #        #   # #    # # #  #  ####
// #      #    # #  # # #        #   # #    # #  # #      #
// #      #    # #   ## #    #   #   # #    # #   ## #    #
// #       ####  #    #  ####    #   #  ####  #    #  ####

//getting index of item in array


function IndexOfObject(array , tag){
  for(var i = 0 ; i < array.length ; i++){
      if(array[i].tag == tag){
        return i;
      }
  }
  return -1;

}

// making thumb image of the vide. This method uses already saved video file to take picture from the beginning of it.
// This way we dont need to send whole wideo to client for thumbnail
function fileThumb(file, folder) {
    var filLoc = "/files/" + folder + "/" + file.name;
    var thumLoc = "/thumbs/" + folder;

    if (file.mimetype == "video/mp4" || file.mimetype == "video/webm") {
        filLoc = path.resolve(__dirname + filLoc);
        thumLoc = path.resolve(__dirname + "/"+thumLoc+"/FRONT_COVER.jpeg");
        var command = "avconv -ss 00:00:01 -i '" + filLoc + "' -vsync 1 -t 0.01 '" + thumLoc+"'";
        console.log(command);
        var exec = require('child_process').exec;
        exec(command, function(error, stdout, stderr) {
            //  console.log(error + stdout + stderr);
        });

    } else if (file.mimetype == "audio/mp3") {
      filLoc = path.resolve(__dirname + filLoc);
      thumLoc = path.resolve(__dirname + "/"+thumLoc);
      var command = "eyeD3 --write-image="+thumLoc +" "+filLoc;
      console.log(command);
      var exec = require('child_process').exec;
      exec(command, function(error, stdout, stderr) {
            console.log(error + stdout + stderr);
      });
    }
}


//finding the stuff in path
function getDirectories(path) {
    return fs.readdirSync(path).filter(function(file) {
        return fs.statSync(path + '/' + file).isDirectory();
    });
}


//checking if directory files includes file  by name
function isInFolder(name) {
    var amount = getDirectories("files");
    if (amount.indexOf(name) > -1) {
        return 1;
    }
    return -1;
}


//making random id laength of 15
function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


// #    #  ####  #    #  ####   ####
// ##  ## #    # ##   # #    # #    #
// # ## # #    # # #  # #      #    #
// #    # #    # #  # # #  ### #    #
// #    # #    # #   ## #    # #    #
// #    #  ####  #    #  ####   ####


//inserting object to files collection
function inserttomongo(data) {

    MongoClient.connect(MongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection established to', MongoUrl);
            var collection = db.collection('files');

            collection.insert(data, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Inserted %d documents into the "files" collection. The documents inserted with "_id" are:', result.length, result);
                }
                //Close connection
                db.close();
            });
        }
    });
}


//gets list of files in mongo collection files
function givefiles(id) {
    MongoClient.connect(MongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection established to', MongoUrl);
            var collection = db.collection('files');
            collection.find().toArray(function(err, document) {
                sendFiles(document, id);
                db.close();
            });
        }
    });
}


//for adding new tah to a file
function writenewtag(info){
  MongoClient.connect(MongoUrl, function(err, db) {
      if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
          console.log('Connection established to', MongoUrl);
          var collection = db.collection('files');
          console.log(new ObjectId(info.to));
          var document = collection.find({ _id : new ObjectId(info.to)}).toArray(function(err, document) {
              var bar = [];
              bar = document[0].tags;
              bar.push({
                  'tag': info.tag
              });
        collection.update(
                 { _id : new ObjectId(info.to)},
                 { $set: { tags: bar } },
                 { multi: true }
              );
              db.close();
          });
      }
  });
}


//for deleting a tag
function deltag(info){
  MongoClient.connect(MongoUrl, function(err, db) {
      if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
          console.log('Connection established to', MongoUrl);
          var collection = db.collection('files');
          console.log(new ObjectId(info.to));
          var document = collection.find({ _id : new ObjectId(info.to)}).toArray(function(err, document) {
              var bar = [];
              bar = document[0].tags;
              bar.splice(IndexOfObject(bar, info.tag.tag), 1);
         collection.update(
                  { _id : new ObjectId(info.to)},
                  { $set: { tags: bar } },
                  { multi: true }
                  );
        db.close();
          });
      }
  });
}


// editing a name of the video
function editname(info){

  MongoClient.connect(MongoUrl, function(err, db) {
      if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
          console.log('Connection established to', MongoUrl);
          var collection = db.collection('files');
          console.log(new ObjectId(info.to));
        collection.update(
                 { _id : new ObjectId(info.to)},
                 { $set: { name: info.name } },
                 { multi: true }
              );
                db.close();
      }
  });
}


// #    # ###### #####   ####   ####   ####  #    # ###### #####  ####
// #    # #      #    # #      #    # #    # #   #  #        #   #
// #    # #####  #####   ####  #    # #      ####   #####    #    ####
// # ## # #      #    #      # #    # #      #  #   #        #        #
// ##  ## #      #    # #    # #    # #    # #   #  #        #   #    #
// #    # ###### #####   ####   ####   ####  #    # ######   #    ####


//Handling all the websocket connections and different stuffs
var server = http.createServer(function(request, response) {});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    var id = count++;
    clients[id] = connection;
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            fileInfo = JSON.parse(message.utf8Data);
            if (fileInfo.data.whatis == "file") {
                fileInfo = fileInfo.data;
                fileInfo.tags.forEach(function(item, index) {
                    delete fileInfo.tags[index].$$hashKey;
                });
            } else if (fileInfo.data.whatis == "givedata") {
                givefiles(id);
            }else if (fileInfo.data.whatis == "deltag") {
                deltag(fileInfo.data);
            }else if (fileInfo.data.whatis == "addtag") {
                writenewtag(fileInfo.data);
            }else if (fileInfo.data.whatis == "editname") {
                editname(fileInfo.data);
            }
        }
    });
    connection.on('close', function(connection) {});
});


function sendFiles(files, id) {
    clients[id].sendUTF(JSON.stringify({"type":"files" ,"files":files}));
}


// ###### #    # #####  #####  ######  ####   ####
// #       #  #  #    # #    # #      #      #
// #####    ##   #    # #    # #####   ####   ####
// #        ##   #####  #####  #           #      #
// #       #  #  #      #   #  #      #    # #    #
// ###### #    # #      #    # ######  ####   ####

//handling upload and serving of the files
app.use(fileUpload());
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use('/thumbs', express.static(__dirname +'/thumbs'));
app.use('/files', express.static(__dirname +'/files'));
app.listen(expressPort);

app.post('/upload', function(req, res) {
    var filePath = "files/";
    var sampleFile;
    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }
    sampleFile = req.files.file;
    // make folder for file
    var folder = makeid();
    var loopyloop = true;
    while (loopyloop) {
        if (isInFolder(folder) > 0) {
            folder = makeid();
        } else {
            loopyloop = false;
        }
    }
    fs.mkdir("files/" + folder);
    fs.mkdir("thumbs/" + folder);
    var filename = filePath + folder + "/" + req.files.file.name;

    sampleFile.mv(filename, function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            fileInfo.location = filename;
            fileInfo.visible = true;
            fileInfo.folder = folder;
            fileInfo.thumb = "thumbs/" + folder +"/FRONT_COVER.jpeg";
            fileThumb(req.files.file, folder);
            inserttomongo(fileInfo);
            res.send('File uploaded!');
        }
    });

});
