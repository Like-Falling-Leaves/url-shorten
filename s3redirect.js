var knox = require('knox');
module.exports = s3redirector;

function s3redirector(options) {
  var client;
  var data = new Buffer('');

  return { get: getRedirect, set: setRedirect, getOrSet: getOrSet };

  function setRedirect(path, url, done) {
    var headers = {
      'x-amz-website-redirect-location': url, 
      'Content-Length': '0',
      'Content-Type': 'text/html',
      'Cache-Control': 'max-age=' + (options.s3maxAge || 3600),
      'x-amz-acl': 'public-read'
    };
    getClient().put(path, headers).on('response', onResponse).on('error', onError).end(data);
    function onError(err) { console.log('s3 failed', err); return done(err); }
    function onResponse(res) {
      res.on('error', onError);
      res.resume();
      if (res.statusCode == 200) return done(null, path);
      return done('S3 responded: ' + res.statusCode);
    }
  }

  function getRedirect(path, done) {
    getClient().head(path).on('response', onResponse).on('error', onError).end();
    function onError(err) { return done(err); }
    function onResponse(res) {
      res.on('error', onError);
      res.resume();
      if (res.statusCode == 200) {
        console.log('Got response: ', res.headers);
        return done(null, res.headers['x-amz-website-redirect-location']);
      }
      return done('S3 responded: ' + res.statusCode);
    }
  }

  function getOrSet(path, url, done) {
    // this is not perfect and has race conditions.
    getRedirect(url, function (err, existingPath) {
      if (!err && existingPath) return done(null, existingPath.replace(/^\//, ''));
      return setRedirect(path, url, function (err) {
        if (err) return done(err);
        setRedirect(url, '/' + path, function (err) { return done (err, path); });
      });
    });
  }

  function getClient() {
    if (client) return client;
    client = knox.createClient({
      key: options.s3key || process.env.AWS_S3_CLIENT_ID,
      secret: options.s3secret || process.env.AWS_S3_CLIENT_SECRET,
      bucket: options.s3bucket || process.env.AWS_S3_BUCKET
    });
    return client;
  }
}
