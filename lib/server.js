const http = require('http');
const PORT = process.env.PORT || 3000;

const startServer = () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      status: 'success',
      message: 'F49N is running'
    }));
  });
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return server;
};

module.exports = { startServer };
