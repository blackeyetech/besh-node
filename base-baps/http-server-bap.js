"use strict";

const { Bap } = require("../bap.js");

const net = require("net");
const os = require("os");

// Config consts
const CFG_INTERFACE = "interface";
const CFG_INTERFACE_DEFAULT = "localhost";

class HttpServerBap extends Bap {
  constructor(name) {
    super(name);
  }

  getInterfaceIp() {
    let httpif = this.getCfg(CFG_INTERFACE, CFG_INTERFACE_DEFAULT);

    if (httpif === "localhost") {
      this.log.info(`Will listen on interface ${httpif}`);
      return httpif;
    }

    if (httpif === "127.0.0.1") {
      this.log.info(`Will listen on IP: ${httpif}`);
      return httpif;
    }

    if (net.isIP(httpif)) {
      // Check to make sure this is a valid interface IP
      let ifaces = os.networkInterfaces();
      this.log.debug("Interfaces on server are: %j", ifaces);
      
      let ip = "";
      Object.keys(ifaces).forEach((iface) => {
        ifaces[iface].forEach((i) => {
          if (i.address === httpif) {
            ip = httpif;
            this.log.info(`Will listen on IP: ${ip}`);
          }
        });
      });

      if (ip !== "") {
        return ip;
      }

      let msg = `${httpif} is not an interface on this server`;
      throw this.Error(msg);
    } 

    this.log.info(`Finding IP for interface (${httpif})`);

    let ifaces = os.networkInterfaces();
    this.log.debug("Interfaces on server are: %j", ifaces);

    if (ifaces[httpif] === undefined) {
      let msg = `${httpif} is not an interface on this server`;
      throw this.Error(msg);
    }

    ifaces[httpif].forEach((i) => {
      if (i.family === "IPv4") {
        let ip = i.address;
        this.log.info(`Found IP (${ip}) for interface ${httpif}`);
        this.log.info(`Will listen on interface ${httpif} (IP: ${ip})`);

        return ip;
      }
    });
  }
}

module.exports = HttpServerBap;
