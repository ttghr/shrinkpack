'use strict';

var path = require('path');
var when = require('when');
var shell = require('./shell');

module.exports = {
  saveToNpmCache: createIterator(npmCache),
  saveToProject: createIterator(save),
  repoint: createIterator(repoint)
};

function npmCache(options, dependency) {
  return shell.cachePackage(dependency.name, dependency.meta.version);
}

function save(options, dependency) {
  return shell.copyFile(
    options.paths.npmCacheItem(dependency),
    options.paths.nodeShrinkwrapItem(dependency)
  );
}

function repoint(options, dependency) {
  dependency.meta.resolved = path.relative(
    options.paths.project,
    options.paths.nodeShrinkwrapItem(dependency)
  );
  return dependency;
}

function createIterator(iterator) {
  return function(options) {
    return when.all(
        options.dependencies.all.map(function(dependency) {
          return iterator(options, dependency);
        })
      )
      .then(function() {
        return options;
      });
  };
}
