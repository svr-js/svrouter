const svrouter = require("../src/index.js");

describe("SVRouter", () => {
  let router;

  beforeEach(() => {
    router = svrouter();
  });

  test("should add and handle a GET route", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/test" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.get("/test", (req, res) => {
      res.end("GET route matched");
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("GET route matched");
  });

  test("should add and handle a POST route", () => {
    const req = {
      method: "POST",
      parsedURL: { pathname: "/submit" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.post("/submit", (req, res) => {
      res.end("POST route matched");
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("POST route matched");
  });

  test("should add and handle a route for all HTTP methods", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/test" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.all("/test", (req, res) => {
      res.end("GET route matched");
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("GET route matched");
  });

  test("should correctly parse parameters in the route", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/user/42" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.get("/user/:id", (req, res) => {
      res.end(`User ID is ${req.params.id}`);
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("User ID is 42");
  });

  test("should pass to next middleware when no route matches", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/nonexistent" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    const next = jest.fn();

    router(req, res, null, null, next);

    expect(next).toHaveBeenCalled();
  });

  test("should add a route using router.route", () => {
    const req = {
      method: "PUT",
      parsedURL: { pathname: "/update" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.route("PUT", "/update", (req, res) => {
      res.end("PUT route matched");
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("PUT route matched");
  });

  test("should add a pass-through route with router.pass", () => {
    const req = {
      method: "DELETE",
      parsedURL: { pathname: "/anything" },
      params: null
    };
    const res = {
      end: jest.fn()
    };

    router.pass((req, res) => {
      res.end("Pass-through matched");
    });

    router(req, res, null, null, () => {
      res.end("No route matched");
    });

    expect(res.end).toHaveBeenCalledWith("Pass-through matched");
  });

  test("should support chaining with adding of routes and pass-throughs", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/anything" },
      params: null
    };
    const res = {};

    router
      .get("/anything", (req, res, logFacilities, config, next) => {
        res.passedThroughGet = true;
        next();
      })
      .pass((req, res, logFacilities, config, next) => {
        res.passedThroughPass = true;
        next();
      })
      .pass((req, res, logFacilities, config, next) => {
        res.passedThroughPass2 = true;
        next();
      });

    router(req, res, null, null, () => {});

    expect(res.passedThroughGet).toBe(true);
    expect(res.passedThroughPass).toBe(true);
    expect(res.passedThroughPass2).toBe(true);
  });

  test("should pass through log facilities and configuration objects in routes", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/anything" },
      params: null
    };
    const res = {};
    const logFacilities = {};
    const config = {};
    const passedThrough = {};

    router.pass((req, res, logFacilities, config) => {
      passedThrough.logFacilities = logFacilities;
      passedThrough.config = config;
    });

    router(req, res, logFacilities, config, () => {});

    expect(passedThrough.logFacilities).toBe(logFacilities);
    expect(passedThrough.config).toBe(config);
  });

  test("should handle middleware added with passExpressRouterMiddleware", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/api/resource" },
      url: "/resource",
      originalUrl: "/api/resource",
      baseUrl: "",
      params: null
    };
    const res = {
      end: jest.fn()
    };
    const middleware = jest.fn((req, res, next) => {
      res.end("Middleware matched");
      next();
    });

    router.passExpressRouterMiddleware("/api", middleware);

    router(req, res, null, null, () => {
      res.end("No middleware matched");
    });

    expect(middleware).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith("Middleware matched");
  });

  test("should restore req.url and req.baseUrl after middleware runs", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/api/resource" },
      url: "/api/resource",
      baseUrl: null,
      originalUrl: null,
      params: null
    };
    const res = {
      end: jest.fn(),
      error: jest.fn()
    };

    router.passExpressRouterMiddleware("/api", (req, res, next) => {
      expect(req.baseUrl).toBe("/api");
      expect(req.url).toBe("/resource");
      expect(req.originalUrl).toBe("/api/resource");
      next();
    });

    router(req, res, null, null, () => {
      expect(req.baseUrl).toBeNull();
      expect(req.url).toBe("/api/resource");
      expect(req.originalUrl).toBeNull();
      res.end("Middleware chain completed");
    });

    expect(res.error).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith("Middleware chain completed");
  });

  test("should call next if no middleware matches in passExpressRouterMiddleware", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/nomatch/resource" },
      url: "/resource",
      originalUrl: "/nomatch/resource",
      baseUrl: "",
      params: null
    };
    const res = {
      end: jest.fn()
    };
    const next = jest.fn();

    router.passExpressRouterMiddleware("/api", (req, res, next) => {
      res.end("Middleware matched");
      next();
    });

    router(req, res, null, null, next);

    expect(next).toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  test("should support chaining with passExpressRouterMiddleware", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/api/resource" },
      url: "/resource",
      originalUrl: "/api/resource",
      baseUrl: "",
      params: null
    };
    const res = {};

    router
      .passExpressRouterMiddleware("/api", (req, res, next) => {
        res.firstMiddlewareRan = true;
        next();
      })
      .passExpressRouterMiddleware("/api", (req, res, next) => {
        res.secondMiddlewareRan = true;
        next();
      });

    router(req, res, null, null, () => {});

    expect(res.firstMiddlewareRan).toBe(true);
    expect(res.secondMiddlewareRan).toBe(true);
  });

  test("should throw an error if method is not a string in route", () => {
    expect(() => {
      router.route(123, "/path", () => {});
    }).toThrow("The HTTP method must be a string.");
  });

  test("should throw an error if callback is not a function in route", () => {
    expect(() => {
      router.route("GET", "/path", "not a function");
    }).toThrow("The route callback must be a function.");
  });

  test("should throw an error if path is not a string in pass", () => {
    expect(() => {
      router.pass(123, () => {});
    }).toThrow("The path must be a string.");
  });

  test("should throw an error if path is not a string in passExpressRouterMiddleware", () => {
    expect(() => {
      router.passExpressRouterMiddleware(123, () => {});
    }).toThrow("The path must be a string.");
  });

  test("should handle errors thrown in route callbacks gracefully", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/error" },
      params: null
    };
    const res = {
      error: jest.fn()
    };

    router.get("/error", () => {
      throw new Error("Test error");
    });

    router(req, res, null, null, () => {});

    expect(res.error).toHaveBeenCalledWith(500, expect.any(Error));
  });

  test("should correctly handle errors in middleware added with passExpressRouterMiddleware", () => {
    const req = {
      method: "GET",
      parsedURL: { pathname: "/api/resource" },
      url: "/resource",
      originalUrl: "/api/resource",
      baseUrl: "",
      params: null
    };
    const res = {
      error: jest.fn()
    };

    router.passExpressRouterMiddleware("/api", () => {
      throw new Error("Middleware error");
    });

    router(req, res, null, null, () => {});

    expect(res.error).toHaveBeenCalledWith(500, expect.any(Error));
  });
});
