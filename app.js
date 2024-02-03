var http = require('http');
var formidable = require('formidable');
const express = require('express');
const app = express();



const server = http.createServer(app);
var port=3001
server.listen(port, () => {
    console.log("listening on port " + port + "! :)");
  });

app.use("/",express.static(__dirname));

