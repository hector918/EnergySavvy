const redis = require("redis");


let redisClient;

(async () => {
  redisClient = redis.createClient({
    url: 'redis://192.168.3.20:6379'
  });

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();

  await redisClient.HSET('key', 'field', 'value');
  console.log(await redisClient.HGETALL('key'))
})();