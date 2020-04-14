const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');
const LimitExceededError = require('./LimitExceededError');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filesDir = path.join(__dirname, 'files');
  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      if (!pathname || pathname.indexOf('/') !== -1) {
          res.statusCode = 400;
          res.end('Bad request');
          return;
      }

      fs.exists(filepath, function (exists) {
        if (exists) {
          res.statusCode = 409;
          res.end('File already exists');
          return;
        }

        fs.exists(filesDir, function (exists) {

          if (exists) {
            onReady();
          } else {
            fs.mkdir(filesDir, onReady);
          }

          function onReady() {
            const stream = fs.createWriteStream(filepath);
            const limitStream = new LimitSizeStream({ limit: 1024*1024 });
            req.pipe(limitStream).pipe(stream);

            limitStream.on('error', function (err) {
                fs.unlink(filepath, () => {
                    res.statusCode = 413;
                    res.end('File limit exceeded');
                });
            });

            req.on('error', function (err) {
                fs.unlink(filepath, () => {
                    res.statusCode = 500;
                    res.end('Internal Server Error');
                });
            });

            req.on('end', function () {
                res.statusCode = 201;
                res.end('ok');
            });

            req.on('aborted', function () {
              fs.unlink(filepath, () => {
                res.statusCode = 500;
                res.end('Internal Server Error');
              });
            })
          }

        });
      });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
