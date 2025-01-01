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

  test("should throw an error if path is not a string in passRoute", () => {
    expect(() => {
      router.pass(123, () => {});
    }).toThrow("The path must be a function");
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
});
