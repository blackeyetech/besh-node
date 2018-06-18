"use strict";

const CONST_STATUS_OK = 0;

class BapStatus {
  constructor(status, msg, name) {
    this.status = status;
    this.msg = msg;
    this.name = name;
  }

  healthy(){
    return this.status === CONST_STATUS_OK ? true : false;
  }

  unhealthy(){
    return this.status !== CONST_STATUS_OK ? true : false;
  }

  static get statusOK(){
    return CONST_STATUS_OK;
  }
}

module.exports = BapStatus;