//depend
const { routing } = require('./router.js');
const session = require('./middlewares/session-cookie');
////addon
routing.addon('logs', require('./addons/logs'));
// routing.addon('websocket', require('./addons/websocket-router'));
// ///routing
routing.use('/energysavvy', session, require('./energysavvy-backend/root.js'));

routing.use(`*`, (all)=>{all.onRequest('*', 'get', (session)=>{ session.code(404).send("404"); })});