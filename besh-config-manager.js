"use strict";

const CFG_CFG_MANAGER = "cfg-man";
const CFG_CONFIG = "config";
const CFG_ENV_VAR_CONFIG = "BESH_CONFIG";
const lodashMerge = require("lodash.merge");

const jsYaml = require("js-yaml");
const path = require("path");
const fs = require("fs");

class BeshConfigManager {
  constructor(cmdLineArgs) {
    this.cache = {};
    this.cmdLineArgs = cmdLineArgs;
  } 

  // NOTE: This does not need to be async but another type of manager 
  // may require it
  async loadConfig() {
    let config = this.cmdLineArgs[CFG_CONFIG];

    if (typeof config === "undefined" || config === "") {
      // Check if the config file was speccified via an env var
      config = process.env[CFG_ENV_VAR_CONFIG];
    }

    if (typeof config === "string" && config !== "") {
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

      let ext = path.extname(config);

      if (ext === ".json") {
        this.cache = require(config);
      } else if (ext === ".yml" || ext === ".yaml") {
        let conf = jsYaml.safeLoad(fs.readFileSync(config, 'utf8'));
        this.cache = conf;
      }
    }
    
    // Now override any configuration setting passed on command line
    lodashMerge(this.cache, this.cmdLineArgs);
  }

  get(root="/", path="/", defaultVal) {
    // If the root and the path are "/" then the user wants 
    // the whole config cache
    if (root === "/" && path === "/") {
      return this.cache;
    }

    if (typeof root !== "string" || typeof path !== "string") {
      return null;
    }

    // Strip off any leading or trailing '/'s
    root = root.replace(/^\/+/, "").replace(/\/+$/, "");
    path = path.replace(/^\/+/, "").replace(/\/+$/, "");
    path = `${root}/${path}`;

    // Strip off any leading or trailing '/'s (root or path may be blank)
    path = path.replace(/^\/+/, "").replace(/\/+$/, "");

    // Split the path up and iterate through the embedded objects until 
    // we find what we are looking for in the config cache
    let cfg = path.split("/").reduce((obj, prop) => {
      return obj === undefined ? undefined : obj[prop];
    }, this.cache);

    // Since an empty string would normally not be a valid value we will 
    // assume the config paramter is not set 
    if (cfg === "") {
      cfg = undefined;
    }

    // Figure out if we are returning defaultVal or not
    return cfg === undefined ? defaultVal : cfg;
  }

  static get CFG_CFG_MANAGER() {
    return CFG_CFG_MANAGER;
  }

  static get CFG_CONFIG() {
    return CFG_CONFIG;
  }
}

module.exports = BeshConfigManager;
