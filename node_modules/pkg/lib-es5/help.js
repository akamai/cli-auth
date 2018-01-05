'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = help;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function help() {
  console.log('\n  ' + _chalk2.default.bold('pkg') + ' [options] <input>\n\n  ' + _chalk2.default.dim('Options:') + '\n\n    -h, --help       output usage information\n    -v, --version    output pkg version\n    -t, --targets    comma-separated list of targets (see examples)\n    -c, --config     package.json or any json file with top-level config\n    --options        bake v8 options into executable to run with them on\n    -o, --output     output file name or template for several files\n    --out-path       path to save output one or more executables\n    -d, --debug      show more information during packaging process [off]\n    -b, --build      don\'t download prebuilt base binaries, build them\n    --public         speed up and disclose the sources of top-level project\n\n  ' + _chalk2.default.dim('Examples:') + '\n\n  ' + _chalk2.default.gray('–') + ' Makes executables for Linux, macOS and Windows\n    ' + _chalk2.default.cyan('$ pkg index.js') + '\n  ' + _chalk2.default.gray('–') + ' Takes package.json from cwd and follows \'bin\' entry\n    ' + _chalk2.default.cyan('$ pkg .') + '\n  ' + _chalk2.default.gray('–') + ' Makes executable for particular target machine\n    ' + _chalk2.default.cyan('$ pkg -t node6-alpine-x64 index.js') + '\n  ' + _chalk2.default.gray('–') + ' Makes executables for target machines of your choice\n    ' + _chalk2.default.cyan('$ pkg -t node4-linux,node6-linux,node6-win index.js') + '\n  ' + _chalk2.default.gray('–') + ' Bakes \'--expose-gc\' into executable\n    ' + _chalk2.default.cyan('$ pkg --options expose-gc index.js') + '\n\n');
}