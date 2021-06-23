// Opted to use the default node fork since the implementation is simple.
const childProcess = require('child_process');

const COLORS = {
  green: '\x1b[32m%s\x1b[0m',
  purple: '\x1b[34m%s\x1b[0m',
  pink: '\x1b[35m%s\x1b[0m',
  error: '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m',
  info: '\x1b[47m\x1b[30m%s\x1b[0m',
};

function startChildProcess(config) {
  return childProcess.fork(
    config.path,
    config.args || [],
    config.options || {}
  );
}

function stopAllChildProcesses(processMap) {
  Object.keys(processMap).forEach(function(key) {
    processMap[key].task.kill('SIGTERM');
    processMap[key].logger('Stopping');
  });
}

const cleanPipe = data => {
  return data
    .toString()
    .split('\n')
    .filter(line => line.length > 0);
};

function formatStdout(config) {
  return function(data) {
    if (typeof data !== 'string') {
      const santizied = cleanPipe(data);
      santizied.forEach(line => {
        console.log(config.color, `[${config.name}]:`, line);
      });
    } else {
      console.log(config.color, `[${config.name}]:`, data);
    }
  };
}

function formatStderr(config) {
  return function(data) {
    if (!config.logErrors) return;

    if (typeof data !== 'string') {
      const santizied = cleanPipe(data);
      santizied.forEach(line => {
        console.log(COLORS.error, `[${config.name}]:`, line);
      });
    } else {
      console.log(COLORS.error, `[${config.name}]:`, data);
    }
  };
}

module.exports = {
  COLORS,
  startChildProcess,
  stopAllChildProcesses,
  formatStderr,
  formatStdout,
};
