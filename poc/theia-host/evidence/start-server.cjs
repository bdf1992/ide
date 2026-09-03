process.chdir(__dirname + '/../browser-app');
process.argv = [process.argv[0], 'theia.js', 'start', '--hostname=127.0.0.1', '--port=3033'];
require(__dirname + '/../node_modules/@theia/cli/bin/theia.js');
