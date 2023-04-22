"use strict";
const {inspect} = require('util');
const fs = require('fs');
/*//////////////////////////////////
//v0.15 router for minimal dependency with base express functionally
/*//////////////////////////////////
const default_header = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type,XFILENAME,XFILECATEGORY,XFILESIZE,token,Origin",
  'Content-Type': 'application/json; charset=UTF-8',
  'Access-Control-Allow-Methods': "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  // "Access-Control-Max-Age": "2592000",
  // "credentials": "true"
  // "vary" : "Origin"
}
////////////////////////////////////////
const httpServers = [];
const routes = {};
const routing = {};
const post_body_limit = 11_000_000; //post body limit to around 11MB
const temp_file_dir = "./temp/";
//////////////////////////////////////////
routing.use = (...argMain) => {//main Entrance
  // let base = routes;
  let m_path = argMain[0];
  let callback = argMain[argMain.length - 1];
  let middlewares = argMain.slice(1, argMain.length - 1)||[];
  const fib = (raw_path, callback, middlewares = [], base = routes) => {
    base[ raw_path ] = { branch : {}, process : [], files : [], middlewares};
    callback({
      use : (...args)=>{
        let c_path = args[0];
        let callback = args[args.length - 1];
        let middlewares = args.slice(1, args.length - 1)||[];
        fib(c_path, callback, middlewares, base[ raw_path ].branch); 
      },
      onRequest : (...args) => { //p_path, method, ...middlewares, cb
        base[ raw_path ].process.push([args[0], args[1].toUpperCase(), args[args.length -1], args.slice(2, args.length - 1)]); //p_path, method, cb, ...middlewares
      },
      serveFile : (...args) => { //uf_path, file_path
        base[ raw_path ].process.push([args[0], "file", args[args.length -1], args.slice(1, args.length - 1)]); 
      },
      onWebSocket : (...args) => {
        base[ raw_path ].process.push([args[0], "websocket", args[args.length -1], args.slice(1, args.length - 1)]); 
      },
    })
  }
  fib(m_path, callback, middlewares);
}

