"use strict";
const config = require('./config.js');
const { addWebServer } = require('./router.js');

const http = require('http');
const https = require('https');
const fs = require('fs');

require("./app");

const options = {
  key : fs.readFileSync('./ssl/server-key.pem'),
  cert: fs.readFileSync('./ssl/server-cert.pem')
};
const multi_thread = config.mode === "single" ? 0 : 1;
const [http_on, https_on] = [true, true];
const [http_port, https_port] = [config.port, config.httpsport];
const hostname = config.hostname;

function http_start(){
  let http_server = http.createServer();
  addWebServer( http_server );
  http_server.listen(http_port, hostname, () => {
    console.log(`Http server running at http://${hostname}:${http_port}/`);
  });
}
function https_start(){
  let https_server = https.createServer(options);
  addWebServer( https_server );
  https_server.listen(https_port, hostname, () => {
    console.log(`Https server running at https://${hostname}:${https_port}/`);
  });
}

if (multi_thread === 0) {
  if (http_on) http_start();
  if (https_on) https_start();
  
} else if (multi_thread === 1) {
  var cluster = require('cluster');
  var numCPUs = require('os').cpus().length;
  if (cluster.isMaster) {
    console.log('[master] start master...');
    for (var i = 0; i < numCPUs; i++) { cluster.fork(); }
    cluster.on('listening', function (worker, address) {
      console.log(`[master] listening: worker${worker.id},pid:${worker.process.pid}, Address:${address.address}:${address.port}`);
    });

  } else if (cluster.isWorker) {
    console.log(`[worker] start worker ...${cluster.worker.id}`);
    if (http_on) http_start(); 
    if (https_on) https_start();
  }
}
