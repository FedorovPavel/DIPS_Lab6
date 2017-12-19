var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

const lifeTime = 300;

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'catalogservice',
      tokenLife : lifeTime
    },
    port: process.env.PORT || 3004,
    db: 'mongodb://localhost/catalogservice-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'catalogservice',
      tokenLife : lifeTime
    },
    port: process.env.PORT || 3004,
    db: 'mongodb://localhost/catalogservice-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'catalogservice',
      tokenLife : lifeTime
    },
    port: process.env.PORT || 3004,
    db: 'mongodb://localhost/catalogservice-production'
  }
};

module.exports = config[env];
