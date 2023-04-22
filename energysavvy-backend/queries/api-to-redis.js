const {redisClient, import_data_to_redis, readMultipleHashes} = require('../redis-db');


const get_by_rowID = (rowID, callback) => {
  redisClient.HGETALL(rowID).then(callback);
}

const get_by_meter_number = (meter_number, callback) => {
  redisClient.sMembers(meter_number).then( keys => {
    readMultipleHashes(keys, callback);
  });
}

const create_add_email_to_meter = (email) => {
  
}

const testing = (callback) =>  {
  get_by_meter_number("meter_number_4989251",(data)=>callback(JSON.stringify(data)));
}

module.exports = {
  testing,
  import_data_to_redis,
  get_by_rowID,
  get_by_meter_number,
}