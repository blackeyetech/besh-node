"use strict";

// Config consts
const CFG_ENABLED = "enabled";
const CFG_ENABLED_DEFAULT = true;

let BapError = require("./bap-error.js");
let BapStats = require("./bap-stats.js");
let BapStatus = require("./bap-status.js");

let privates = new WeakMap();

class Bap {
  constructor(name) {
    if (name === undefined) {
      throw new BapError("Bap: No name provided");
    }

    let mine = {};
    privates.set(this, mine);

    mine.name = name;

    // Setup configuration helpers
    this.getCfg = besh.config.get.bind(besh.config, `baps/${name}`);

    // Create a logger for this BAP
    this.log = besh.newLogger(name, besh.log.level);

    mine.stats = new BapStats(name);
    mine.statusOK = new BapStatus(BapStatus.statusOK, "OK", name);

    mine.enabled = this.getCfg(CFG_ENABLED, CFG_ENABLED_DEFAULT);
    if (mine.enabled) {
      this.log.info("This Bap is enabled")
    } else {
      this.log.info("This Bap is disabled!")
    }
  }

  // Make sure start()/stop() method have been defined
  async start() {
    throw this.Error("No method 'start' defined");
  }

  async stop() {
    throw this.Error("No method 'stop' defined");
  }

  getRequiredCfg(path) {
    let cfg = this.getCfg(path);

    if (cfg === undefined || cfg === "") {
      throw this.Error(`Configuration setting (${path}) is required`);
    }

    return cfg;
  }

  getRequiredBap(name) {
    let bap = besh.getBap(name);

    if (bap === undefined) {
      throw this.Error(`Can not find Bap (${name})`);
    }

    return bap;
  }

  get name() {
    let mine = privates.get(this);
    return mine.name;    
  }

  get enabled() {
    let mine = privates.get(this);
    return mine.enabled;    
  }

  get stats() {
    let mine = privates.get(this);
    return mine.stats;
  }

  get statusOK() {
    let mine = privates.get(this);
    return mine.statusOK;
  }

  // Default status unless it is overridden
  async status() {
    return this.statusOK;
  }

  Error(msg) {
    let e = new BapError(msg);
    this.log.error(e);
    
    return e;
  }

  Status(statusCode, msg) {
    return new BapStatus(statusCode, msg, this.name);
  }
}

module.exports = { Bap, BapError, BapStatus, BapStats };
