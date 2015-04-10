'use strict';

var fs = require('fs');
var is = require('is');
var dependencies = require('./dependencies');
var shell = require('./shell');

module.exports = {
  create: createGraph,
  get: getGraph,
  save: saveGraph,
  items: {
    get: getGraphAsArray,
    saveToNpmCache: dependencies.saveToNpmCache,
    saveToProject: dependencies.saveToProject,
    repoint: dependencies.repoint
  }
};

function createGraph(options) {
  return shell.createDependencyGraph()
    .then(function() {
      return options;
    });
}

function getGraph(options) {
  options.dependencies.graph = require(options.paths.npmShrinkwrap);
  return options;
}

function getGraphAsArray(options) {
  crawlGraph(options.dependencies.graph, function(name, meta) {
    options.dependencies.all.push({
      name: name,
      meta: meta
    });
  });
  return options;
}

function saveGraph(options) {
  fs.writeFileSync(
    options.paths.npmShrinkwrap,
    JSON.stringify(options.dependencies.graph, null, 2)
  );
  return options;
}

function crawlGraph(object, fn, key) {
  if (is.object(object)) {
    if (is.string(object.resolved)) {
      fn(key, object);
    }
    Object.keys(object).forEach(function(key) {
      crawlGraph(object[key], fn, key);
    });
  }
}
