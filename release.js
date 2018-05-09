'use strict';

const source = 'bin/akamaiAuth';
const target = 'releases/akamai-auth-0.0.3';
const Release = require('akamai-node-release');

module.exports = Release(source, target);
