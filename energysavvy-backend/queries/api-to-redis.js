const {redisClient, import_data_to_redis, readMultipleHashes} = require('../redis-db');


const get_by_rowID = (rowID, callback) => {
  redisClient.HGETALL(rowID).then(callback);
}

const get_by_meter_number = (meter_number, callback) => {
  redisClient.sMembers(meter_number).then( keys => {
    readMultipleHashes(keys, callback);
  });
}

const create_add_email_to_meter = (meter, email, callback) => {
  let hash_table = `meter_to_email_${meter}`;//meter_to_email_meter_number_7725479
  redisClient.hExists(hash_table, "email").then(if_exist=>{
    if(if_exist){
      //email already taken
      callback({"result":"email taken"});
    }else{
      //available
      redisClient.HSET(hash_table, {email}).then(callback({"result":"success"}));
    }
  })
}

const check_meter_avavilable = (meter, callback) => {
  let hash_table = `meter_to_email_${meter}`;//meter_to_email_meter_number_7725479
  redisClient.HGETALL(hash_table).then(data => {
    if(data['email']){
      //email already taken
      callback(data);
    }else{
      //available
      callback({"result":"email not taken"});
      
    }
  })
}

const testing = (callback) =>  {
  get_by_meter_number("meter_number_4989251",(data)=>callback(JSON.stringify(data)));
}

module.exports = {
  testing,
  import_data_to_redis,
  get_by_rowID,
  get_by_meter_number,
  create_add_email_to_meter,
  check_meter_avavilable
}