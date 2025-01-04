const { match } = require("path-to-regexp");
const http = require("http");

function svrrouter() {
  const routes = [];
  const router = (req, res, logFacilities, config, next) => {
    let index = 0;
    let previousReqParams = req.params;
    let previousReqSvrouterBase = req.svrrouterBase;
    let paramsPresent = false;
    let passPathPresent = false;

    const nextRoute = () => {
      if (paramsPresent) req.params = previousReqParams;
      if (passPathPresent) req.svrrouterBase = previousReqSvrouterBase;
      let currentRoute = routes[index++];
      let currentMatch =
        currentRoute && currentRoute.pathFunction
          ? currentRoute.pathFunction(
              req.parsedURL.pathname.substring(
                (req.svrrouterBase ? req.svrrouterBase : "").length
              )
            )
          : false; // Let's assume the request URL begins with the contents of the req.svrrouterBase property.
      while (
        currentRoute &&
        ((currentRoute.method && req.method != currentRoute.method) ||
          !currentMatch)
      ) {
        currentRoute = routes[index++];
        currentMatch =
          currentRoute && currentRoute.pathFunction
            ? currentRoute.pathFunction(
                req.parsedURL.pathname.substring(
                  (req.svrrouterBase ? req.svrrouterBase : "").length
                )
              )
            : false;
      }
      if (currentRoute && currentRoute.callback) {
        try {
          paramsPresent = Boolean(currentMatch.params);
          passPathPresent = Boolean(currentRoute.passPath);
          if (paramsPresent)
            req.params =
              currentMatch && currentMatch.params
                ? currentMatch.params
                : Object.create(null);
          if (passPathPresent)
            req.svrrouterBase =
              (req.svrrouterBase ? req.svrrouterBase : "") +
              currentRoute.passPath;
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
      callback: callback,
      passPath: null
    });

    return router;
  };

  const passRoute = (path, callback) => {
    const realCallback = callback ? callback : path;
    if (typeof realCallback !== "function") {
      throw new Error("The passed callback must be a function.");
    } else if (callback && typeof path !== "string") {
      throw new Error("The path must be a string.");
    }
    const realPath = callback ? path.replace(/\/+$/, "") : "";

    routes.push({
      method: null,
      pathFunction: realPath // If there is "/" path parameter, then the realPath variable will be "", which means that the pass-through will occur for all requests
        ? (checkedPath) =>
            checkedPath == realPath ||
            checkedPath.substring(0, realPath.length + 1) == realPath + "/"
              ? {
                  path: checkedPath,
                  params: null
                }
              : false
        : () => true,
      callback: realCallback,
      passPath: realPath
    });

    return router;
  };

  const passExpressRouterMiddleware = (path, middleware) => {
    const realMiddleware = middleware ? middleware : path;
    if (typeof realMiddleware !== "function") {
      throw new Error("The passed middleware must be a function.");
    } else if (middleware && typeof path !== "string") {
      throw new Error("The path must be a string.");
    }
    const realPath = middleware ? path.replace(/\/+$/, "") : "";

    const callback = (req, res, logFacilities, config, next) => {
      const previousReqBaseUrl = req.baseUrl;
      const previousReqUrl = req.url;
      const previousReqOriginalUrl = req.originalUrl;
      const previousReqSvrouterBase = req.svrrouterBase;

      const svrrouterBase = req.svrrouterBase ? req.svrrouterBase : "";
      req.baseUrl = svrrouterBase;
      req.originalUrl = req.url;
      req.url = req.url.substr(svrrouterBase.length); // Let's assume the request URL begins with the contents of svrrouterBase variable.
      if (!req.url) req.url = "/";
      req.svrrouterBase = undefined;

      const nextCallback = () => {
        req.baseUrl = previousReqBaseUrl;
        req.url = previousReqUrl;
        req.originalUrl = previousReqOriginalUrl;
        req.svrrouterBase = previousReqSvrouterBase;
        next();
      };

      realMiddleware(req, res, nextCallback);
    };

    return passRoute(realPath, callback);
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
  router.passExpressRouterMiddleware = passExpressRouterMiddleware;

  return router;
}

module.exports = svrrouter;
