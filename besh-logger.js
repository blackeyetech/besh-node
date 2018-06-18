// Config consts
const CFG_DEBUG = "debug";
const CFG_TRACE = "trace";
const CFG_QUIET = "quiet";
const CFG_SILENT_STARTUP = "silent-startup";

// Log levels
const LOG_FATAL = 400;
const LOG_ERROR = 300;
const LOG_WARN = 200;
const LOG_QUIET = 100;
const LOG_INFO = 30;
const LOG_DEBUG = 20;
const LOG_TRACE = 10;

class BeshLogger {
	constructor(name) {
	  this.name = name;
    this.setLevel();
	}

  fatal(...args) {
    args[0] = `FATAL: ${this.name}: ${args[0]}`;
    console.error(...args);
  }

  error(...args) {
    args[0] = `ERROR: ${this.name}: ${args[0]}`;
    console.error(...args);
  }

  warn(...args) {
    args[0] = `WARN: ${this.name}: ${args[0]}`;
    console.warn(...args);
  }

  info(...args) {
    if (this.level <= LOG_INFO) {
      args[0] = `INFO: ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.level <= LOG_DEBUG) {
      args[0] = `DEBUG: ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  trace(...args) {
    if (this.level <= LOG_TRACE) {
      args[0] = `TRACE: ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  setLevel(level) {
    if (level !== undefined) {
      this.level = level;
    } else if (besh.config.get(CFG_QUIET) === true) {
      this.level = LOG_QUIET;
    } else if (besh.config.get(CFG_TRACE) === true) {
      this.level = LOG_TRACE;
    } else if (besh.config.get(CFG_DEBUG) === true) {
      this.level = LOG_DEBUG;
    } else {
      this.level = LOG_INFO;
    }
  }

  childLogger(name) {
    // There is no children for the console so create new Logger
    return new BeshLogger(name);
  }

  async flush() {}

  async close() {}

  get FATAL_LEVEL() {
    return LOG_FATAL;
  }

  get ERROR_LEVEL() {
    return LOG_ERROR;
  }

  get WARN_LEVEL() {
    return LOG_WARN;
  }

  get QUIET_LEVEL() {
    return LOG_QUIET;
  }

  get INFO_LEVEL() {
  	return LOG_INFO;
  }

  get DEBUG_LEVEL() {
  	return LOG_DEBUG;
  }

  get TRACE_LEVEL() {
  	return LOG_TRACE;
  }

  static get CFG_QUIET() {
    return CFG_QUIET;
  }

  static get CFG_TRACE() {
    return CFG_TRACE;
  }

  static get CFG_DEBUG() {
    return CFG_DEBUG;
  }

  static get CFG_SILENT_STARTUP() {
    return CFG_SILENT_STARTUP;
  }
}

module.exports = BeshLogger;
