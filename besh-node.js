#!/usr/bin/env node

"use strict";

// This is to ensure we can tell if besh-node was required are executed
if (require.main !== module) {
  global.beshRequired = true;
}

// config consts and defaults
const CFG_ROOT = "/";
const CFG_APP_ROOT = "/app";
const CFG_CONTROL_SHUTDOWN = "control-shutdown";
const CFG_CONTROL_SHUTDOWN_DEFAULT = true;
const CFG_CATCH_REJECTIONS = "catch-rejections";
const CFG_CATCH_REJECTIONS_DEFAULT = false;

const CFG_STATS_BAP = "stats";
const CFG_STATS_BAP_DEFAULT = "stats";
const CFG_STATUS_BAP = "status";
const CFG_STATUS_BAP_DEFAULT = "status";

const CFG_BAPS = "baps";
const CFG_BAP_BAP = "bap";
const CFG_BAP_ENABLED = "enabled";

const NODE_ENV = process.env.NODE_ENV === undefined ? 
      "development" : 
      process.env.NODE_ENV;

const version = require("./package.json").version;

const BeshError = require("./besh-error.js");
const BeshConfigManager = require("./besh-config-manager.js");
const BeshLogger = require("./besh-logger.js");

const LogManager = require(`./log-manager.js`);

const { Bap, BapError, BapStats, BapStatus } = require("./bap.js");
const HttpServerBap = require("./base-baps/http-server-bap.js");
const { DataStoreBap, DataStoreBapConn, DataStoreBapConnError } = 
  require("./base-baps/data-store-bap.js");

const path = require("path");
const fs = require("fs");

const { config, app, appReal, appDir } = require("./configuration.js");

// Add config to enable this event handler
process.on("unhandledRejection", e => { console.log(e) });

function setupShutdownHandlers() {
  besh.log.info("Setting up event handler for SIGINT and SIGTERM");

  process.on('exit', async function() {
    // Let's make sure to check for the use case of no events pending so the 
    // besh app closes without a terminate event
    if (started) {
      await besh.stopBaps();
    }
  });

  process.on("SIGINT", () => {
    besh.terminate().catch((e) => {
      if (!(e instanceof BeshError || e instanceof BapError)) {
        besh.log.error(e);
      }

      besh.log.warn("We've had a problem, shutting anyway. Goodbye!");
      process.exit(); 
    });
  });

  process.on("SIGTERM", () => {
    besh.terminate().catch((e) => {
      if (!(e instanceof BeshError || e instanceof BapError)) {
        besh.log.error(e);
      }

      besh.log.warn("We've had a problem, shutting anyway. Goodbye!");
      process.exit(); 
    });
  });
}

async function startBaps() {
  log.info("Starting Baps ...");

  const baps = config.get(CFG_BAPS);

  if (typeof baps !== "object") {
    return;
    // throw new BeshError(`Configuration setting (baps) is required`);
  }

  if (Object.keys(baps).length === 0) {
    return;
    // throw new BeshError("There are no baps defined");
  }

  // Start the Baps in the order they appear in the config
  for (let name in baps) {
    let bap = baps[name];

    if (bapsStarted.includes(name)) {
      log.warn(`Bap (${name}) already started!`);
      continue;
    }

    if (typeof bap[CFG_BAP_ENABLED] === "boolean" && !bap[CFG_BAP_ENABLED]) {
      log.info(`Not starting disabled Bap (${name})`);
      continue;
    }

    let BapClass = besh.require(bap[CFG_BAP_BAP]);
    if (BapClass === null) {
      throw new BeshError(`Can not find bap ${bap[CFG_BAP_BAP]}`);
    }

    if (!(BapClass.prototype instanceof Bap)) {
      let msg = `(${JSON.stringify(BapClass)}) not a Bap object`;
      throw new BeshError(msg);
    }

    let bapObj = new BapClass(name);

    bapMap.set(name, bapObj);
    bapList.push(bapObj);
  }

  for (let [name, bap] of bapMap) {
    log.info(`Starting Bap (${name})`);
    await bap.start().catch(async (e) => {
      if (!(e instanceof BapError)) {
        log.error(e);
      }
      
      await besh.terminate();
    });

    bapsStarted.push(name);
  }

  log.info("Finished starting Baps");
  log.info("Baps started: %j", bapsStarted);
}

let started = false;
let bapMap = new Map();
let bapsStarted = [];
let bapList = [];
let log;
let logManager;
let silentStartup;
let appLog;
let appGetCfg;

