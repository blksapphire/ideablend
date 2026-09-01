const http = require('http');
const app = require('./app');
const { setupSocket } = require('./realtime/socket');

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Idea Blend API listening on ${PORT}`));
