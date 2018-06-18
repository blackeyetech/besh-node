const BeshConfigManager = require("./besh-config-manager.js");
const BeshLogger = require("./besh-logger.js");
const yargsParser = require("yargs-parser");
const path = require("path");
const fs = require("fs");

const yargsOptions = {
  configuration: {
    "camel-case-expansion": false,
  },
  string: [
    BeshConfigManager.CFG_CFG_MANAGER
  ],
  boolean: [ 
   BeshLogger.CFG_SILENT_STARTUP,
   BeshLogger.CFG_QUIET, BeshLogger.CFG_TRACE, BeshLogger.CFG_DEBUG
  ],
  alias: {},
  default: {}
};

yargsOptions.alias[BeshLogger.CFG_SILENT_STARTUP] = "s";
yargsOptions.alias[BeshLogger.CFG_QUIET] = "q";
yargsOptions.alias[BeshLogger.CFG_TRACE] = "t";
yargsOptions.alias[BeshLogger.CFG_DEBUG] = "d";
yargsOptions.default[BeshLogger.CFG_QUIET] = false;
yargsOptions.default[BeshLogger.CFG_TRACE] = false
yargsOptions.default[BeshLogger.CFG_DEBUG] = false;
yargsOptions.default[BeshLogger.CFG_SILENT_STARTUP] = false;

// You can pass in command line parms via the env var 'CMD_LINE_ARGS'. These
// Take precedence over the actually command line
const parms = process.env.CMD_LINE_ARGS !== undefined ? 
              process.env.CMD_LINE_ARGS :
              process.argv;

let cmdLineArgs = yargsParser(parms, yargsOptions);

// Applications are specified on the command line 
// (always after node and besh-node)
let app = null;
let appReal = null;
let appDir = null;

if (global.beshRequired) {
  app = require.main.filename;
} else if (cmdLineArgs._.length > 2) {
  app = path.resolve(process.cwd(), cmdLineArgs._[2]);
}

if (app !== null) {
  appReal = fs.realpathSync(app);

  try {
    require.resolve(appReal);
  } catch (e) {
    throw new Error(`Can not find app ${app}`);
  }

  if (fs.lstatSync(appReal).isFile()) {
    appDir = path.dirname(appReal);
  } else {
    appDir = appReal;
  }
}

let configMan = cmdLineArgs[BeshConfigManager.CFG_CFG_MANAGER]
let ConfigClass = BeshConfigManager;

if (configMan !== undefined) {
  // Check first in the application's node_modules
  if (appDir !== null) {
    try {
      let man = path.resolve(appDir, "node_modules", configMan);
      ConfigClass = require(man)(BeshConfigManager);
    } catch(e) {
    }
  }

  if (ConfigClass === BeshConfigManager) {
    // Now check in the application's directory
    try {
      let man = path.resolve(appDir, configMan);
      ConfigClass = require(man)(BeshConfigManager);
    } catch(e) {
    }
  }

  if (ConfigClass === BeshConfigManager) {
    // Now check in the current node_modules path (of besh-node)
    try {
      ConfigClass = require(configMan)(BeshConfigManager);
    } catch(e) {
      throw new Error(`Can not find config manager '${configMan}'`)
    }
  }
}

let config = new ConfigClass(cmdLineArgs);

module.exports = { config, app, appReal, appDir };
