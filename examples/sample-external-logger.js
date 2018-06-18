// Log levels. NOTE: Opposite direction to besh-loggers
const LOG_FATAL = 10;
const LOG_ERROR = 20;
const LOG_WARN = 30;
const LOG_QUIET = 100;
const LOG_INFO = 200;
const LOG_DEBUG = 300;
const LOG_TRACE = 400;

class ExternalLoggerNotforked extends besh.BeshLogger {
  constructor(name) {
    super(name);
  }

  setLevel(level) {
    if (level !== undefined) {
      this.level = level;
    } else if (besh.config.get(besh.BeshLogger.CFG_QUIET) === true) {
      this.level = LOG_QUIET;
    } else if (besh.config.get(besh.BeshLogger.CFG_TRACE) === true) {
      this.level = LOG_TRACE;
    } else if (besh.config.get(besh.BeshLogger.CFG_DEBUG) === true) {
      this.level = LOG_DEBUG;
    } else {
      this.level = LOG_INFO;
    }
  }

  fatal(...args) {
    args[0] = `FATAL: (sample) ${this.name}: ${args[0]}`;
    console.error(...args);
  }

  error(...args) {
    args[0] = `ERROR: (sample) ${this.name}: ${args[0]}`;
    console.error(...args);
  }

  warn(...args) {
    args[0] = `WARN: (sample) ${this.name}: ${args[0]}`;
    console.warn(...args);
  }

  info(...args) {
    if (this.level >= LOG_INFO) {
      args[0] = `INFO: (sample) ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.level >= LOG_DEBUG) {
      args[0] = `DEBUG: (sample) ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  trace(...args) {
    if (this.level >= LOG_TRACE) {
      args[0] = `TRACE: (sample) ${this.name}: ${args[0]}`;
      console.info(...args);
    }
  }

  childLogger(name) {
    return new ExternalLoggerNotforked(name);
  }

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
}

module.exports = ExternalLoggerNotforked;
