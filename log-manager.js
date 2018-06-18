const BeshLogger = require("./besh-logger.js");
const path = require("path");
const fs = require("fs");

// Config consts
const CFG_ROOT = "/logger";

const CFG_NAME = "name";
const CFG_NAME_DEFAULT = "besh-logger";
const CFG_ONE_LOGGER = "one-logger";
const CFG_ONE_LOGGER_DEFAULT = true;

class LogManager {
  constructor() {
    this.loggerList = [];

    let loggerName = besh.config.get(CFG_ROOT, CFG_NAME, CFG_NAME_DEFAULT);

    this.oneLogger = besh.config.get(
      CFG_ROOT, CFG_ONE_LOGGER, CFG_ONE_LOGGER_DEFAULT);
    this.theOneLogger = null;
    this.LoggerClass = BeshLogger;

    if (loggerName !== CFG_NAME_DEFAULT) {
      try {
        this.LoggerClass = besh.require(loggerName);
      } catch (e) {
        console.log(e)
        throw new Error(`Can not find logger '${loggerName}'`);        
      }
    }
  }

  newLogger(name, level) {
    let logger;

    if (!this.oneLogger) {
      logger = new this.LoggerClass(name);
    } else if (this.theOneLogger === null) {
      logger = this.theOneLogger = new this.LoggerClass(name);
    } else {
      logger = this.theOneLogger.childLogger(name);
    }

    if (level !== undefined) {
      logger.setLevel(level);
    }

    this.loggerList.push(logger);

    return logger;
  }

  setLevel(level) {
    for (let logger of this.loggerList) {
      logger.setLevel(level);
    }
  }
}

module.exports = LogManager;
