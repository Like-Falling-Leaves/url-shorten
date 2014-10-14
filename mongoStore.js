var mongodb = require('mongodb');
module.exports = mongoStore;

function mongoStore(options) {
  var client;

  return { get: getRedirect, set: setRedirect, getOrSet: getOrSet };

  function setRedirect(path, url, done) {
    getClient(function (err, collection) {
      if (err) return done(err);
      collection.insert({path: path, longUrl: url}, function (err, docs) {
        return done(err, path);
      });
    });
  }

  function getRedirect(path, done) {
    getClient(function (err, collection) {
      if (err) return done(err);
      collection.findOne({path: path}, {sort: {_id: -1}}, function (err, doc) {
        return done(err, doc && doc.longUrl);
      });
    });
  }

  function getOrSet(path, url, done) {
    getClient(function (err, collection) {
      if (err) return done(err);
      var update = {$setOnInsert: {path: path, longUrl: url}};
      var options = {new: true, upsert: true};
      collection.findAndModify({url: url}, {_id: -1}, update, options, function (err, doc) {
        if (err) return done(err);
        if (doc.path == path) return setRedirect(path, url, done);
        return done(null, doc.path);
      });
    })
  }

  function getClient(done) {
    if (client) return done(null, client);
    mongodb.MongoClient.connect(options.mongoUrl, function (err, db) {
      if (err) return done(err);
      var collection = db.collection(options.collectionName || 'shorten');
      collection.ensureIndex('path', function (err) { 
        if (err) return done(err);
        collection.ensureIndex('longUrl', function (err) {
          if (err) return done(err);
          client = collection;
          return done(null, collection)
        });
      });
    });
  }
}

