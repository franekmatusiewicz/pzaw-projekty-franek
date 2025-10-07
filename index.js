import { createServer } from 'node:http';
import { handlePath } from './src/path_handlers.js';
import { URL } from 'node:url';

// Create a HTTP server
const server = createServer((req, res) => {
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.end('hello world!');
  const request_url = new URL(`http://${host}${req.url}`);
  const path = request_url.pathname;
  handlePath(request_url.pathname, req, res)
});


const port = 8000;
const host = "localhost";

// Start the server
server.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
});