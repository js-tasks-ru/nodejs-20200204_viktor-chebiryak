const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      if (!pathname || pathname.indexOf('/') !== -1) {
        res.statusCode = 400;
        res.end('Bad request');
        return;
      }

      fs.exists(filepath, function (exists) {
        if (!exists) {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }

        const file = new fs.ReadStream(filepath);
        file.pipe(res);

        file.on('error', function (err) {
          res.statusCode = 500;
          res.end('Unknown server error');
        });

        res.on('close', function () {
          file.destroy();
        });
      });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
