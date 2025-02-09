# SVRRouter

SVRRouter is a router library built for use in building web applications as SVR.JS 4.x mods.

Example SVR.JS mod that uses SVRRouter (you will need to install the `svrrouter` npm package either in the SVR.JS installation root or globally):

```js
const svrrouter = require("svrrouter");
const router = svrrouter();

// eslint-disable-next-line no-unused-vars
router.get("/hello", (req, res, logFacilities, config, next) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/plain"
  });
  res.write("Hello World!");
  res.end();
});

module.exports = router;

module.exports.modInfo = {
  name: "Example mod with SVRRouter",
  version: "0.0.0"
};
```

## Methods (exported by the `svrrouter` package)

### _svrrouter()_

Returns: the SVRRouter router, which is a SVR.JS mod function with additional functions for adding routes and middleware.

## Methods (provided by the SVRRouter router)

### _router(req, res, logFacilities, config, next)_

Parameters:
 - _req_ - the SVR.JS request object
 - _res_ - the SVR.JS response object
 - _logFacilities_ - the SVR.JS log facilities object
 - _config_ - the SVR.JS configuration object
 - _next_ - the callback which passes the execution to SVR.JS mods and SVR.JS internal handlers.

The function is a SVR.JS mod callback. You can read more about the SVR.JS mod callbacks in the [SVR.JS mod API documentation](https://svrjs.org/docs/api/svrjs-api).

### _router.route(method, path, callback)_

Parameters:
 - _method_ - the HTTP method, for which the route applies (_String_)
 - _path_ - the route path (begins with "/"), for which the route applies. The route paths are process via the [`path-to-regexp` library](https://www.npmjs.com/package/path-to-regexp) (_String_)
 - _callback_ - the SVR.JS mod callback applied for the route (_Function_)

Returns: the SVRRouter router (so that you can chain the methods for adding routes or pass-throughs)

The function adds a route to the SVRRouter router.

If the _method_ parameter is `"*"`, the route will apply to all the methods

The _callback_ parameter has these arguments of the SVR.JS mod callback:
 - _req_ - the SVR.JS request object
 - _res_ - the SVR.JS response object
 - _logFacilities_ - the SVR.JS log facilities object
 - _config_ - the SVR.JS configuration object
 - _next_ - the callback which passes the execution to other routes, SVR.JS mods and SVR.JS internal handlers.

The _req_ object has an additional _params_ property, which contains request parameters, for example if the request URL is `/api/task/1`, and the route path is `/api/task/:id`, then the _req.params_ object is a `null` prototype object with the `id` property set to `"1"`.

The _req_ object has another additional _svrrouterBase_ property, which contains the route base used internally by a SVRRouter router. It's not recommended to override this property, as doing it may result in a SVRRouter router behaving erratically.

You can read more about the SVR.JS mod callbacks in the [SVR.JS mod API documentation](https://svrjs.org/docs/api/svrjs-api).

### _router.pass([path, ]callback)_

Parameters:
 - _path_ - the path (begins with "/"), for which the route applies. (optional, _String_)
 - _callback_ - the SVR.JS mod callback, which the SVRRouter router will pass to (_Function_)

Returns: the SVRRouter router (so that you can chain the methods for routes or pass-throughs)

The function adds a pass-through (can be middleware) to the SVRRouter router. The pass-through can be to an another SVRRouter router (the request URLs relative to a parent route need to be provided for the _router.route_ function in the SVRRouter router).

The _callback_ parameter has these arguments of the SVR.JS mod callback:
 - _req_ - the SVR.JS request object
 - _res_ - the SVR.JS response object
 - _logFacilities_ - the SVR.JS log facilities object
 - _config_ - the SVR.JS configuration object
 - _next_ - the callback which passes the execution to other routes, SVR.JS mods and SVR.JS internal handlers.

The _req_ object has an additional _svrrouterBase_ property, which contains the route base used internally by a SVRRouter router. It's not recommended to override this property, as doing it may result in a SVRRouter router behaving erratically.

You can read more about the SVR.JS mod callbacks in the [SVR.JS mod API documentation](https://svrjs.org/docs/api/svrjs-api).

### _router.passExpressRouterMiddleware([path, ]middleware)_

Parameters:
 - _path_ - the path (begins with "/"), for which the route applies. (optional, _String_)
 - _middleware_ - the middleware compatible with the `router` library (_Function_)

Returns: the SVRRouter router (so that you can chain the methods for routes or pass-throughs)

The function adds middleware compatible with the `router` library to the SVRRouter router. Middleware that depends on Express's request and response properties may not work.

The _middleware_ parameter has these arguments of middleware compatible with the `router` library:
 - _req_ - the request object
 - _res_ - the response object
 - _next_ - the callback which passes the execution to other routes, SVR.JS mods and SVR.JS internal handlers.

### _router.get(path, callback)_
An alias to the _router.route("GET", path, callback)_ function

### _router.post(path, callback)_
An alias to the _router.route("POST", path, callback)_ function

### _router.put(path, callback)_
An alias to the _router.route("PUT", path, callback)_ function

### _router.patch(path, callback)_
An alias to the _router.route("PATCH", path, callback)_ function

### _router.delete(path, callback)_
An alias to the _router.route("DELETE", path, callback)_ function

### _router.head(path, callback)_
An alias to the _router.route("HEAD", path, callback)_ function

### _router.all(path, callback)_
An alias to the _router.route("*", path, callback)_ function