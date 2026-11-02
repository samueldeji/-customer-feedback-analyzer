// customer-feedback-analyzer
// scripts/serve-web.js
// Lightweight local static HTTP server for web/public on port 8080.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'web', 'public');
const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    } else if (!path.extname(pathname)) {
      if (fs.existsSync(path.join(PUBLIC_DIR, pathname.replace(/^\/+/, '') + '.html'))) {
        pathname += '.html';
      }
    }

    const relPath = pathname.replace(/^\/+/, '');
    const filePath = path.resolve(PUBLIC_DIR, relPath);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ChopFast Web server listening on http://localhost:${PORT}`);
  console.log(`Serving static files from: ${PUBLIC_DIR}`);
});
