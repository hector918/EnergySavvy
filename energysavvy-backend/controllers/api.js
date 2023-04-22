const { testing, import_data_to_redis, get_by_meter_number, get_by_rowID, create_add_email_to_meter, check_meter_avavilable } = require('../queries/api-to-redis');
module.exports = function energysavvy_api(energysavvy_api) {
  
  energysavvy_api.onRequest("/readbymeter/:meter_number","get", (request_and_response) => {// 
    //
    let {meter_number} = request_and_response.params();
    get_by_meter_number(meter_number, (ret)=>{
      console.log(request_and_response.res)
      request_and_response.send(JSON.stringify(ret));
    });
  });

  energysavvy_api.onRequest("/readbyrowid/:rowID","get", (request_and_response) => {//t
    //
    let {rowID} = request_and_response.params();
    get_by_rowID(rowID, (ret)=>{request_and_response.send(JSON.stringify(ret))});
  });

  energysavvy_api.onRequest("/checkmeter/:meter_number","get", (request_and_response) => {//t
    //
    let {meter_number} = request_and_response.params();
    check_meter_avavilable(meter_number, (ret)=>{
      request_and_response.send(JSON.stringify(ret));
    })
    
  });

  energysavvy_api.onRequest("/addemailtometer/:meter_number","post", (request_and_response) => {//t
    //
    let {meter_number} = request_and_response.params();
    let ret = "";
    try {
      let email = JSON.parse(request_and_response.req.body.string()).email;
      if(email){
        create_add_email_to_meter(meter_number, email, (ret=>{
          request_and_response.send(JSON.stringify(ret));
        }));
      console.log(meter_number, email);
        
      }
    } catch (error) {
      console.log(error)
    }
    
  });

  energysavvy_api.onRequest("/importDB","get", (request_and_response) => {// import dataset
    //only use on when init the DB
    import_data_to_redis((ret)=>{request_and_response.send(ret)});
  });

  energysavvy_api.onRequest("/read","get", (request_and_response) => {// reading dataset
    //
    testing((ret)=>{request_and_response.send(ret)});
  });

}
