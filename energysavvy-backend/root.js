
module.exports = function root(energysavvy) {
  energysavvy.use('/api', require('./controllers/api'));

  // chatgpt.serveFile("/", './app-root-frontend');
}