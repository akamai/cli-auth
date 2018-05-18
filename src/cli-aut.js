// Copyright 2018 Akamai Technologies, Inc. All Rights Reserved
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

const inquirer = require('inquirer');
const ini = require('ini');
const edgeGridAuth = require('akamai-edge-grid-auth').edgeGridAuth;
const multiLine = require('node-ask').multiline;
const chalk = require('chalk');
const untildify = require('untildify');

/**
 * Cli Authentication
 */
class CliAuth {
  /**
   * Verify existing credentials
   *
   * @param options
   */
  verify(options) {
    if (!options.config) {
      throw new Error('Invalid configuration file in parameters');
    }
    if (!options.section) {
      throw new Error('Invalid section in configuration parameters');
    }

    return new Promise((resolve) => {
      /** @var EdgeGridAuth */
      let app = new edgeGridAuth(options);
      app.verify(options.config, options.section)
        .then((credential) => {
          console.log('Credential Name: ' + credential.get('name'));
          console.log('---------------------------------');
          console.log('Created ' +
            credential.get('created') +
            ' by ' +
            credential.get('createdBy'));
          console.log('Updated ' +
            credential.get('updated') +
            ' by ' +
            credential.get('updatedBy'));
          console.log('Activated ' +
            credential.get('activated') +
            ' by ' +
            credential.get('activatedBy'));
          console.log('Grants:');
          let grants = [];
          for (let scope of credential.get('scope').split(' ')) {
            let items = scope.split('/');
            grants.push('    ' + items[5] + ' : ' + items[7]);
          }
          for (let grant of grants.sort()) {
            console.log(grant);
          }
          resolve();
        });
    })
      .catch((error) => {
        console.log('Error! ' + error.message);
      });
  }

  pasteAskBlocks(section) {
    return multiLine('Input credential blocks followed by a newline:')
      .then(answer => {
        let newConfig = ini.parse(answer);
        if (newConfig['host']) {
          answer = '[' + section + ']\n' + answer;
          newConfig = ini.parse(answer);
        }
        return newConfig;
      });
  }

  /**
   * Paste in a formatted credential block
   *
   * @param options
   */
  paste(options) {
    if (!options.config) {
      throw new Error('Invalid File parameters');
    }
    let newConfig = {};
    return new Promise((resolve) => {
      return this.pasteAskBlocks(options.section)
        .then((answers) => {
          newConfig = answers;
          let filename = options.config;
          /** @var EdgeGridAuth */
          let app = new edgeGridAuth(options);
          return app.paste(filename, options.section, newConfig);
        })
        .then(() => {
          console.log(chalk.green.bold('Success!'), 'Added credentials in section', chalk.blue.bold(options.section), 'for keys:');
          for (let section of Object.keys(newConfig)) {
            console.log('  ' + section);
          }
          console.log('\n');
          resolve();
        });
    }).catch((error) => {
      console.log('Error!' + error.message);
    });
  }

  /**
   * Copy credentials from one section to a new one
   *
   * @param options
   */
  copy(options) {
    if (!options.from || !options.to) {
      throw new Error('Invalid parameters <from> and/or <to> for copy command');
    }
    return new Promise((resolve) => {
      /** @var EdgeGridAuth */
      let app = new edgeGridAuth(options);
      app.copy(options.config, options.from, options.to)
        .then((result) => {
          console.log(result);
          console.log('Success! Copied credentials from section ' + options.to + ' to ' + options.from);
          resolve(result);
        });
    })
      .catch((error) => {
        console.log('Error! ' + error.message);
      });
  }

  /**
   * Setup authentication for Akamai
   *
   * @param options
   */
  setup(options) {
    let questions = [];
    let list = ['client_secret', 'client_token', 'access_token', 'host'];
    let currentConfig;
    /** @var EdgeGridAuth */
    let app = new edgeGridAuth(options);
    return new Promise((resolve) => {
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
        return app.readConfigFile(options.config);
      })
      .then(config => {
        currentConfig = config;
        return inquirer.prompt(questions);
      })
      .then(newConfig => {
        let filename = options.config;
        let section = options.section;
        return app.setup(filename, section, currentConfig, newConfig);
      })
      .then(() => {
        console.log('Success!');
      })
      .catch((error) => {
        console.log('Error!' + error.message);
      });
  }
}

module.exports = CliAuth;
