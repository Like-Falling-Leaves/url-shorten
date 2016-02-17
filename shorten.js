var counter = require('mongodb-counter');
var s3redirect = require('./s3redirect');
module.exports = shortener;
module.exports.redis = require('./redisStore');
module.exports.mongodb = require('./mongoStore');
module.exports.s3 = s3redirect;
module.exports.counter = counter;

function shortener(options) {
  var store = options.store || s3redirect(options);
  var uniqueIdGenerator = options.uniqueIdGenerator || (options.counters || counter.createCounters(
    _({}).assign(options).assign({collectionName: options.countersCollectionName}).value()
  ))(options.uniqueIdCounterName || 'shortener');
    
  return {
    shorten: shorten,
    shortenUnique: shortenUnique,
    unshorten: unshorten
  };

  function shorten(longUrl, done) {
    getUniqueId(function (err, uniqueId) {
      if (err) return done(err);
      store.set(uniqueId, longUrl, finish);
      function finish(err, path) { return done(null, options.shortUrlPrefix + uniqueId); }
    });
  }

  function shortenUnique(longUrl, done) {
    getUniqueId(function (err, uniqueId) {
      if (err) return done(err);
      store.getOrSet(uniqueId, longUrl, finish);
      function finish(err, path) { return done(null, options.shortUrlPrefix + path); }
    });
  }

  function unshorten(shortUrl, done) { store.get(shortUrl.replace(options.shortUrlPrefix, ''), done);  }

  function getUniqueId(done) {
    if (typeof(uniqueIdGenerator) == 'function') return uniqueIdGenerator(complete);
    return uniqueIdGenerator.getUniqueId(complete);
    function complete(err, value) {
      if (err) return done(err);
      var prefix = options.uniqueIdPrefix || '';
      if (typeof(value) == 'number') return done(null, prefix + value.toString(36));
      return done(null, prefix + value.toString());
    }
  }
}
