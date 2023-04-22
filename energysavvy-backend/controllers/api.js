const { testing, import_data_to_redis, get_by_meter_number, get_by_rowID } = require('../queries/api-to-redis');
module.exports = function energysavvy_api(energysavvy_api) {
  
  energysavvy_api.onRequest("/readbymeter/:meter_number","get", (request_and_response) => {// 
    //
    let {meter_number} = request_and_response.params();
    get_by_meter_number(meter_number, (ret)=>{
      request_and_response.send(JSON.stringify(ret));
    });
  });

  energysavvy_api.onRequest("/readbyrowid/:rowID","get", (request_and_response) => {//t
    //
    let {rowID} = request_and_response.params();
    get_by_rowID(rowID, (ret)=>{request_and_response.send(JSON.stringify(ret))});
  });

  energysavvy_api.onRequest("/importDB","get", (request_and_response) => {// import dataset
    //
    import_data_to_redis((ret)=>{request_and_response.send(ret)});
  });

  energysavvy_api.onRequest("/read","get", (request_and_response) => {// reading dataset
    //
    testing((ret)=>{request_and_response.send(ret)});
  });

}
