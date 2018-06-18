class BeshError extends Error {
  constructor(msg) {
    super(msg);

    besh.log.error(msg);
  }
}

module.exports = BeshError;
