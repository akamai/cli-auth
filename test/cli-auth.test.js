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
/* eslint-disable */
'use strict';

const {expect} = require('chai');
const untildify = require('untildify');
const CliAuth = require('../src/cli-auth');
const cliAuth = new CliAuth();
const fileName = 'test.config';
const defaultSection = 'default';
let fileContent = 'Lorem Ipsum Dolor';
const ini = require('ini');
const fs = require('fs');
const EdgeGridAuth = require('akamai-edge-grid-auth').edgeGridAuth;
const edgeGridAuth = new EdgeGridAuth();

function captureStream(stream, is_error) {
  is_error = is_error || false;
  let oldWrite = stream.write;
  let buf = '';
  stream.write = (chunk, encoding, callback) => {
    buf += chunk.toString(); // chunk is a String or Buffer
    oldWrite.apply(stream, arguments);
  };

  return {
    unhook: () => {
      stream.write = oldWrite;
    },
    captured: () => {
      return buf;
    }
  };
}

describe('CliAuth', function() {
  let hook;
  beforeEach(function() {
    hook = captureStream(process.stdout);
  });
  afterEach(function() {
    hook.unhook();
  });
  before('Test for EdgeGridAuth', () => {
    let config = [];
    config['default'] = {
      client_secret: process.env.client_secret,
      host: process.env.host,
      access_token: process.env.access_token,
      client_token: process.env.client_token,
    };
    fileContent = ini.stringify(config, {whitespace: true});
    edgeGridAuth.writeConfigFile(fileName, fileContent);
  });
  it('test verify credentials', function(done) {
    this.timeout(5000);
    let edgercPath = untildify('~/.edgerc');
    let fileExist = fs.existsSync(edgercPath);
    if (fileExist) {
      expect(fileExist, 'File ' + edgercPath + ' exist ' + fileExist).to.be.true;
      const options = {
        config: edgercPath,
        section: defaultSection
      };
      cliAuth.verify(options)
        .then(() => {
          let output = hook.captured();
          expect(output).to.have.string('Credential Name');
          expect(output).to.have.string('Grants');
          expect(output).to.have.string('diagnostic-tools');
          done();
        })
        .catch(done);
    } else {
      console.warn('This test need a valid credential placed in', untildify('~/.edgerc'));
      done();
    }
  });
  it('test verify credentials Exception for no file in options', function(done) {
    expect(function() {
      const options = {
        section: defaultSection
      };
      cliAuth.verify(options)
    }).to.throw('Invalid configuration file in parameters');
    done();
  });
  it('test verify credentials Exception for no file not exist in options', function(done) {
    expect(function() {
      const options = {
        config: 'invalid',
        section: defaultSection
      };
      cliAuth.verify(options)
    }).to.throw('The configuration file in invalid not exist');
    done();
  });
  it('test verify credentials Exception for no section in options', function(done) {
    expect(function() {
      const options = {
        config: fileName,
      };
      cliAuth.verify(options)
    }).to.throw('Invalid section in configuration parameters');
    done();
  });
  it('test paste credentials Exception for no file in options', function(done) {
    expect(function() {
      const options = {
        from: 'default',
        to: 'other1'
      };
      cliAuth.paste(options)
    }).to.throw('Invalid File parameters');
    done();
  });
  it('test copy credentials in command line', function(done) {
    expect(function() {
      const options = {};
      cliAuth.paste(options)
    }).to.throw('Invalid File parameters');
    done();
  });
  it('test copy credentials exception', function(done) {
    expect(function() {
      const options = {
        config: fileName,
        to: 'other1'
      };
      cliAuth.copy(options)
    }).to.throw('Invalid parameters <from> and/or <to> for copy command');
    done();
  });
  it('test copy credentials exception for file name', function(done) {
    expect(function() {
      const options = {
        from: 'default',
        to: 'other1'
      };
      cliAuth.copy(options)
    }).to.throw('Invalid File Name parameter');
    done();
  });
});


