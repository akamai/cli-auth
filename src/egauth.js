// Copyright 2017 Akamai Technologies, Inc. All Rights Reserved
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';

let untildify = require('untildify');
let inquirer = require('inquirer');
let fs = require('fs');
let ini = require('ini');
let merge = require('merge');
let path = require('path');
let EdgeGrid = require('edgegrid');
let prompt = require('cli-input');
const multiline = require('node-ask').multiline;
const sprompt = require('node-ask').prompt;

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function readConfigFile(filename, section) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, section, function(error, result) {
      if (error) {
        resolve();
      } else {
        let configObject = ini.parse(result.toString());
        if (section) {
          resolve(configObject[section]);
        } else {
          resolve(configObject);
        }
      }
    });
  });
}

function writeConfigFile(filename, contents) {
  return new Promise(function(resolve, reject) {
    contents = contents.replace(/['"]+/g, '');

    fs.writeFile(filename, contents, function(error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

function createConfigFile(filename) {
  return new Promise(function(resolve, reject) {
    let contents = '';

    fs.writeFile(filename, contents, {'flag': 'a'}, function(error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
 	});
  });
}

// export default class WebSite {
class edgeGridAuth {
  verify(options) {
    this._edge = new EdgeGrid({
      path: untildify(options.config),
      section: options.section,
      debug: options.debug,
    });
    return new Promise((resolve, reject) => {
      let request = {
        method: 'GET',
        path: '/-/client-api/active-grants/implicit',
      };
      this._edge.auth(request);

      this._edge.send(function(data, response) {
        let credential = JSON.parse(response.body);
        console.log('Credential Name: ' + credential.name);
        console.log('---------------------------------');
        console.log('Created ' +
                            credential.created +
                            ' by ' +
                            credential.createdBy);
        console.log('Updated ' +
                            credential.updated +
                            ' by ' +
                            credential.updatedBy);
        console.log('Activated ' +
                            credential.activated +
                            ' by ' +
                            credential.activatedBy);
        console.log('Grants:');
        let grants = [];
        for (let scope of credential.scope.split(' ')) {
          let items = scope.split('/');
          grants.push('    ' + items[5] + ' : ' + items[7]);
        }
        for (let grant of grants.sort()) {
          console.log(grant);
        }

        resolve(response);
      });
    });
  }

  paste(options) {
    let newconfig = {};
    return multiline('Input credential blocks followed by a newline:')
      .then(answer => {
        newconfig = ini.parse(answer);
        if (newconfig['host']) {
          answer = '[' + options.section + ']\n' + answer;
          newconfig = ini.parse(answer);
        }
        return createConfigFile(options.config);
      })
      .then(() => {
        if (options.overwrite) {
          return Promise.resolve({});
        } else {
          return readConfigFile(options.config);
        }
      })
      .then(config => {
        config = merge(config, newconfig);
        let filename = options.config;
        return writeConfigFile(filename, ini.stringify(config, {whitespace: true}));
      })
      .then(() => {
        console.log('Success! Added credentials for:');
        for (let section of Object.keys(newconfig)) {
          console.log('  ' + section);
        }
      });
  }

  copy(options) {
    return readConfigFile(options.config)
      .then(config => {
        console.log(config);
        config[options.to] = config[options.from];

        let filename = options.config;
        return writeConfigFile(filename, ini.stringify(config, {whitespace: true}));
      })
      .then(() => {
        console.log('Success! Copied credentials from section :' + options.to + ' to ' + options.from);
      });
  }

  setup(options) {
    let questions = [];
    let list = ['client_secret', 'client_token', 'access_token', 'host'];

    let currentConfig;
    return new Promise((resolve, reject) => {
      console.log('You will need to use the credential information from Luna.  All fields are required.');
      for (let field of list) {
        if (!options[field]) {
          let question = {
            type: 'input',
            name: field,
            message: 'Please input the ' + field + ': ',
          };
          questions.push(question);
        }
      }
      return resolve();
    })
      .then(() => {
        return createConfigFile(options.config);
      })
      .then(() => {
        return readConfigFile(options.config);
      })
      .then(config => {
        currentConfig = config;
        return inquirer.prompt(questions);
      })
      .then(answers => {
        options = merge(options, answers);
        let filename = options.config;
        let section = options.section;
        let config = currentConfig || {};
        config[section] = {};
        for (let field of list) {
          config[section][field] = options[field];
        }
        return writeConfigFile(filename, ini.stringify(config, {whitespace: true}));
      });
  }

  makeRequest(request) {
    return new Promise((resolve, reject) => {
      this._nsClient.auth(request);
      this._nsClient.send((data, response) => {
        if (response.statusCode != 200) {
          reject('Unable to complete action.  Status code ' + response.statusCode);
        } else {
          resolve(response);
        }
      });
    });
  }
}
module.exports = edgeGridAuth;