routing.addons = {};
routing.addon = (name, handler) => { routing.addons[name] = handler; }
// routes.
function onRequest(req, res) {
  //prepare request
  preprocess_req( preprocess_res({ req, res }), ( request )=>{
    try {
      const {sub_url, callback, middlewares} = path_finder( req.url );
      if (Array.isArray(callback)) for(let [path_from_control, method, handler, pre_middlewares] of callback){
        if(method === "file"){//lower case for servefile
          if(call_file_server(`${handler}${url_filtering(sub_url)}`)){
            return;// end with first match
          }
        }else if(method === req.method){//regular method process
          const wildcard_path = path_from_control.split(":");
          let raw_path = wildcard_path.shift();
          if(raw_path.endsWith('/')) raw_path = raw_path.slice(0, raw_path.length-1);//remove the last / from raw_path
          let re = new RegExp(`^${raw_path}`);
          if(sub_url.match(re) !== null){
            request.params = () => proc_params(sub_url.replace(re, "").split("/", 10), wildcard_path);
            request.queries = () => proc_queries(sub_url.split("?"));
            ///////////////////////////////////////////////////////
            for(let mw of middlewares.concat(...pre_middlewares)){ 
              if(typeof mw === "function") request = mw(request) || request ;
            };
            call_controller( handler );
            return;// end with first match
          }
        }
      }
      if(routes['*'] !== undefined) call_controller(routes['*'].process[0][2]);//root *
    } catch (error) { 
      console.log(error);
      on_error(error);
      // on_end_without_send(request, error); 
    }
    ///////////////////////////////////////////////
    function call_controller(func){
      if (typeof func === "function") func(request);
      if (!request.isSent) throw `request controller ended without send`;
    }
    function call_file_server(file_path){
      const file_content = read_static_files(file_path);
      if(file_content !== false){
        request.sendFile(file_content);
        return true;
      }else{
        return false;
      }
    }
  })
//////////////////////////////////////////////////////////////////
  function proc_params(from_url,from_control){///process params
    const ret = {};
    from_url = from_url.filter(el => el !== "");
    from_control.forEach((el,idx) => { ret[el] = from_url[idx]; })
    return ret;
  };
  function proc_queries(from_url){///process queries
    const ret = {};
    if(from_url.length < 2) return {};
    from_url[1].split("&").map(el => {
      let [query_key, query_val] = el.split("=");
      return ret[query_key] = query_val || undefined;
    });
    return ret;
  }
}
/////preprocess/////////////////////////////////////////////////
function preprocess_req(request, callback) {
  ///process post body
  try {
    request.req.originalURL = request.req.url;
    request.req.url = request.req.url.replaceAll(/[/]{2,}/g,"/"); 
    //preprocess  url
    if (['FILE', 'POST', 'PUT', 'PATCH'].includes( request.req.method )) {
      //check content size
      if(request.req.headers['content-length'] > post_body_limit) {
        request.code(413).send(JSON.stringify({error:`max payload ${post_body_limit}`}));
        return;
      }
      //below are callbacks about post body
      if(request.req.headers['content-type'] && request.req.headers['content-type'].includes("multipart/form-data;")){// this is a file
        receive_file();
      }else{//not a file, assume it's a string
        receive_string();
      }
    }
    else{ // some method is not been set, so return
      callback( request );
    }
  } catch (error) {
    on_error({error});
    callback( request );
  }
  //////////////////////////
  function receive_file(){
    const crypto = require('crypto');
    let length = 0;
    if(!fs.existsSync(temp_file_dir)) fs.mkdirSync(temp_file_dir); 
    let buf = Buffer.alloc(0);
    request.req.on('data', (data) => {
      if(length > post_body_limit) {
        request.code(413).send(JSON.stringify({error:`max payload ${post_body_limit}`}));
        return;
      }
      length += data.length;
      buf = Buffer.concat([buf, data]);
    });
    request.req.on('end', () => {
      const parts = body2parts(buf, getBoundary(request.req));
      request.req.files = [];
      for(let part of parts){
        const fileHash = crypto.createHash('sha256').update(part.body).digest('hex');
        fs.writeFileSync(temp_file_dir + fileHash, part.body);
        request.req.files.push({
          "filepath" : temp_file_dir,
          "filename" : fileHash, 
          "file_length" : part.body.length,
          "file_headers" : part.headers
        });
      }
      callback( request );
    });
    function getBoundary(request) {
      let contentType = request.headers['content-type']
      const contentTypeArray = contentType.split(';').map(item => item.trim())
      const boundaryPrefix = 'boundary='
      let boundary = contentTypeArray.find(item => item.startsWith(boundaryPrefix))
      if (!boundary) return null
      boundary = boundary.slice(boundaryPrefix.length)
      if (boundary) boundary = boundary.trim()
      return boundary;
    }
    function body2parts(body, boundary){
      const parts = [];
      let pointer = body.indexOf(boundary);
      if(pointer == -1) return;
      let [partStart, partEnd] = [0,0];
      do{
        let boundary_range = find_line_range(pointer, body);
        [partStart, partEnd] = [boundary_range.end,find_line_range(body.indexOf(boundary,boundary_range.end), body).head];
        let part = body.slice(partStart, partEnd);
        if(part.length >0) parts.push(handle_part(part));
        pointer = partEnd + boundary.length;
      }while(partStart>0 && partEnd)

      return parts;
      function handle_part(p){/////breaking the post body to files with headers//
        const headers = {};
        const partHeadersEndIndex = p.indexOf('\r\n\r\n');
        const partHeaders = p.slice(0, partHeadersEndIndex).toString("utf8").trim();
        partHeaders.split('\r\n').forEach((headerLine) => {
          const [key, value] = headerLine.split(': ');
          headers[key.toLowerCase()] = value;
        });
        const body = p.slice(partHeadersEndIndex + 4);
        return {headers, body};
      }
      function find_line_range(start, body){
        //find the line start and end with "\n\r"//
        let head =0;
        for(let i=start; i>start-10;i--){
          if(i<0 || body[i]===undefined){
            head = 0;
            break;
          }
          if(checker(body[i])){
            if(body[i-1]&&checker(body[i-1])){
              head = i-1;
              break;
            }
            head = i;
            break;
          }
        }
        let end = 0;
        for(let i=start; i<start+50;i++){
          if(body[i] === undefined){
            end = 0;
            break;
          }
          if(checker(body[i])){
            if(body[i+1] && checker(body[i+1])){
              end = i+1;
              break;
            }
            end = i;
            break;
          }
        }
        return {head,end};
        function checker(a){return ["d","a"].includes(a.toString(16))};
      }
    }
  }
  function receive_string(){
    let buf = new Uint8Array();
    request.req.on('data', (data) => {
      buf = Uint8Array.of(...data);
      if(buf.length > post_body_limit) {
        request.code(413).send(JSON.stringify({error:`max payload ${post_body_limit}`}));
        return;
      }
    });
    request.req.on('end', ()=>{
      request.req.body = {raw : buf, "string" : ()=>{ 
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(buf);
      }}; 
      callback( request );
    });
  }
}
function preprocess_res(request) {
  request.steps = [{ mark: "on request", time: new Date().getTime() }];// lapse of time
  for(let key in default_header){ request.res.setHeader(key, default_header[key]);}
  
  request.res.error = (error) => { 
    on_error(error);
    request.isSent = true;
  };
  request.isSent = false;
  request.code = (code) => {
    request.res.statusCode = code;
    return request;
  }//
  request.send = (data) => {
    request.res.writeHead(200,default_header);
    if (!request.isSent) {
      request.res.write(data);
      request.res.end();
    }
    request.isSent = true;
    if(routing.addons.logs) routing.addons.logs.request_log_to_file(request);//log
  };//
  request.sendFile = ({stream, header}) => {
    request.res.on("finish",()=>{ if(routing.addons.logs) routing.addons.logs.request_file_log_to_file(request, stream.path); });//delay log
    if( !request.isSent ) {
      request.res.setHeader('Content-Type', header);
      stream.pipe(request.res);
    }
    request.isSent = true;
  }//
  return request;
}
////utility///////////////////////////////////////////
function read_static_files(filename) {
  const path = require("path");//
  try {
    let header = file_extension()[path.parse(filename).ext];
    if (fs.existsSync(filename) && header) {//if file exists and vaild file extension//
      return({stream:fs.createReadStream(filename),header});
      // return Object.assign(fs.createReadStream(filename),{header});
    }
    return false;
  } catch(error) {
    on_error({error,filename});
    return false;
  }
  function file_extension() {
    return {
      ".css": "text/css",
      ".gif": "image/gif",
      ".html": "text/html",
      ".ico": "image/x-icon",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".js": "text/javascript",
      ".json": "application/json",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".swf": "application/x-shockwave-flash",
      ".tiff": "image/tiff",
      ".txt": "text/plain",
      ".wav": "audio/x-wav",
      ".wma": "audio/x-ms-wma",
      ".wmv": "video/x-ms-wmv",
      ".xml": "text/xml",
      ".ttf": "font/ttf",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".mp4": "video/x-ms-mp4",
    };
  }
}
function url_filtering(url) {
  let filter = [
    [new RegExp(`\\.{2,}`),"."],
    [new RegExp(`\/{2,}`),"/"],
    [new RegExp(`[^a-zA-Z0-9-./_]`),""]
  ];
  for(let [reg, replacement] of filter) url = url.replace( reg , replacement );
  return url;
}
/////event/////////////////////////////////////////////////
function on_end_without_send(request, error) {
  console.error(error);
  request.code(500).send("server error");
}
function on_error(error) {
  if(routing.addons.logs) routing.addons.logs.log_error(error);
}
//////////////////////////////////////////////////////
function addWebServer (server) { 
  if(!server) return;
  httpServers.push(server); 
  if(routing.addons.websocket) routing.addons.websocket.hanger( server, path_finder );
  server.on("request", onRequest);
  server.on("connect", (request, socket, head) => {
    // console.log("on connect")
  });
  server.on("connection", (socket) => {
    // console.log("on connection", socket.address())
  });
};
function path_finder(path_, root = routes , callback = undefined, middlewares = []){
  for(let x in root){
    if(x === "*") continue;
    let re = new RegExp(`^${x}`);
    if(path_.match(re) !== null){
      /////prepare middlewares for run//////////////
      middlewares = middlewares.concat(...root[x].middlewares);
      //////subtract url by matched/////////////////
      let sub_url = path_.replace(re, "");
      sub_url = sub_url.charAt(0)==="/" ? sub_url : `/${sub_url}`;
      if(root[x].process !== undefined) callback = {sub_url, "callback" : root[x].process};
      ///////run recursive//////////////
      return path_finder(sub_url,root[x].branch, callback, middlewares);
    }
  }
  return {"sub_url":undefined, "callback":undefined, ...callback, middlewares};
}
module.exports = {
  onRequest, routing, addWebServer
}