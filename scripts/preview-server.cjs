const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const root = path.join(__dirname, '..', 'dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function findFreePort(start) {
  return new Promise((resolve) => {
    const tryPort = (p) => {
      const s = net.createServer();
      s.once('error', () => tryPort(p + 1));
      s.once('listening', () => { s.close(() => resolve(p)); });
      s.listen(p);
    };
    tryPort(start);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = path.join(root, urlPath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.end(data);
  });
});

const startPort = parseInt(process.env.PORT || '8765', 10);
findFreePort(startPort).then((port) => {
  server.listen(port, () => {
    console.log(`FDEC 预览服务器已启动:`);
    console.log(`  ➜  Local:   http://localhost:${port}/`);
    console.log(`  根目录: ${root}`);
  });
});