"use strict";

const { Bap } = require("../bap.js");

class DataStoreBapConnError extends Error {
  constructor(msg, code, conn) {
    super(msg);
    conn.log.error(this);
  }
}

class DataStoreBapConn {
  constructor(log) {
    this.log = log;
  }

  create() {
    throw this.Error("No method 'create'");
  }

  read() {
    throw this.Error("No method 'read'");
  }

  update() {
    throw this.Error("No method 'update'");
  }

  delete() {
    throw this.Error("No method 'delete'");
  }

  query() {
    throw this.Error("No method 'query'");
  }

  exec() {
    throw this.Error("No method 'exec'");
  }

  connect() {
    throw this.Error("No method 'connect'");
  }

  release() {
    throw this.Error("No method 'release'");
  }

  begin() {
    throw this.Error("No method 'begin'");
  }

  commit() {
    throw this.Error("No method 'commit'");
  }

  rollback() {
    throw this.Error("No method 'rollback'");
  }

  Error(msg, code) {
    return new DataStoreBapConnError(msg, code, this);
  }
}

class DataStoreBap extends Bap {
  constructor(name) {
    super(name);
  }

  async connection() {
    throw this.Error("No method 'connection'");
  }
}

module.exports = { DataStoreBap, DataStoreBapConn, DataStoreBapConnError };
