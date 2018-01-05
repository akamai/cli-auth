'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

exports.default = function (_ref) {
  var records = _ref.records,
      entrypoint = _ref.entrypoint,
      bytecode = _ref.bytecode;

  var stripes = [];

  for (var snap in records) {
    var record = records[snap];
    var file = record.file;

    if (!hasAnyStore(record)) continue;
    (0, _assert2.default)(record[_common.STORE_STAT], 'packer: no STORE_STAT');

    if ((0, _common.isDotNODE)(file)) {
      continue;
    } else {
      (0, _assert2.default)(record[_common.STORE_BLOB] || record[_common.STORE_CONTENT] || record[_common.STORE_LINKS]);
    }

    if (record[_common.STORE_BLOB] && !bytecode) {
      delete record[_common.STORE_BLOB];
      if (!record[_common.STORE_CONTENT]) {
        // TODO make a test for it?
        throw (0, _log.wasReported)('--no-bytecode and no source breaks final executable', [file, 'Please run with "-d" and without "--no-bytecode" first, and make', 'sure that debug log does not contain "was included as bytecode".']);
      }
    }

    var _arr2 = [_common.STORE_BLOB, _common.STORE_CONTENT, _common.STORE_LINKS, _common.STORE_STAT];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var store = _arr2[_i2];
      var _value = record[store];
      if (!_value) continue;

      if (store === _common.STORE_BLOB || store === _common.STORE_CONTENT) {
        if (record.body === undefined) {
          stripes.push({ snap: snap, store: store, file: file });
        } else if (Buffer.isBuffer(record.body)) {
          stripes.push({ snap: snap, store: store, buffer: record.body });
        } else if (typeof record.body === 'string') {
          stripes.push({ snap: snap, store: store, buffer: Buffer.from(record.body) });
        } else {
          (0, _assert2.default)(false, 'packer: bad STORE_BLOB/STORE_CONTENT');
        }
      } else if (store === _common.STORE_LINKS) {
        if (Array.isArray(_value)) {
          var buffer = Buffer.from((0, _stringify2.default)(_value));
          stripes.push({ snap: snap, store: store, buffer: buffer });
        } else {
          (0, _assert2.default)(false, 'packer: bad STORE_LINKS');
        }
      } else if (store === _common.STORE_STAT) {
        if ((typeof _value === 'undefined' ? 'undefined' : (0, _typeof3.default)(_value)) === 'object') {
          // reproducible
          delete _value.atime;
          delete _value.atimeMs;
          delete _value.mtime;
          delete _value.mtimeMs;
          delete _value.ctime;
          delete _value.ctimeMs;
          delete _value.birthtime;
          delete _value.birthtimeMs;
          // non-date
          delete _value.blksize;
          delete _value.blocks;
          delete _value.dev;
          delete _value.gid;
          delete _value.ino;
          delete _value.nlink;
          delete _value.rdev;
          delete _value.uid;
          if (!_value.isFile()) _value.size = 0;
          // portable
          var newStat = (0, _assign2.default)({}, _value);
          newStat.isFileValue = _value.isFile();
          newStat.isDirectoryValue = _value.isDirectory();
          var _buffer = Buffer.from((0, _stringify2.default)(newStat));
          stripes.push({ snap: snap, store: store, buffer: _buffer });
        } else {
          (0, _assert2.default)(false, 'packer: bad STORE_STAT');
        }
      } else {
        (0, _assert2.default)(false, 'packer: unknown store');
      }
    }

    if (record[_common.STORE_CONTENT]) {
      var disclosed = (0, _common.isDotJS)(file) || (0, _common.isDotJSON)(file);
      _log.log.debug(disclosed ? 'The file was included as DISCLOSED code (with sources)' : 'The file was included as asset content', file);
    } else if (record[_common.STORE_BLOB]) {
      _log.log.debug('The file was included as bytecode (no sources)', file);
    } else if (record[_common.STORE_LINKS]) {
      var value = record[_common.STORE_LINKS];
      _log.log.debug('The directory files list was included (' + itemsToText(value) + ')', file);
    }
  }

  var prelude = 'return (function (REQUIRE_COMMON, VIRTUAL_FILESYSTEM, DEFAULT_ENTRYPOINT) { ' + bootstrapText + '\n})(function (exports) {\n' + commonText + '\n},\n' + '%VIRTUAL_FILESYSTEM%' + '\n,\n' + '%DEFAULT_ENTRYPOINT%' + '\n);';

  return { prelude: prelude, entrypoint: entrypoint, stripes: stripes };
};

var _common = require('../prelude/common.js');

var _log = require('./log.js');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _package = require('../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bootstrapText = _fsExtra2.default.readFileSync(require.resolve('../prelude/bootstrap.js'), 'utf8').replace('%VERSION%', _package.version); /* eslint-disable complexity */

var commonText = _fsExtra2.default.readFileSync(require.resolve('../prelude/common.js'), 'utf8');

function itemsToText(items) {
  var len = items.length;
  return len.toString() + (len % 10 === 1 ? ' item' : ' items');
}

function hasAnyStore(record) {
  // discarded records like native addons
  var _arr = [_common.STORE_BLOB, _common.STORE_CONTENT, _common.STORE_LINKS, _common.STORE_STAT];
  for (var _i = 0; _i < _arr.length; _i++) {
    var store = _arr[_i];
    if (record[store]) return true;
  }
  return false;
}