"use strict";

const path = require("path");
const fs = require("fs");

module.exports = (BeshConfigManager) => {
  return class SampleConfigManager extends BeshConfigManager {
    constructor(cmdLineArgs) {
      super(cmdLineArgs);
    } 

    async loadConfig() {
      let config = this.cmdLineArgs[BeshConfigManager.CFG_CONFIG];

      if (typeof config !== "string" || !config) {
        throw new Error("No config file specified!");
      }

      // Check if the config file has an absolute or relative path
      if (path.isAbsolute(config)) {
        if (!fs.existsSync(config)) {
          throw new Error(`Can not find file ${config}`);
        }
      } else {
        let fullName = path.resolve(process.cwd(), config);

        if (!fs.existsSync(config)) {
          throw new Error(
            `Can not find file ${config} in cwd ${process.cwd()}`);      
        }

        config = path.resolve(process.cwd(), config);
      }

      // Only handle JSON
      this.cache = require(config);
    }
  }
}
