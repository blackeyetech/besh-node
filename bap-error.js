"use strict";

class BapError extends Error {
  constructor(msg) {
    super(msg);
  }
}

module.exports = BapError;
