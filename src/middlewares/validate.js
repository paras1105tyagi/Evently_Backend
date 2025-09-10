"use strict";

function validate(schema) {
  return (req, res, next) => {
    const data = {
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
    };
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json({
          error: "Validation failed",
          details: error.details.map((d) => d.message),
        });
    }
    req.validated = value;
    next();
  };
}

module.exports = validate;
