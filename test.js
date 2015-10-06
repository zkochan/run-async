'use strict';

var assert = require('assert');
var runAsync = require('./index');
var semver = require('semver');
var Promise;
var runAsyncPromise;

if (semver.gte(process.version, '4.0.0')) {
  console.log('using native promises');
  Promise = global.Promise;
  runAsyncPromise = runAsync.promisify();
} else {
  console.log('using bluebird promises');
  Promise = require('bluebird');
  runAsyncPromise = runAsync.promisify(Promise);
}

describe('runAsync', function () {
  it('run synchronous method', function (done) {
    var ranAsync = false;
    var aFunc = function () {
      return 'pass1';
    };
    runAsync(function (err, val) {
      assert.ifError(err);
      assert(ranAsync);
      assert.equal(val, 'pass1');
      done();
    }, aFunc);
    ranAsync = true;
  });

  it('run asynchronous method', function (done) {
    var aFunc = function () {
      var returns = this.async();
      setImmediate(returns.bind(null, null, 'pass2'));
    };

    runAsync(function (err, val) {
      assert.ifError(err);
      assert.equal(val, 'pass2');
      done();
    }, aFunc);
  });

  it('pass arguments', function (done) {
    var aFunc = function (a, b) {
      assert.equal(a, 1);
      assert.equal(b, 'bar');
      return 'pass1';
    };
    runAsync(function (err, val) {
      assert.ifError(err);
      done();
    }, aFunc, 1, 'bar');
  });

  it('allow only callback once', function (done) {
    var aFunc = function () {
      var returns = this.async();
      returns();
      returns();
    };

    runAsync(function (err, val) {
      assert.ifError(err);
      done();
    }, aFunc);
  });

  it('handles promises', function (done) {
    var fn = function () {
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          resolve('as promised!');
        });
      });
    };

    runAsync(function (err, val) {
      assert.ifError(err);
      assert.equal('as promised!', val);
      done();
    }, fn);
  });

  it('throwing synchronously passes error to callback', function (done) {
    var throws = function () {
      throw new Error('sync error');
    };

    runAsync(function (err, val) {
      assert(err);
      assert.equal(err.message, 'sync error');
      done();
    }, throws);
  });

  it('rejecting a promise passes error to callback', function (done) {
    var rejects = function () {
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          reject(new Error('broken promise'));
        });
      });
    };

    runAsync(function (err, val) {
      assert(err);
      assert.equal(err.message, 'broken promise');
      done();
    }, rejects);
  });

  it('can be promisified', function (done) {
    var sync = function () {
      return 'sync';
    };

    runAsyncPromise(sync).then(function (result) {
      assert.equal(result, 'sync');
      done();
    });
  });

  it('promisified can be rejected', function (done) {
    var throwsSync = function () {
      throw new Error('throws sync');
    };

    runAsyncPromise(throwsSync).catch(function (err) {
      assert.equal(err.message, 'throws sync');
      done();
    });
  });

  it('promisified passes args', function(done) {
    var checkArgs = function (a, b) {
      var done = this.async();
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      setImmediate(done.bind(null, null, 'c'));
    };

    runAsyncPromise(checkArgs, 'a', 'b').then(function (result) {
      assert.equal(result, 'c');
      done();
    });
  });
});
