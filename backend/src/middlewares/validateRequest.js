export const validateRequest = (schema) => {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(result.error);
    }

    req.validatedBody = result.data.body;
    req.validatedQuery = result.data.query;
    req.validatedParams = result.data.params;

    next();
  };
};
