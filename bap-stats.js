"use strict";

// For private data
let privates = new WeakMap();

class BapStats {
  constructor(bapName) {
    let mine = {
      bapName: bapName,
      lastUpdate: Date.now(),
      stats: new Map(),
      lastStats: new Map()
    };

    privates.set(this, mine);
  }

  get bapName() {
    let mine = privates.get(this);
    return mine.bapName;
  }

  get lastUpdate() {
    let mine = privates.get(this);
    return mine.lastUpdate;
  }

  add(name) {
    let mine = privates.get(this);
    mine.stats.set(name, 0);
    mine.lastStats.set(name, 0);
  }

  increment(name, incr) {
    if (name === undefined) {
      return;
    }

    let mine = privates.get(this);

    if (typeof incr !== "number") {
      incr = 1;
    }

    let value = mine.stats.get(name);

    // The stat does not exist so add it
    if (value === undefined) {
      this.add(name);

      value = 0;
    }

    mine.stats.set(name, value + incr);
  }

  decrement(name, decr) {
    if (typeof decr !== "number") {
      decr = -1;
    } else {
      decr *= -1;
    }

    this.increment(name, decr);
  }

  get(updateNow) {
    let mine = privates.get(this);

    // Check if any stats have been added
    if (mine.stats.size === 0) {
      return null;
    }

    let details = {
      bap: mine.bapName,
      lastUpdate: mine.lastUpdate,
      stats: {}
    };

    if (updateNow !== undefined) {
      mine.lastUpdate = updateNow;
    }

    mine.stats.forEach((value, name) => {
      let lastValue = mine.lastStats.get(name);
      
      if (updateNow !== undefined) {
        mine.lastStats.set(name, value);
      }

      details.stats[name] = {
        currentValue: value,
        lastValue: lastValue,
        change: value - lastValue
      };
    });

    return details;
  }
}

module.exports = BapStats;
