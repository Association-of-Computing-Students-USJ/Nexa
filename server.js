const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const clientDistDir = path.join(__dirname, 'client', 'dist');
const port = Number(process.env.PORT) || 8080;

console.log(`Starting server...`);
console.log(`PORT: ${port}`);
console.log(`__dirname: ${__dirname}`);
console.log(`clientDistDir: ${clientDistDir}`);

// Check if dist directory exists
fs.stat(clientDistDir, (err, stats) => {
  if (err || !stats.isDirectory()) {
    console.error(`ERROR: client/dist directory not found at ${clientDistDir}`);
    process.exit(1);
  }
  console.log(`✓ client/dist directory exists`);
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg'
};

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';
  fs.readFile(filePath, (error, data) => {
    if (error) {
      console.error(`File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = requestPath === '/' ? path.join(clientDistDir, 'index.html') : path.join(clientDistDir, requestPath);

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    sendFile(res, path.join(clientDistDir, 'index.html'));
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✓ Server listening on port ${port}`);
});

server.on('error', (err) => {
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});