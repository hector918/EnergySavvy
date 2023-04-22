"use strict";
const fs = require('fs');
// const cookie_key_name = "kEynAmE";
////////////////////////////////////////////////////////////////////////////
const file_store = class {
  static dir_name = "sessions/";
  constructor() {
    // this.dir_name = "sessions/";
  }
  static getByID  ( id ) {
    try {
      return JSON.parse(fs.readFileSync(`${this.dir_name}${id}`, 'utf8'));
    } catch (error) {
      return false;
    }
  }
  static checkIDExist ( id ) {
    if (!fs.existsSync(this.dir_name)){
      fs.mkdir(`./${this.dir_name}`,()=>{});
      return false;
    }else{
      return fs.existsSync(`${this.dir_name}${id}`);
    }
  }
  static writeID ( id, content ) {
    return fs.writeFileSync(`${this.dir_name}/${id}`, JSON.stringify(content));
  }
  static clear_expired ( ) {
    let current_time = new Date();
    let count = 0;
    fs.readdir(this.dir_name, (err, files) => {
      if(err) return;
      for(let file of files){
        let file_time = Number(file.split("-").pop());
        if(typeof file_time !== 'number') continue;
        if( (current_time.getTime() - file_time) / 86400000 > sc.maxAge ){
          fs.unlink(`${this.dir_name}${file}`,(err)=>{ console.log(`session ${file} deleted`,err); });
          count++;
        }
      }
    });
    console.log(`${current_time.toLocaleString()} Clearing expired session... (${count}) session deleted.`);
  }
  static test () {
    console.log(this.dir_name);
  }
};
////////////////////////////////////////////////////////////////////////////
const sc = {
  store : file_store,
  header_to_sessionStore : ['host', 'user-agent', 'accept', 'accept-language'],
  sessionDetection : ['host', 'user-agent', "remoteAddress"],
  maxAge : 86400000,//one day
  clear_outdated_session_interval : 5, //unit minute
  cookie_key_name : "kEynAmE"
}

setInterval(() => { clear_expired_session(); }, 60000 * sc.clear_outdated_session_interval);

module.exports =  ( inRequest ) => {
  if(inRequest.is_websocket) return inRequest;
  let { cookie } = inRequest.req.headers;
  let content = { remoteAddress : inRequest.req.connection.remoteAddress };
  sc.header_to_sessionStore.forEach(el => content[el] = inRequest.req.headers[el]);
  let cookie_val = parse_cookie_session(cookie);
  if ( cookie && dectectionChange(content, sc.store.getByID( cookie_val ))) {
    inRequest.req.sessionID = cookie_val;
    inRequest.req.sessionDoc = ()=>{ return sc.store.getByID( cookie_val ); };
  } else {
    // inRequest.req.sessionID = generate
    let id = generate(content);
    inRequest.res.setHeader('Set-Cookie', `${sc.cookie_key_name}=${id}`);
  }
  return inRequest;
}

function destory ( inRequest ) {
  inRequest.res.setHeader('Set-Cookie', `${sc.cookie_key_name}=`);
}

function dectectionChange (headers, onfile) {
  try {
    for(let x of sc.sessionDetection) {
      if( !headers[x].includes(onfile[x]) ) return false;
    }
  } catch (error) {
    console.log('error in session dectectionChange');
    return false;
  }  
  return true
}

function generate (content) {
  let sessionid = gID();
  while(sc.store.checkIDExist( sessionid )) { sessionid = gID(); };
  sc.store.writeID( sessionid, content );
  return sessionid
  function gID () {
    return `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  }
}
function parse_cookie_session(cookie){

  if(!cookie) return false;
  for (let x of cookie.split(";")){
    let [key, val] = x.split("=");
    if(key.trim() === sc.cookie_key_name) return val;
  }
  return false;
}
function clear_expired_session(){
  sc.store.clear_expired();
}

