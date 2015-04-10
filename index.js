#!/usr/bin/env node

'use strict';

var path = require('path');
var dependencyGraph = require('./src/dependency-graph');
var shell = require('./src/shell');
var when = require('when');

return shell.getPathToNpmCache()
  .then(getOptions)
  .then(clean)
  .then(prepare)
  .then(dependencyGraph.create)
  .then(dependencyGraph.get)
  .then(dependencyGraph.items.get)
  .then(dependencyGraph.items.saveToNpmCache)
  .then(dependencyGraph.items.saveToProject)
  .then(dependencyGraph.items.repoint)
  .then(dependencyGraph.save);

function getOptions(npmCachePath) {

  var PWD = process.env.PWD || process.cwd();
  var options = {
    dependencies: {
      graph: null,
      all: []
    },
    paths: {
      project: PWD,
      npmCache: npmCachePath,
      nodeModules: joinAbsolute(PWD, 'node_modules'),
      npmShrinkwrap: joinAbsolute(PWD, 'npm-shrinkwrap.json'),
      nodeShrinkwrap: joinAbsolute(PWD, 'node_shrinkwrap'),
      nodeShrinkwrapItem: getPathToPackageInShrinkwrap,
      npmCacheItem: getPathToPackageInNpmCache
    }
  };

  return options;

  function getPathToPackageInNpmCache(item) {
    return joinAbsolute(
      options.paths.npmCache, item.name, item.meta.version, '/package.tgz'
    );
  }

  function getPathToPackageInShrinkwrap(item) {
    return joinAbsolute(
      options.paths.nodeShrinkwrap, item.name + '-' + item.meta.version + '.tgz'
    );
  }

}

function clean(options) {
  return when.all([
      shell.deleteDirectory(options.paths.nodeModules),
      shell.deleteDirectory(options.paths.nodeShrinkwrap),
      shell.deleteFile(options.paths.npmShrinkwrap)
    ])
    .then(function() {
      return options;
    });
}

function prepare(options) {
  return when.all([
      shell.createDirectory(options.paths.nodeShrinkwrap),
      shell.npmInstall()
    ])
    .then(shell.npmDedupe)
    .then(function() {
      return options;
    });
}

function joinAbsolute() {
  return path.resolve(
    path.join.apply(path, [].slice.call(arguments))
  );
}
