const React = require('react');

const api = {
  createInteropElement: React.createElement,
};

module.exports = {
  ...api,
  default: api,
};
