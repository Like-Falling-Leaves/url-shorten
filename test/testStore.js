var assert = require('assert');
var redisStore = require('../redisStore')({redisUrl: 'redis://127.0.0.1/test-shorten'});
var mongoStore = require('../mongoStore')({mongoUrl: 'mongodb://127.0.0.1/test-shorten'});

describe('Stores:', function () {
  describe('RedisStore', function () {
    testStore(redisStore);
  });
  describe('MongoStore', function () {
    testStore(mongoStore);
  });
});

function testStore(store) {
  var tests = {};
  
  function deepTest(str, cb) {
    if (!tests[str]) tests[str] = cb;
    else tests[str](cb);
  }

  it('should set url and return path', function (done) {
    store.set('some path', 'some url', function (err, val) {
      assert.ok(!err);
      assert.equal(val, 'some path');
      done();

      deepTest('should get url for path', function (done) {
        store.get('some path', function (err, val) {
          assert.ok(!err);
          assert.equal(val, 'some url');
          done();

          var path = 'some path ' + Date.now();
          var url = 'some url ' + Date.now();
          deepTest('should set value with getOrSet if path is new', function (done) {
            store.getOrSet(path, url, function (err, val) {
              assert.ok(!err);
              assert.equal(val, path);
              done();

              deepTest('should not set value with getOrSet if path is old', function (done) {
                store.getOrSet(path + ' new', url, function (err, val) {
                  assert.ok(!err);
                  assert.equal(val, path);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it ('should get url for path', function (done) {
    deepTest('should get url for path', done);
  });

  it('should set value with getOrSet if path is new', function (done) {
    deepTest('should set value with getOrSet if path is new', done);
  });

  it('should not set value with getOrSet if path is old', function (done) {
    deepTest('should not set value with getOrSet if path is old', done);
  });
}
