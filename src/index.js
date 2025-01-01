const { match } = require("path-to-regexp");
const http = require("http");

function svrouter() {
  const routes = [];

  const router = (req, res, logFacilities, config, next) => {
    let index = 0;
    let previousReqParams = req.params;
    let paramsPresent = false;

    const nextRoute = () => {
      if (paramsPresent) req.params = previousReqParams;
      let currentRoute = routes[index++];
      let currentMatch =
        currentRoute && currentRoute.pathFunction
          ? currentRoute.pathFunction(req.parsedURL.pathname)
          : false;
      while (
        currentRoute &&
        ((currentRoute.method && req.method != currentRoute.method) ||
          !currentMatch)
      ) {
        currentRoute = routes[index++];
        currentMatch =
          currentRoute && currentRoute.pathFunction
            ? currentRoute.pathFunction(req.parsedURL.pathname)
            : false;
      }
      if (currentRoute && currentRoute.callback) {
        try {
          paramsPresent = Boolean(currentMatch.params);
          if (paramsPresent)
            req.params =
              currentMatch && currentMatch.params
                ? currentMatch.params
                : Object.create(null);
          currentRoute.callback(req, res, logFacilities, config, nextRoute);
        } catch (err) {
          res.error(500, err);
        }
      } else {
        next();
      }
    };

    nextRoute();
  };

  const addRoute = (method, path, callback) => {
    if (typeof method !== "string") {
      throw new Error("The HTTP method must be a string.");
    } else if (typeof path !== "string") {
      throw new Error("The route path must be a string.");
    } else if (typeof callback !== "function") {
      throw new Error("The route callback must be a function.");
    }

    routes.push({
      method: method === "*" ? null : method.toUpperCase(),
      pathFunction: match(path),
      callback: callback
    });

    return router;
  };

  const passRoute = (path, callback) => {
    const realCallback = callback ? callback : path;
    if (typeof realCallback !== "function") {
      throw new Error("The passed callback must be a function.");
    } else if (callback && typeof path !== "string") {
      throw new Error("The path must be a function");
    }

    routes.push({
      method: null,
      pathFunction: callback
        ? (checkedPath) =>
            checkedPath == path ||
            checkedPath.substring(0, path.length + 1) == path + "/"
              ? {
                  path: checkedPath,
                  params: null
                }
              : false
        : () => true,
      callback: realCallback
    });

    return router;
  };

  const methods = http.METHODS
    ? http.METHODS
    : ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

  methods.forEach((method) => {
    router[method.toLowerCase()] = (path, callback) =>
      addRoute(method, path, callback);
  });

  router.all = (path, callback) => addRoute("*", path, callback);
  router.route = addRoute;
  router.pass = passRoute;

  return router;
}

module.exports = svrouter;
