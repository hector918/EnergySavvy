
const redis = require('redis');
const redisClient = redis.createClient({
  url: 'redis://192.168.3.20:6379'
});

redisClient.on("error", (error) => console.error(`Error : ${error}`));
redisClient.connect();

async function import_data_to_redis(callback){
  const fs = require('fs');
  const csv = require('csv-parser');

  let counter = {};
  let headers = [];
  const filename = __dirname + '/Electric_Consumption_And_Cost__2010_-_Feb_2023_.csv';
  let acc = 0;
  fs.createReadStream(filename)
  .pipe(csv())
  .on('headers', (h) => headers = h)
  .on('data', async (data) => {
      acc++;
      const trimmedData = {};
      Object.keys(data).forEach(key => trimmedData[key.trim()] = data[key].trim());

      redisClient.HSET(`rowID_${acc}`, trimmedData, (err, replay)=>{
        if (err) {
          console.error(err);
        } else {
          console.log(reply);
        }
      });
      await redisClient.SADD(`meter_number_${data['Meter Number']}`, `rowID_${acc}`);
      
    
    // results.push(data);
  })
  .on('end', () => {
    console.log(headers)
    callback(`row count ${acc}`);
  });
}

function readMultipleHashes(keys, callback) {
  const pipeline = redisClient.multi();
  keys.forEach((key) => pipeline.hGetAll(key));
  pipeline.exec().then(callback);
}

module.exports = { redisClient, import_data_to_redis, readMultipleHashes }