# url-shorten

A url-shortener for S3, mongodb and redis.

The MongoDB and REDIS versions are mostly there for the sake of completeness (there are other libraries that do that) but the interesting part is the S3 version.  This uses the capability of S3 to do redirection so no active service needs to be on the path for the redirection to work.  In particular, this works with cloudfront too which makes the redirection quite fast.

[![NPM info](https://nodei.co/npm/url-shorten.png?downloads=true)](https://npmjs.org/package/url-shorten)

[![Travis build status](https://api.travis-ci.org/Like-Falling-Leaves/url-shorten.png?branch=master)](
https://travis-ci.org/Like-Falling-Leaves/url-shorten)


## Install

    npm install url-shorten


## API

The default implementation requires a mongodb instance to support an auto-increment counter.  The generated short urls are basically base-36 encoded versions of this counter and so will only use lower case characters and numbers -- no other special characters at all.

### Basic Usage

```javascript
   var config = {mongoUrl: 'mongodb://user:pass@host:port/database'};
   config.s3key = '<your S3 key>';
   config.s3secret = '<your S3 secret>';
   config.s3bucket = '<your S3 bucket>';
   config.shortUrlPrefix = 'http://mysite.com.s3-website-us-east-1.amazonaws.com/';
   config.uniqueIdPrefix = 'shortUrls-'; // all short urls will have this suffixed to shortUrlPrefix

   var shortener = require('url-shorten')(config);

   shortener.shorten('http://www.example.com/some/longurl?ok', function (err, shortUrl) {
      // shortUrl will be something like
      // http://mysite.com.s3-website-us-east-1.amazonaws.com/shortUrls-a3
   });

   // you can find out the long URL for a short url via unshorten
   shortener.unshorten('http://mysite.com.s3-website-us-east-1.amazonaws.com/shortUrls-a3', function (err, url) {
     // you can expect url to be the long url (such as http://www.example.com/some/longurl?ok)
   }

   // by default shortener.shorten will always generate a *new* URL each time
   // you can force it to try to do unique URLs via shortenUnique. 
   // Note that S3 is only *mostly* unique (there are race conditions).
   // But MongoDB and Redis guarantee unique values.
   shortener.shortenUnique( same parameters as shorten );

```

### Changing counter implementation

This uses [mongodb-counter](https://npmjs.org/package/url-shorten) as the default implementation for the unique id generator.  You can pass your own unique ID generator as follows:

```javascript

   config.uniqueIdGenerator = function (done) { ... done(null, newUniqueId); ... }
   var shortener = require('url-shorten')(config);

```

In particular, this does not use the *fast unique id generation* that is provided by default in the [mongodb-counter](https://npmjs.org/package/url-shorten) package but it is trivial to override and pass that instead.

Also, if you would rather not use *mongodb* but use *redis* instead for the counter, you can use the [redis-counter](https://npmjs.org/package/redis-counter) package:

```javascript

   var redisCounter = require('redis-counter');
   config.counters = redisCounter.createCounters({redisUrl: ....});
   var shortener = require('url-shorten')(config);

```

### Using MongoDB or REDIS to store the mappings

If you do not want to use S3, you can store the *shortUrl* to *longUrl* mapping in mongodb or redis.

```javascript

   config.store = require('url-shorten').mongodb({mongoUrl: ....});
   var shortener = require('url-shorten')(config);

   // or for redis
   config.store = require('url-shorten').redis({redisUrl: 'redis://user:pass@host:port'})

```

