"use strict";
const ws = require('ws');
const websocketServers = [];
const clients = new Map();
const server_setting = { noServer: true };
function hanger(server, path_finder){
  server.on('upgrade', function upgrade(request, socket, head) {
      
    const wss = new ws.Server(server_setting);
    websocketServers.push( wss );
    wss.on('connection', function connection(ws, request) {
      let secWebsocketKey = request.headers['sec-websocket-key'];
      clients.set(secWebsocketKey, {socket: ws, remoteAddress: request.socket.remoteAddress});
      ws.on('error', (error) => on_error(ws, request, error));
      ws.on('message', (data) => on_message(ws, request, data));
      // ws.on('open', () => on_open(ws, request));
      ws.on('close', () => on_close(ws, request));
    });

    wss.handleUpgrade(request, socket, head, function done(ws) {
      console.log("handle upgrade");
      /*
handle upgrade {
  host: '127.0.0.1:4430',
  connection: 'Upgrade',
  pragma: 'no-cache',
  'cache-control': 'no-cache',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  upgrade: 'websocket',
  origin: 'http://127.0.0.1:8899',
  'sec-websocket-version': '13',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'sec-websocket-key': 'nX85QQifYCrbQ+erusafqQ==',
  'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits'
}
      */
      wss.emit('connection', ws, request);
    });
  });
  console.log("websocket server hooked");
  //event handler//////////////////////////////////////////
  function on_message(websocket , req, data){
    /* request.header
    {
      host: '127.0.0.1:4430',
      connection: 'Upgrade',
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      upgrade: 'websocket',
      origin: 'http://127.0.0.1:8899',
      'sec-websocket-version': '13',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'sec-websocket-key': 'TFHm57cjjINMHZEroqSM9A==',
      'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits'
    }
    */
    let steps = [{ mark: "on websocket message", time: new Date().getTime() }];// lapse of time
    const {sub_url, callback, middlewares} = path_finder(req.url);
    const [url, method, handler, pre_middlewares] = callback.find(el => el[1] === 'websocket');
    let request = {
      is_websocket : true,
      req,
      data: data.toString('utf8'),
      sessionID : req.headers['sec-websocket-key'],
      send : (data)=>{ reply(websocket, request, data) },
      steps,
    }
    for(let md of middlewares.concat(...pre_middlewares)){
      if(typeof md === "function") request = md(request) || request;
    };
    
    if(typeof handler === "function") handler(request);
  }
  function on_open(websocket, request){
    console.log("on open");
  }
  function on_close(websocket, request){
    let secWebsocketKey = request.headers['sec-websocket-key'];
    clients.delete(secWebsocketKey);
    console.log("on close");
  }
  function on_error(websocket , request, error){
    console.error(error);
  }
}
function reply(websocket, request, data){
  websocket.send(data);
  websocket_log_to_file(request);

}

function send_by_id(id, data){

}
function destory_by_id(id){

}

function broadcast(data){
  for(let server of websocketServers){
    server.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    })
  }
}
/////////////////////////////////////////////////////////
function websocket_log_to_file(session){
  const fs = require('fs');
  const get_date = (d)=>d.toISOString().replace(/T/, ' ').replace(/\..+/, '').split(" ")[0];
  const writeFile_error_ENOENT = (err)=>{
    if (err && err.code=="ENOENT") {
      fs.mkdir(`./${dir_name}`,()=>{});
      console.log(err);
    }
  }
  let dir_name = "./logs/";
  let d = new Date();
  let content = {
    date : d.toString(),
    method : "websocket",
    lapse : d.getTime() - session.steps[0].time,
    ip : `${session.req.socket.remoteAddress}:${session.req.socket.remotePort}`,
    url : session.req.url,
    via : `${session.req.socket.localAddress}:${session.req.socket.localPort}`
  }
  console.log(JSON.stringify(content));
  fs.writeFile(`${dir_name}${get_date(d)}-websocket_log.txt`, JSON.stringify(content) + ",\r\n", { 'flag': 'a' }, writeFile_error_ENOENT);
}
module.exports = {
  hanger
};