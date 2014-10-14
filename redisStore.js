var redis = require('redis');
var url = require('url');
module.exports = redisStore;

function redisStore(options) {
  var client;

  return { get: getRedirect, set: setRedirect, getOrSet: getOrSet };

  function setRedirect(path, url, done) {
    getClient().hset(options.redisHashKey || 'shorten', path, url, function (err) {
      if (err) return done(err);
      return done(null, path);
    });
  }

  function getRedirect(path, done) {
    getClient().hget(options.redisHashKey || 'shorten', path, function (err, val) {
      if (err) return done(err);
      return done(null, val);
    });
  }

  function getOrSet(path, url, done) {
    getClient().hsetnx((options.redisHashKey || 'shorten') + 'reverse', url, path, function (err, val) {
      if (err) return done(err);
      if (val == 1) return setRedirect(path, url, done);
      client.hget((options.redisHashKey || 'shorten') + 'reverse', url, function (err, val) {
        if (err) return done(err);
        return done(null, val);
      });
    });
  }

  function getClient() {
    if (client) return client;
    var uri = url.parse(options.redisUrl || process.env.REDISCLOUD_URL || process.env.REDIS_URL);
    var opts = options.redisOptions || {};
    if (uri.auth) options.auth_pass = uri.auth.split(':')[1];
    client = redis.createClient(+uri.port, uri.hostname, options);
    return client;
  }
}

