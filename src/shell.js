'use strict';

var shelljs = require('shelljs');
var when = require('when');
var guard = require('when/guard');

var CONCURRENCY_LIMIT = 10;
var throttle = guard.n(CONCURRENCY_LIMIT);

module.exports = {
  deleteFile: rateLimit(deleteFile),
  deleteDirectory: rateLimit(deleteDirectory),
  createDirectory: rateLimit(createDirectory),
  copyFile: rateLimit(copyFile),
  npmInstall: rateLimit(npmInstall),
  npmDedupe: rateLimit(npmDedupe),
  createDependencyGraph: rateLimit(createDependencyGraph),
  cachePackage: rateLimit(cachePackage),
  getPathToNpmCache: rateLimit(getPathToNpmCache)
};

function deleteFile(path) {
  return when(
    shelljs.rm('-f', path)
  );
}

function deleteDirectory(path) {
  return when(
    shelljs.rm('-rf', path)
  );
}

function createDirectory(path) {
  return when(
    shelljs.mkdir('-p', path)
  );
}

function copyFile(from, to) {
  return when(
    shelljs.cp('-f', from, to)
  );
}

function npmInstall() {
  return execAsync('npm install');
}

function npmDedupe() {
  return execAsync('npm dedupe');
}

function createDependencyGraph() {
  return execAsync('npm shrinkwrap --dev');
}

function cachePackage(name, version) {
  return execAsync('npm cache add ' + name + '@' + version);
}

function getPathToNpmCache() {
  return execAsync('npm config get cache');
}

function execAsync(command) {
  return when.promise(function(resolve, reject) {
    shelljs.exec(command, {
      silent: true
    }, function(code, output) {
      if (code === 1) {
        reject(output.trim());
      } else {
        resolve(output.trim());
      }
    });
  });
}

function rateLimit(fn) {
  return guard(throttle, fn);
}
