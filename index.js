#!/usr/bin/env node

'use strict';

var PWD = process.env.PWD || process.cwd();

var fs = require('fs');
var is = require('is');
var path = require('path');
var shell = require('./src/shell');
var when = require('when');

return shell.getPathToNpmCache()
  .then(getOptions)
  .then(clean)
  .then(prepare)
  .then(createDependencyGraph)
  .then(readDependencyGraph)
  .then(npmCacheDependencies)
  .then(saveDependencies)
  .then(updateDependencyGraph)
  .then(saveDependencyGraph);

function getOptions(npmCachePath) {
  return {
    dependencies: {
      graph: null,
      all: []
    },
    paths: {
      nodeModules: joinAbsolute(PWD, 'node_modules'),
      nodeShrinkwrap: joinAbsolute(PWD, 'node_shrinkwrap'),
      npmShrinkwrap: joinAbsolute(PWD, 'npm-shrinkwrap.json'),
      npmCache: npmCachePath
    }
  };
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

function createDependencyGraph(options) {
  return shell.createDependencyGraph()
    .then(function() {
      return options;
    });
}

function readDependencyGraph(options) {
  options.dependencies.graph = require(options.paths.npmShrinkwrap);
  crawlDependencyGraph(options.dependencies.graph, function(name, meta) {
    options.dependencies.all.push({
      name: name,
      meta: meta
    });
  });
  return options;
}

function npmCacheDependencies(options) {
  return when.all(
      options.dependencies.all.map(function(dependency) {
        return shell.cachePackage(dependency.name, dependency.meta.version);
      })
    )
    .then(function() {
      return options;
    });
}

function saveDependencies(options) {
  return when.all(
      options.dependencies.all.map(function(dependency) {
        return shell.copyFile(
          getPathToNpmCache(options, dependency),
          getShrinkwrapPath(options, dependency)
        );
      })
    )
    .then(function() {
      return options;
    });
}

function updateDependencyGraph(options) {
  options.dependencies.all.forEach(function(dependency) {
    dependency.meta.resolved = path.relative(PWD, getShrinkwrapPath(options, dependency));
  });
  return options;
}

function saveDependencyGraph(options) {
  fs.writeFileSync(
    options.paths.npmShrinkwrap,
    JSON.stringify(options.dependencies.graph, null, 2)
  );
  return options;
}

function getPathToNpmCache(options, dependency) {
  return joinAbsolute(
    options.paths.npmCache, dependency.name, dependency.meta.version, '/package.tgz'
  );
}

function getShrinkwrapPath(options, dependency) {
  return joinAbsolute(
    options.paths.nodeShrinkwrap, dependency.name + '-' + dependency.meta.version + '.tgz'
  );
}

function joinAbsolute() {
  return path.resolve(
    path.join.apply(path, [].slice.call(arguments))
  );
}

function crawlDependencyGraph(object, fn, key) {
  if (is.object(object)) {
    if (is.string(object.resolved)) {
      fn(key, object);
    }
    Object.keys(object).forEach(function(key) {
      crawlDependencyGraph(object[key], fn, key);
    });
  }
}
