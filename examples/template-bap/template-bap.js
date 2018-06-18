"use strict";

class TemplateBap extends besh.Bap {
  constructor(name) {
  super(name);

    this.log.info("Initialised");
  }

  async start() {
    this.log.info("Started");
  }

  async stop() {
    this.log.info("Stopped");
  }
}

// Use the same version as besh
TemplateBap.version = besh.version;

module.exports = TemplateBap;