global.besh = {
  async start() {
    if (started) {
      throw new BeshError("besh is started!");
    }

    await config.loadConfig();

    logManager = new LogManager();
    log = logManager.newLogger("besh");

    silentStartup = config.get(CFG_ROOT, BeshLogger.CFG_SILENT_STARTUP);

    if (silentStartup) {
      logManager.setLevel(log.WARN_LEVEL);
    }

    log.info(`besh Version (${besh.version})`);
    log.info(`NODE_ENV (${NODE_ENV})`);

    if (typeof app === "string") {
      log.info("Application (%s)", app);
      if (app !== appReal) {
        log.info("Real Application (%s)", appReal);
      }
      log.info("Application directory (%s)", appDir);
    } else {
      log.info("No app specified");
    }

    let controlShutdown = 
      config.get(CFG_ROOT, CFG_CONTROL_SHUTDOWN, CFG_CONTROL_SHUTDOWN_DEFAULT);

    if (controlShutdown) {
      setupShutdownHandlers();
    }

    await startBaps();

    // If there was a silent startup then reset the log level now
    if (silentStartup) {
      logManager.setLevel();
    }

    if (app !== null) {
      // Setup configuration helpers
      appGetCfg = besh.config.get.bind(besh.config, CFG_APP_ROOT);
      appLog = logManager.newLogger("app");

      require(app);
    }

    // Send this signal to indicate to your process manager we are up and 
    // started, e.g. PM2
    if (process.send !== undefined) {
      process.send("ready");
    }

    started = true;

    log.info("Now started ...");
  },

  async stopBaps() {
    // Check if we have started or maybe failed in startup but 
    // some Baps have been started
    if (!started && bapsStarted.length === 0) {
      throw new BeshError("besh has not been started!");
    }

    // A silent startup implies a silent shutdown!
    if (silentStartup) {
      logManager.setLevel(log.WARN_LEVEL);
    }

    log.info("Stopping all Baps ...");

    // Stop the Baps in the reverse order they were started
    for (let bapName of bapsStarted.reverse()) {
      log.info(`Stopping Bap (${bapName})`);
      let bap = bapMap.get(bapName);
      await bap.stop();
      await bap.log.close();
    }

    bapsStarted = [];

    log.info("Finished stopping all Baps");

    started = false;

    // If there was a silent shutdown then reset the log level now
    if (silentStartup) {
      logManager.setLevel();
    }
  },

  async terminate() {
    await this.stopBaps();

    log.info("Terminating now. Goodbye!");
    await log.close();

    process.exit(); 
  },

  getBap(name) {
    return bapMap.get(name);
  },

  getBapList() {
    return bapList;
  },

  newLogger(name, level) { 
    return logManager.newLogger(name, level); 
  },

  requireLog(msg) {    
    if (log === undefined) {
      // This wil happen when looking for the logger. Only log this if
      // --debug has been passed
      if (config.get(CFG_ROOT, BeshLogger.CFG_DEBUG, false)) {
        console.log(msg);
      }
    } else {
      log.debug(msg);
    }
  },

  require(mod) {
    // Check first in the applications node_modules
    if (appDir !== null) {
      let checkReq = path.resolve(appDir, "node_modules", mod);

      try {
        let required = require(checkReq);
        this.requireLog(`${mod} found in ${checkReq}`);
        return required;        

      } catch(e) {
        this.requireLog(`${mod} not found in ${checkReq}`);
      }

      checkReq = path.resolve(appDir, mod);

      try {
        let required = require(checkReq);
        this.requireLog(`${mod} found in ${checkReq}`);
        return required;        

      } catch(e) {
        this.requireLog(`${mod} not found in ${checkReq}`);
      }
    }

    // Now check in the current node_modules path (of besh-node)
    try {
      let required = require(mod);
      this.requireLog(`${mod} found in besh-node`);
      return required;        

    } catch(e) {
      this.requireLog(`${mod} not found in besh-node`);
    }

    return null;
  },
  
  get required() { return require.main !== module; },

  get executed() { return require.main === module; },

  get NODE_ENV() { return NODE_ENV; },

  get app() { return app; },

  get appModules() { return appModules; },

  get appLog() { return appLog; },

  get appGetCfg() { return appGetCfg; },

  get config() { return config; },

  get log() { return log; },

  get version() { return version; },

  get BeshError() { return BeshError; },

  get Bap() { return Bap; },

  get BeshLogger() { return BeshLogger; },

  get BapError() { return BapError; },

  get BapStats() { return BapStats; },

  get BapStatus() { return BapStatus; },

  get DataStoreBap() { return DataStoreBap; },

  get DataStoreBapConn() { return DataStoreBapConn; },

  get DataStoreBapConnError() { return DataStoreBapConnError; },

  get HttpServerBap() { return HttpServerBap; }
};

// Check if we are being executed and not required 
if (besh.executed) {
  async function startBesh() {
    await besh.start()
      .catch((e) => {
        console.log(e);
        if (!(e instanceof BeshError || 
              e instanceof BapError)) {
          // besh.log.error(e);
          throw e;
        }     

        log.error("Failed to start!");
        throw e;
      });
  }

  startBesh();
}

module.exports = besh;
