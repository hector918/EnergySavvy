
module.exports = function root(energysavvy) {
  energysavvy.use('/api', require('./controllers/api'));

  energysavvy.serveFile("/", './EnergySavvy-frondend/energysavvy/build');
}