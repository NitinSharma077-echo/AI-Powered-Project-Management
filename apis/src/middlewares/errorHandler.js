function errorhandler(err, req, res, next){
    if(res.headersSent){
        return next(err);
    }

    if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map(item => item.message)
    });
  }

    // A malformed id (e.g. /api/projects/abc) is a bad request, not a crash.
    if (err.name === "CastError") {
      return res.status(400).json({
        error: `Invalid value for '${err.path}'.`
      });
    }

    // Unique index violations surface as a conflict.
    if (err.code === 11000) {
      return res.status(409).json({
        error: "That record already exists."
      });
    }

    const statusCode = err.statusCode || 500;

    if (statusCode >= 500) {
      console.error(err);
    }

    // HttpError messages are written for users (e.g. "Unable to connect to
    // the AI service."), so show them even for 5xx. Unexpected errors keep
    // the generic text so internals never leak.
    const expose = err.name === "HttpError" || statusCode < 500;

    return res.status(statusCode).json({
    error: expose ? err.message : "Internal server error"
  });
}

module.exports = errorhandler;
