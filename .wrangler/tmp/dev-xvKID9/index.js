var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-mJVZHY/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-mJVZHY/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
}, "getPattern");
var getPath = /* @__PURE__ */ __name((request) => {
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : "";
}, "getPath");
var getQueryStrings = /* @__PURE__ */ __name((url) => {
  const queryIndex = url.indexOf("?", 8);
  return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
}, "getQueryStrings");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      return parsedCookie;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      return parsedCookie;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
    }
    return parsedCookie;
  }, {});
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }
  if (opt.partitioned) {
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/utils/stream.js
var StreamingApi = /* @__PURE__ */ __name(class {
  constructor(writable, _readable) {
    this.abortSubscribers = [];
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
    const reader = _readable.getReader();
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: () => {
        this.abortSubscribers.forEach((subscriber) => subscriber());
      }
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch (e) {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch (e) {
    }
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  async onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
}, "StreamingApi");

// node_modules/hono/dist/context.js
var __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = /* @__PURE__ */ __name((headers, map = {}) => {
  Object.entries(map).forEach(([key, value]) => headers.set(key, value));
  return headers;
}, "setHeaders");
var _status;
var _executionCtx;
var _headers;
var _preparedHeaders;
var _res;
var _isFresh;
var Context = /* @__PURE__ */ __name(class {
  constructor(req, options) {
    this.env = {};
    this._var = {};
    this.finalized = false;
    this.error = void 0;
    __privateAdd(this, _status, 200);
    __privateAdd(this, _executionCtx, void 0);
    __privateAdd(this, _headers, void 0);
    __privateAdd(this, _preparedHeaders, void 0);
    __privateAdd(this, _res, void 0);
    __privateAdd(this, _isFresh, true);
    this.renderer = (content) => this.html(content);
    this.notFoundHandler = () => new Response();
    this.render = (...args) => this.renderer(...args);
    this.setRenderer = (renderer) => {
      this.renderer = renderer;
    };
    this.header = (name, value, options2) => {
      if (value === void 0) {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).delete(name);
        } else if (__privateGet(this, _preparedHeaders)) {
          delete __privateGet(this, _preparedHeaders)[name.toLocaleLowerCase()];
        }
        if (this.finalized) {
          this.res.headers.delete(name);
        }
        return;
      }
      if (options2?.append) {
        if (!__privateGet(this, _headers)) {
          __privateSet(this, _isFresh, false);
          __privateSet(this, _headers, new Headers(__privateGet(this, _preparedHeaders)));
          __privateSet(this, _preparedHeaders, {});
        }
        __privateGet(this, _headers).append(name, value);
      } else {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).set(name, value);
        } else {
          __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
          __privateGet(this, _preparedHeaders)[name.toLowerCase()] = value;
        }
      }
      if (this.finalized) {
        if (options2?.append) {
          this.res.headers.append(name, value);
        } else {
          this.res.headers.set(name, value);
        }
      }
    };
    this.status = (status) => {
      __privateSet(this, _isFresh, false);
      __privateSet(this, _status, status);
    };
    this.set = (key, value) => {
      this._var ?? (this._var = {});
      this._var[key] = value;
    };
    this.get = (key) => {
      return this._var ? this._var[key] : void 0;
    };
    this.newResponse = (data, arg, headers) => {
      if (__privateGet(this, _isFresh) && !headers && !arg && __privateGet(this, _status) === 200) {
        return new Response(data, {
          headers: __privateGet(this, _preparedHeaders)
        });
      }
      if (arg && typeof arg !== "number") {
        const headers2 = setHeaders(new Headers(arg.headers), __privateGet(this, _preparedHeaders));
        return new Response(data, {
          headers: headers2,
          status: arg.status
        });
      }
      const status = typeof arg === "number" ? arg : __privateGet(this, _status);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      if (__privateGet(this, _res)) {
        __privateGet(this, _res).headers.forEach((v, k) => {
          __privateGet(this, _headers)?.set(k, v);
        });
        setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      }
      headers ?? (headers = {});
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          __privateGet(this, _headers).set(k, v);
        } else {
          __privateGet(this, _headers).delete(k);
          for (const v2 of v) {
            __privateGet(this, _headers).append(k, v2);
          }
        }
      }
      return new Response(data, {
        status,
        headers: __privateGet(this, _headers)
      });
    };
    this.body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
    };
    this.text = (text, arg, headers) => {
      if (!__privateGet(this, _preparedHeaders)) {
        if (__privateGet(this, _isFresh) && !headers && !arg) {
          return new Response(text);
        }
        __privateSet(this, _preparedHeaders, {});
      }
      __privateGet(this, _preparedHeaders)["content-type"] = TEXT_PLAIN;
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
    };
    this.json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
    };
    this.jsonT = (object, arg, headers) => {
      return this.json(object, arg, headers);
    };
    this.html = (html, arg, headers) => {
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
      if (typeof html === "object") {
        if (!(html instanceof Promise)) {
          html = html.toString();
        }
        if (html instanceof Promise) {
          return html.then((html2) => resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html2) => {
            return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
    };
    this.redirect = (location, status = 302) => {
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      __privateGet(this, _headers).set("Location", location);
      return this.newResponse(null, status);
    };
    this.streamText = (cb, arg, headers) => {
      headers ?? (headers = {});
      this.header("content-type", TEXT_PLAIN);
      this.header("x-content-type-options", "nosniff");
      this.header("transfer-encoding", "chunked");
      return this.stream(cb, arg, headers);
    };
    this.stream = (cb, arg, headers) => {
      const { readable, writable } = new TransformStream();
      const stream = new StreamingApi(writable, readable);
      cb(stream).finally(() => stream.close());
      return typeof arg === "number" ? this.newResponse(stream.responseReadable, arg, headers) : this.newResponse(stream.responseReadable, arg);
    };
    this.cookie = (name, value, opt) => {
      const cookie = serialize(name, value, opt);
      this.header("set-cookie", cookie, { append: true });
    };
    this.notFound = () => {
      return this.notFoundHandler(this);
    };
    this.req = req;
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
    }
  }
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    __privateSet(this, _isFresh, false);
    return __privateGet(this, _res) || __privateSet(this, _res, new Response("404 Not Found", { status: 404 }));
  }
  set res(_res2) {
    __privateSet(this, _isFresh, false);
    if (__privateGet(this, _res) && _res2) {
      __privateGet(this, _res).headers.delete("content-type");
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  get var() {
    return { ...this._var };
  }
  get runtime() {
    const global = globalThis;
    if (global?.Deno !== void 0) {
      return "deno";
    }
    if (global?.Bun !== void 0) {
      return "bun";
    }
    if (typeof global?.WebSocketPair === "function") {
      return "workerd";
    }
    if (typeof global?.EdgeRuntime === "string") {
      return "edge-light";
    }
    if (global?.fastly !== void 0) {
      return "fastly";
    }
    if (global?.__lagon__ !== void 0) {
      return "lagon";
    }
    if (global?.process?.release?.name === "node") {
      return "node";
    }
    return "other";
  }
}, "Context");
_status = /* @__PURE__ */ new WeakMap();
_executionCtx = /* @__PURE__ */ new WeakMap();
_headers = /* @__PURE__ */ new WeakMap();
_preparedHeaders = /* @__PURE__ */ new WeakMap();
_res = /* @__PURE__ */ new WeakMap();
_isFresh = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (context instanceof Context) {
          context.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (!handler) {
        if (context instanceof Context && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context instanceof Context && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  constructor(status = 500, options) {
    super(options?.message);
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      return this.res;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
}, "HTTPException");

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = { all: false }) => {
  const contentType = request.headers.get("Content-Type");
  if (isFormDataContent(contentType)) {
    return parseFormData(request, options);
  }
  return {};
}, "parseBody");
function isFormDataContent(contentType) {
  if (contentType === null) {
    return false;
  }
  return contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded");
}
__name(isFormDataContent, "isFormDataContent");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = {};
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] && isArrayField(form[key])) {
    appendToExistingArray(form[key], value);
  } else if (form[key]) {
    convertToNewArray(form, key, value);
  } else {
    form[key] = value;
  }
}, "handleParsingAllValues");
function isArrayField(field) {
  return Array.isArray(field);
}
__name(isArrayField, "isArrayField");
var appendToExistingArray = /* @__PURE__ */ __name((arr, value) => {
  arr.push(value);
}, "appendToExistingArray");
var convertToNewArray = /* @__PURE__ */ __name((form, key, value) => {
  form[key] = [form[key], value];
}, "convertToNewArray");

// node_modules/hono/dist/request.js
var __accessCheck2 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet2 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd2 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet2 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck2(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var _validatedData;
var _matchResult;
var HonoRequest = /* @__PURE__ */ __name(class {
  constructor(request, path = "/", matchResult = [[]]) {
    __privateAdd2(this, _validatedData, void 0);
    __privateAdd2(this, _matchResult, void 0);
    this.routeIndex = 0;
    this.bodyCache = {};
    this.cachedBody = (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      if (bodyCache.arrayBuffer) {
        return (async () => {
          return await new Response(bodyCache.arrayBuffer)[key]();
        })();
      }
      return bodyCache[key] = raw2[key]();
    };
    this.raw = request;
    this.path = path;
    __privateSet2(this, _matchResult, matchResult);
    __privateSet2(this, _validatedData, {});
  }
  param(key) {
    return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
  }
  getDecodedParam(key) {
    const paramKey = __privateGet2(this, _matchResult)[0][this.routeIndex][1][key];
    const param = this.getParamValue(paramKey);
    return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : void 0;
  }
  getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(__privateGet2(this, _matchResult)[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.getParamValue(__privateGet2(this, _matchResult)[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
      }
    }
    return decoded;
  }
  getParamValue(paramKey) {
    return __privateGet2(this, _matchResult)[1] ? __privateGet2(this, _matchResult)[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  cookie(key) {
    const cookie = this.raw.headers.get("Cookie");
    if (!cookie) {
      return;
    }
    const obj = parse(cookie);
    if (key) {
      const value = obj[key];
      return value;
    } else {
      return obj;
    }
  }
  async parseBody(options) {
    if (this.bodyCache.parsedBody) {
      return this.bodyCache.parsedBody;
    }
    const parsedBody = await parseBody(this, options);
    this.bodyCache.parsedBody = parsedBody;
    return parsedBody;
  }
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    __privateGet2(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet2(this, _validatedData)[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route);
  }
  get routePath() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
  get headers() {
    return this.raw.headers;
  }
  get body() {
    return this.raw.body;
  }
  get bodyUsed() {
    return this.raw.bodyUsed;
  }
  get integrity() {
    return this.raw.integrity;
  }
  get keepalive() {
    return this.raw.keepalive;
  }
  get referrer() {
    return this.raw.referrer;
  }
  get signal() {
    return this.raw.signal;
  }
}, "HonoRequest");
_validatedData = /* @__PURE__ */ new WeakMap();
_matchResult = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/hono-base.js
var __accessCheck3 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet3 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd3 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet3 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var COMPOSED_HANDLER = Symbol("composedHandler");
function defineDynamicClass() {
  return class {
  };
}
__name(defineDynamicClass, "defineDynamicClass");
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  const message = "Internal Server Error";
  return c.text(message, 500);
}, "errorHandler");
var _path;
var _Hono = /* @__PURE__ */ __name(class extends defineDynamicClass() {
  constructor(options = {}) {
    super();
    this._basePath = "/";
    __privateAdd3(this, _path, "/");
    this.routes = [];
    this.notFoundHandler = notFoundHandler;
    this.errorHandler = errorHandler;
    this.onError = (handler) => {
      this.errorHandler = handler;
      return this;
    };
    this.notFound = (handler) => {
      this.notFoundHandler = handler;
      return this;
    };
    this.head = () => {
      console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
      return this;
    };
    this.handleEvent = (event) => {
      return this.dispatch(event.request, event, void 0, event.request.method);
    };
    this.fetch = (request, Env, executionCtx) => {
      return this.dispatch(request, executionCtx, Env, request.method);
    };
    this.request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        if (requestInit !== void 0) {
          input = new Request(input, requestInit);
        }
        return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
    };
    this.fire = () => {
      addEventListener("fetch", (event) => {
        event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
      });
    };
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.map((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet3(this, _path, args1);
        } else {
          this.addRoute(method, __privateGet3(this, _path), args1);
        }
        args.map((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, __privateGet3(this, _path), handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      if (!method) {
        return this;
      }
      __privateSet3(this, _path, path);
      for (const m of [method].flat()) {
        handlers.map((handler) => {
          this.addRoute(m.toUpperCase(), __privateGet3(this, _path), handler);
        });
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet3(this, _path, arg1);
      } else {
        handlers.unshift(arg1);
      }
      handlers.map((handler) => {
        this.addRoute(METHOD_NAME_ALL, __privateGet3(this, _path), handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  route(path, app2) {
    const subApp = this.basePath(path);
    if (!app2) {
      return subApp;
    }
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  showRoutes() {
    const length = 8;
    this.routes.map((route) => {
      console.log(
        `\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`
      );
    });
  }
  mount(path, applicationHandler, optionHandler) {
    const mergedPath = mergePath(this._basePath, path);
    const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      const options = optionHandler ? optionHandler(c) : [c.env, executionContext];
      const optionsArray = Array.isArray(options) ? options : [options];
      const queryStrings = getQueryStrings(c.req.url);
      const res = await applicationHandler(
        new Request(
          new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url),
          c.req.raw
        ),
        ...optionsArray
      );
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  get routerName() {
    this.matchRoute("GET", "/");
    return this.router.name;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.matchRoute(method, path);
    const c = new Context(new HonoRequest(request, path, matchResult), {
      env,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.notFoundHandler(c);
        });
      } catch (err) {
        return this.handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.notFoundHandler(c))
      ).catch((err) => this.handleError(err, c)) : res;
    }
    const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. You may forget returning Response object or `await next()`"
          );
        }
        return context.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
}, "_Hono");
var Hono = _Hono;
_path = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class {
  constructor() {
    this.children = {};
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node();
        if (name !== "") {
          node.varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  constructor() {
    this.context = { varIndex: 0 };
    this.root = new Node();
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var methodNames = [METHOD_NAME_ALL, ...METHODS].map((method) => method.toUpperCase());
var emptyParam = [];
var nullMatcher = [/^$/, [], {}];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(
    path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`
  ));
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = {};
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = {};
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = {};
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  constructor() {
    this.name = "RegExpRouter";
    this.middleware = { [METHOD_NAME_ALL]: {} };
    this.routes = { [METHOD_NAME_ALL]: {} };
  }
  add(method, path, handler) {
    var _a;
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (methodNames.indexOf(method) === -1) {
      methodNames.push(method);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = {};
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a2;
          (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a2;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a2 = routes[m])[path2] || (_a2[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = {};
    methodNames.forEach((method) => {
      matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
    });
    this.middleware = this.routes = void 0;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  constructor(init) {
    this.name = "SmartRouter";
    this.routers = [];
    this.routes = [];
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var Node2 = /* @__PURE__ */ __name(class {
  constructor(method, handler, children) {
    this.order = 0;
    this.params = {};
    this.children = children || {};
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = {};
      m[method] = { handler, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    const parentPatterns = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        parentPatterns.push(...curNode.patterns);
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.children[p] = new Node2();
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        parentPatterns.push(...curNode.patterns);
        possibleKeys.push(pattern[1]);
      }
      parentPatterns.push(...curNode.patterns);
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = {};
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length; i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = {};
        handlerSet.possibleKeys.forEach((key) => {
          const processed = processedSet[handlerSet.name];
          handlerSet.params[key] = params[key] && !processed ? params[key] : nodeParams[key] ?? params[key];
          processedSet[handlerSet.name] = true;
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.params = {};
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          nextNode.params = node.params;
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(...this.gHSets(nextNode.children["*"], method, node.params, {}));
            }
            handlerSets.push(...this.gHSets(nextNode, method, node.params, {}));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
          const pattern = node.patterns[k];
          const params = { ...node.params };
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, node.params, {}));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, node.params, params));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, params, node.params));
                if (child.children["*"]) {
                  handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                }
              } else {
                child.params = params;
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  constructor() {
    this.name = "TrieRouter";
    this.node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// src/index.js
var app = new Hono2();
var CONFIG = {
  // 应用基本配置
  APP: {
    FOOTER_TEXT: "\xA9 2024 Memos Themes. All rights reserved.",
    PAGE_LIMIT: "10"
  },
  // 网络请求相关配置
  HTTP: {
    HEADERS: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    },
    CACHE_TTL: 60 * 1e3
    // 缓存有效期（1分钟）
  },
  // CSS类名常量
  CSS: {
    CARD: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden",
    PROSE: "prose dark:prose-invert max-w-none",
    LINK: "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors",
    EMBED: {
      CONTAINER: "my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800",
      DOUYIN: "douyin-container"
    }
  }
};
var REGEX = {
  // 媒体平台
  YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
  BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
  NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
  GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
  DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
  TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
  WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
  WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
  // Markdown 语法
  MD_CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
  MD_INLINE_CODE: /`([^`]+)`/g,
  MD_H1: /^# (.*$)/gm,
  MD_H2: /^## (.*$)/gm,
  MD_H3: /^### (.*$)/gm,
  MD_QUOTE: /^\> (.*)$/gm,
  MD_LIST_ITEM: /^- (.*)$/gm,
  MD_NUM_LIST: /^(\d+)\. (.*)$/gm,
  MD_BOLD: /\*\*(.*?)\*\*/g,
  MD_ITALIC: /\*(.*?)\*/g,
  MD_LINK: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
  MD_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
  TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g,
  URL: /(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g
};
var utils = {
  /**
   * HTML转义，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @return {string} 转义后的安全文本
   */
  escapeHtml(text) {
    if (!text)
      return "";
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
  },
  /**
   * 智能格式化时间，根据时间间隔返回不同格式
   * @param {number} timestamp - 时间戳(毫秒)
   * @return {string} 格式化后的时间字符串
   */
  formatTime(timestamp) {
    const now = /* @__PURE__ */ new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const MINUTE = 60 * 1e3;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    if (diff < MINUTE)
      return "\u521A\u521A";
    if (diff < HOUR)
      return `${Math.floor(diff / MINUTE)} \u5206\u949F\u524D`;
    if (diff < DAY && date.getDate() === now.getDate())
      return `${Math.floor(diff / HOUR)} \u5C0F\u65F6\u524D`;
    if (date.getFullYear() === now.getFullYear()) {
      return this.formatDate(date, {
        month: true,
        day: true,
        hour: true,
        minute: true
      });
    }
    return this.formatDate(date, {
      year: true,
      month: true,
      day: true,
      hour: true,
      minute: true
    });
  },
  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @param {Object} options - 格式化选项
   * @return {string} 格式化后的日期字符串
   */
  formatDate(date, { year = false, month = false, day = false, hour = false, minute = false }) {
    const parts = [];
    if (year)
      parts.push(date.getFullYear());
    if (month)
      parts.push(String(date.getMonth() + 1).padStart(2, "0"));
    if (day)
      parts.push(String(date.getDate()).padStart(2, "0"));
    let result = parts.join("-");
    if (hour || minute) {
      const timeParts = [];
      if (hour)
        timeParts.push(String(date.getHours()).padStart(2, "0"));
      if (minute)
        timeParts.push(String(date.getMinutes()).padStart(2, "0"));
      result += " " + timeParts.join(":");
    }
    return result;
  },
  /**
   * 创建HTML模板字符串，支持模板变量
   * @return {string} 处理后的HTML字符串
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },
  /**
   * 处理URL，确保安全性
   * @param {string} url - 原始URL
   * @return {string} 处理后的安全URL
   */
  safeUrl(url) {
    if (!url || typeof url !== "string")
      return "";
    return url.replace(/[<>"']/g, (match) => {
      switch (match) {
        case "<":
          return "%3C";
        case ">":
          return "%3E";
        case '"':
          return "%22";
        case "'":
          return "%27";
        default:
          return match;
      }
    });
  },
  /**
   * 去除HTML标签，返回纯文本
   * @param {string} html - 包含HTML标签的字符串
   * @return {string} 纯文本内容
   */
  stripHtml(html) {
    if (!html)
      return "";
    return html.replace(/<[^>]*>/g, "");
  },
  /**
   * 截断文本，超出长度添加省略号
   * @param {string} text - 原始文本
   * @param {number} length - 最大长度
   * @return {string} 处理后的文本
   */
  truncate(text, length = 100) {
    if (!text || text.length <= length)
      return text;
    return text.slice(0, length) + "...";
  }
};
var MarkdownRenderer = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    this.options = {
      linkClass: CONFIG.CSS.LINK,
      embedContainer: CONFIG.CSS.EMBED.CONTAINER,
      douyinContainer: CONFIG.CSS.EMBED.DOUYIN
    };
  }
  /**
   * 主渲染入口
   * @param {string} text - 原始文本
   * @return {string} 渲染后的HTML
   */
  render(text) {
    if (!text)
      return "";
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const containsSpecialLinks = this.containsSpecialLinks(text);
    let html;
    if (containsSpecialLinks) {
      const preProcessed = this.processSpecialLinks(text);
      html = this.renderToHtml(preProcessed);
    } else {
      html = this.renderToHtml(text);
      html = this.processSpecialLinks(html);
    }
    this.cache.set(cacheKey, html);
    return html;
  }
  /**
   * 检测文本是否包含特殊平台链接
   * @param {string} text - 待检测文本
   * @return {boolean} 是否包含特殊链接
   */
  containsSpecialLinks(text) {
    return text.includes("youtube.com") || text.includes("bilibili.com") || text.includes("douyin.com") || text.includes("tiktok.com") || text.includes("music.163.com") || text.includes("github.com") || text.includes("mp.weixin.qq.com");
  }
  /**
   * 检测文本是否已包含Markdown格式
   * @param {string} text - 待检测文本
   * @return {boolean} 是否包含Markdown格式
   */
  containsMarkdown(text) {
    return text.includes("# ") || text.includes("## ") || text.includes("### ") || text.includes("```") || text.includes("*") || text.includes("> ") || /\[.*\]\(.*\)/.test(text);
  }
  /**
   * 确保内容是Markdown格式
   * @param {string} text - 原始文本
   * @return {string} 处理后的文本
   */
  ensureMarkdown(text) {
    return this.containsMarkdown(text) ? text : text;
  }
  /**
   * 将Markdown渲染为HTML
   * @param {string} text - Markdown文本
   * @return {string} 渲染后的HTML
   */
  renderToHtml(text) {
    let html = this.ensureMarkdown(text);
    html = html.replace(/\n{2,}/g, "\n\n");
    html = this.renderCodeBlocks(html);
    html = this.renderInlineElements(html);
    html = this.renderBlockElements(html);
    html = this.renderLinks(html);
    html = this.renderParagraphs(html);
    return html;
  }
  /**
   * 渲染代码块
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderCodeBlocks(html) {
    html = html.replace(
      REGEX.MD_CODE_BLOCK,
      (match, lang, code) => utils.createHtml`<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto my-4"><code class="language-${lang || "plaintext"}">${utils.escapeHtml(code)}</code></pre>`
    );
    html = html.replace(REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');
    return html;
  }
  /**
   * 渲染行内元素
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderInlineElements(html) {
    html = html.replace(REGEX.MD_BOLD, "<strong>$1</strong>");
    html = html.replace(REGEX.MD_ITALIC, "<em>$1</em>");
    return html;
  }
  /**
   * 渲染块级元素
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderBlockElements(html) {
    html = html.replace(REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    html = html.replace(REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');
    html = html.replace(REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, (match) => {
      return match.includes("list-decimal") ? `<ol class="my-4">${match}</ol>` : `<ul class="my-4">${match}</ul>`;
    });
    return html;
  }
  /**
   * 渲染链接、图片和标签
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderLinks(html) {
    html = html.replace(
      REGEX.MD_IMAGE,
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    html = html.replace(REGEX.MD_LINK, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">${text}</a>`;
    });
    html = html.replace(REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${this.options.linkClass}">#${tag}</a>`;
    });
    html = html.replace(REGEX.URL, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">${url}</a>`;
    });
    return html;
  }
  /**
   * 渲染段落
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderParagraphs(html) {
    const paragraphs = html.split("\n\n");
    return paragraphs.map((para) => {
      if (para.trim() === "" || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
  }
  /**
   * 处理特殊链接 - 高效精简实现
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processSpecialLinks(html) {
    if (html.includes("<iframe") || html.includes(`<div class="${this.options.embedContainer}">`)) {
      return html;
    }
    html = this.processMediaPlatforms(html);
    return html;
  }
  /**
   * 处理所有媒体平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processMediaPlatforms(html) {
    html = this.processWechatLinks(html);
    html = this.processVideoLinks(html);
    html = this.processMusicLinks(html);
    html = this.processGithubLinks(html);
    return html;
  }
  /**
   * 处理微信公众号链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processWechatLinks(html) {
    html = this.processLinkWithRegex(html, REGEX.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    html = this.processLinkWithRegex(html, REGEX.WECHAT, (match) => {
      return this.createWechatCard(match, "\u5FAE\u4FE1\u516C\u4F17\u53F7\u6587\u7AE0");
    });
    return html;
  }
  /**
   * 处理视频平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processVideoLinks(html) {
    html = this.processEmbedWithRegex(html, REGEX.YOUTUBE, {
      embedSrc: (match, videoId) => {
        if (!videoId || typeof videoId !== "string")
          return "";
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen'
    });
    html = this.processEmbedWithRegex(html, REGEX.BILIBILI, {
      embedSrc: (match, avid, bvid) => {
        if (bvid && typeof bvid === "string") {
          return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0&autoplay=0`;
        } else if (avid && typeof avid === "string") {
          const aid = avid.startsWith("av") ? avid.slice(2) : avid;
          return `https://player.bilibili.com/player.html?aid=${aid}&high_quality=1&danmaku=0&autoplay=0`;
        }
        return "";
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups" referrerpolicy="no-referrer"'
    });
    html = this.processEmbedWithRegex(html, REGEX.DOUYIN, {
      embedSrc: (match, videoId, vidParam) => {
        const finalVideoId = videoId || vidParam;
        if (!finalVideoId || typeof finalVideoId !== "string")
          return "";
        return `https://open.douyin.com/player/video?vid=${finalVideoId}&autoplay=0`;
      },
      attributes: 'style="aspect-ratio: .4821; width: min(324px, 100%); margin: auto;" scrolling="no" frameborder="no" allowfullscreen referrerpolicy="unsafe-url"'
    });
    html = this.processEmbedWithRegex(html, REGEX.TIKTOK, {
      embedSrc: (match, videoId) => {
        if (!videoId || typeof videoId !== "string")
          return "";
        return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen'
    });
    return html;
  }
  /**
   * 处理音乐平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processMusicLinks(html) {
    html = this.processEmbedWithRegex(html, REGEX.NETEASE, {
      embedSrc: (match, songId) => {
        if (!songId || typeof songId !== "string")
          return "";
        return `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
      },
      attributes: 'class="w-full h-[86px]" frameborder="no" border="0" marginwidth="0" marginheight="0"'
    });
    return html;
  }
  /**
   * 处理GitHub仓库链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processGithubLinks(html) {
    html = this.processLinkWithRegex(html, REGEX.GITHUB, (match, repo) => {
      return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
        <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <a href="${match}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">
          ${repo}
        </a>
      </div>`;
    });
    return html;
  }
  /**
   * 通用链接处理函数
   * @param {string} html - 输入HTML
   * @param {RegExp} regex - 匹配的正则表达式
   * @param {Function} processor - 处理函数
   * @return {string} 处理后的HTML
   */
  processLinkWithRegex(html, regex, processor) {
    const processedMarker = {};
    return html.replace(new RegExp(regex.source, "g"), (match, ...args) => {
      const markerId = match.slice(0, 20) + (args[0] || "");
      if (processedMarker[markerId])
        return match;
      if (new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(html)) {
        return match;
      }
      processedMarker[markerId] = true;
      try {
        return processor(match, ...args);
      } catch (error) {
        console.error("\u94FE\u63A5\u5904\u7406\u9519\u8BEF:", error, match, args);
        return match;
      }
    });
  }
  /**
   * 通用嵌入内容处理函数
   * @param {string} html - 输入HTML
   * @param {RegExp} regex - 匹配的正则表达式
   * @param {Object} config - 嵌入配置
   * @return {string} 处理后的HTML
   */
  processEmbedWithRegex(html, regex, config) {
    const processedMarker = {};
    return html.replace(new RegExp(regex.source, "g"), (match, ...args) => {
      const markerId = match.slice(0, 20) + (args[0] || "");
      if (processedMarker[markerId])
        return match;
      processedMarker[markerId] = true;
      try {
        const embedSrc = typeof config.embedSrc === "function" ? config.embedSrc(match, ...args) : "";
        if (!embedSrc) {
          console.error("\u65E0\u6CD5\u751F\u6210\u5D4C\u5165\u6E90:", match, args);
          return match;
        }
        if (html.includes(`src="${embedSrc}"`) || html.includes(`src="${embedSrc.replace("http:", "")}"`)) {
          return match;
        }
        const isDouyin = embedSrc.includes("open.douyin.com");
        const containerClass = isDouyin ? `${this.options.embedContainer} ${this.options.douyinContainer}` : this.options.embedContainer;
        return utils.createHtml`<div class="${containerClass}">
          <iframe src="${embedSrc}" 
                  ${config.attributes || ""}
                  loading="lazy"></iframe>
        </div>`;
      } catch (error) {
        console.error("\u5D4C\u5165\u5904\u7406\u9519\u8BEF:", error, match, args);
        return match;
      }
    });
  }
  /**
   * 创建微信公众号卡片
   * @param {string} url - 微信链接
   * @param {string} title - 卡片标题
   * @return {string} 卡片HTML
   */
  createWechatCard(url, title = "\u5FAE\u4FE1\u516C\u4F17\u53F7\u6587\u7AE0") {
    if (!url || typeof url !== "string") {
      console.error("\u65E0\u6548\u7684\u5FAE\u4FE1\u516C\u4F17\u53F7URL:", url);
      return "";
    }
    url = utils.safeUrl(url);
    title = utils.escapeHtml(title);
    return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
      <svg class="w-6 h-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 00.166-.054l1.9-1.106a.598.598 0 01.504-.042 10.284 10.284 0 003.055.462c.079 0 .158-.001.237-.003a3.57 3.57 0 00-.213-1.88 7.354 7.354 0 01-4.53-6.924c0-3.195 2.738-5.766 6.278-5.951h.043l.084-.001c.079 0 .158 0 .237.003 3.738.186 6.705 2.875 6.705 6.277 0 3.073-2.81 5.597-6.368 5.806a.596.596 0 00-.212.043c-.09.019-.166.07-.237.117h-.036c-.213 0-.416-.036-.618-.073l-.6-.083a.71.71 0 00-.213-.035 1.897 1.897 0 00-.59.095l-1.208.581a.422.422 0 01-.16.036c-.164 0-.295-.13-.295-.295 0-.059.019-.118.037-.165l.075-.188.371-.943c.055-.14.055-.295-.018-.413a3.68 3.68 0 01-.96-1.823c-.13-.414-.206-.846-.213-1.278a3.75 3.75 0 01.891-2.431c-.002 0-.002-.001-.003-.004a5.7 5.7 0 01-.493.046c-.055.003-.11.004-.165.004-4.801 0-8.691-3.288-8.691-7.345 0-4.056 3.89-7.346 8.691-7.346M18.3 15.342a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496m-4.954 0a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496M23.999 17.33c0-3.15-3.043-5.73-6.786-5.943a7.391 7.391 0 00-.283-.004c-3.849 0-7.067 2.721-7.067 6.23 0 3.459 3.055 6.175 6.848 6.227.059.001.118.003.177.003a8.302 8.302 0 002.484-.377.51.51 0 01.426.035l1.59.93c.06.036.118.048.177.048.142 0 .26-.118.26-.26 0-.07-.018-.13-.048-.189l-.331-1.243a.515.515 0 01.178-.555c1.563-1.091 2.575-2.765 2.575-4.902"/>
      </svg>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass} flex-1 truncate">
        ${title}
      </a>
    </div>`;
  }
};
__name(MarkdownRenderer, "MarkdownRenderer");
var markdownRenderer = new MarkdownRenderer();
function simpleMarkdown(text) {
  return markdownRenderer.render(text);
}
__name(simpleMarkdown, "simpleMarkdown");
app.use("*", async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error("\u9519\u8BEF:", err);
    return c.text("\u670D\u52A1\u5668\u9519\u8BEF", 500);
  }
});
var ApiHandler = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * 从缓存中获取数据
   * @param {string} key - 缓存键
   * @param {number} ttl - 缓存有效期（毫秒）
   * @return {*} 缓存数据或null
   */
  getFromCache(key, ttl) {
    const cachedData = this.cache.get(key);
    if (cachedData && cachedData.timestamp > Date.now() - ttl) {
      return cachedData.data;
    }
    return null;
  }
  /**
   * 将数据存入缓存
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  /**
   * 获取memos数据
   * @param {Context} c - Hono上下文
   * @param {string} tag - 标签过滤
   * @return {Promise<Array>} memos数据
   */
  async fetchMemos(c, tag = "") {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.APP.PAGE_LIMIT;
      const cacheKey = `memos_${tag}_${limit}`;
      const ttl = CONFIG.HTTP.CACHE_TTL;
      const cachedData = this.getFromCache(cacheKey, ttl);
      if (cachedData) {
        return cachedData;
      }
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
      const response = await fetch(apiUrl, { headers: CONFIG.HTTP.HEADERS });
      if (!response.ok) {
        throw new Error(`API \u8BF7\u6C42\u5931\u8D25: ${response.status}`);
      }
      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("\u83B7\u53D6 memos \u6570\u636E\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 获取单条memo
   * @param {Context} c - Hono上下文
   * @param {string} name - memo标识
   * @return {Promise<Object|null>} memo数据
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const ttl = CONFIG.HTTP.CACHE_TTL;
      const cachedData = this.getFromCache(cacheKey, ttl);
      if (cachedData) {
        return cachedData;
      }
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      const response = await fetch(apiUrl, { headers: CONFIG.HTTP.HEADERS });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("\u83B7\u53D6\u5355\u6761 memo \u6570\u636E\u5931\u8D25:", error);
      return null;
    }
  }
};
__name(ApiHandler, "ApiHandler");
var apiHandler = new ApiHandler();
function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime ? new Date(memo.createTime).getTime() : memo.createdTs * 1e3;
    const date = utils.formatTime(timestamp);
    const content = memo.content || "";
    const parsedContent = simpleMarkdown(content);
    const resources = memo.resources || memo.resourceList || [];
    const resourcesHtml = resources.length > 0 ? renderResources(resources) : "";
    const timeHtml = isHomePage ? utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
             ${date}
           </a>
         </time>` : utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`;
    return utils.createHtml`
      <article class="${CONFIG.CSS.CARD}">
        <div class="p-6 sm:p-8">
          ${timeHtml}
          <div class="mt-4 ${CONFIG.CSS.PROSE}">
            ${parsedContent}
          </div>
          ${resourcesHtml}
        </div>
      </article>
    `;
  } catch (error) {
    console.error("\u6E32\u67D3 memo \u5931\u8D25:", error);
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `;
  }
}
__name(renderMemo, "renderMemo");
function renderResources(resources) {
  const gridCols = resources.length === 1 ? "grid-cols-1" : resources.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
  return utils.createHtml`
    <div class="grid ${gridCols} gap-4 mt-6">
      ${resources.map((resource) => utils.createHtml`
        <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
          <img 
            src="${resource.externalLink || ""}" 
            alt="${resource.filename || "\u56FE\u7247"}"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
            loading="lazy"
            data-preview="true"
          />
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
        </div>
      `).join("")}
    </div>
  `;
}
__name(renderResources, "renderResources");
var Routes = class {
  /**
   * 主页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async home(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      const memosHtml = memos.map((memo) => renderMemo(memo, true)).join("");
      return new Response(renderBaseHtml(
        c.env.SITE_NAME,
        memosHtml,
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "public, max-age=300"
          // 5分钟缓存
        }
      });
    } catch (error) {
      console.error("\u6E32\u67D3\u9996\u9875\u5931\u8D25:", error);
      return new Response(renderErrorPage(error, c), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
        status: 500
      });
    }
  }
  /**
   * 单页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async post(c) {
    try {
      const name = c.req.param("name");
      const data = await apiHandler.fetchMemo(c, name);
      if (!data || !data.memo) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME,
          htmlTemplates.notFoundPage(),
          c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
          status: 404
        });
      }
      const memoHtml = renderMemo(data.memo, false);
      return new Response(renderBaseHtml(
        c.env.SITE_NAME,
        memoHtml,
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "public, max-age=1800"
          // 30分钟缓存
        }
      });
    } catch (error) {
      console.error("\u6E32\u67D3\u6587\u7AE0\u9875\u5931\u8D25:", error);
      return new Response(renderErrorPage(error, c), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
        status: 500
      });
    }
  }
  /**
   * 标签页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async tag(c) {
    try {
      const tag = c.req.param("tag");
      const memos = await apiHandler.fetchMemos(c, tag);
      const memosHtml = memos.map((memo) => renderMemo(memo, true)).join("");
      return new Response(renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`,
        memosHtml,
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "public, max-age=300"
          // 5分钟缓存
        }
      });
    } catch (error) {
      console.error("\u6E32\u67D3\u6807\u7B7E\u9875\u5931\u8D25:", error);
      return new Response(renderErrorPage(error, c), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
        status: 500
      });
    }
  }
  /**
   * API代理 - 用于缓存资源
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return new Response(JSON.stringify(memos), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=2592000"
          // 30天缓存
        }
      });
    } catch (error) {
      console.error("API\u4EE3\u7406\u5931\u8D25:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }
  }
  /**
   * 服务工作线程路由
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async serviceWorker(c) {
    return new Response(
      c.env.ASSETS.fetch(new Request("/sw.js")),
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache"
        }
      }
    );
  }
  /**
   * 离线页面路由
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static offlinePage(c) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\u79BB\u7EBF - ${c.env.SITE_NAME || "\u535A\u5BA2"}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #4b5563;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 24px;
            color: #6b7280;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1 {
              color: #f9fafb;
            }
            p {
              color: #d1d5db;
            }
            .icon {
              color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">\u{1F4F6}</div>
          <h1>\u60A8\u5F53\u524D\u5904\u4E8E\u79BB\u7EBF\u72B6\u6001</h1>
          <p>\u65E0\u6CD5\u52A0\u8F7D\u65B0\u5185\u5BB9\u3002\u8BF7\u68C0\u67E5\u60A8\u7684\u7F51\u7EDC\u8FDE\u63A5\u5E76\u91CD\u8BD5\u3002</p>
          <a href="/" class="btn">\u5237\u65B0\u9875\u9762</a>
        </div>
      </body>
      </html>
    `, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=2592000"
      }
    });
  }
  /**
   * 离线图片占位符
   * @return {Response} HTTP响应
   */
  static offlineImage() {
    const transparentPixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    return new Response(Buffer.from(transparentPixel, "base64"), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=2592000"
      }
    });
  }
};
__name(Routes, "Routes");
function renderErrorPage(error, c) {
  return renderBaseHtml(
    "\u9519\u8BEF",
    htmlTemplates.errorPage(error),
    c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
}
__name(renderErrorPage, "renderErrorPage");
app.get("/", Routes.home);
app.get("/post/:name", Routes.post);
app.get("/tag/:tag", Routes.tag);
app.get("/api/v1/memo", Routes.api);
app.get("/sw.js", Routes.serviceWorker);
app.get("/offline.html", Routes.offlinePage);
app.get("/offline-image.png", Routes.offlineImage);
app.get("/manifest.json", (c) => {
  return new Response(JSON.stringify({
    name: c.env.SITE_NAME || "Memos Themes",
    short_name: c.env.SITE_NAME || "Memos",
    description: "\u8BB0\u5F55\u751F\u6D3B\u70B9\u6EF4\u7684\u8F7B\u91CF\u7EA7\u535A\u5BA2",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "https://memos-themes.pages.dev/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "https://memos-themes.pages.dev/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=2592000"
    }
  });
});
app.get("/sw.js", (c) => {
  const swScript = `
    const CACHE_NAME = 'memos-theme-cache-v1';
    const ASSETS_CACHE = 'memos-assets-cache-v1';
    const API_CACHE = 'memos-api-cache-v1';
    
    // \u9884\u7F13\u5B58\u7684\u8D44\u6E90
    const PRECACHE_ASSETS = [
      '/',
      '/offline.html',
      '/offline-image.png'
    ];
    
    // \u5B89\u88C5\u4E8B\u4EF6 - \u9884\u7F13\u5B58\u9759\u6001\u8D44\u6E90
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('\u9884\u7F13\u5B58\u9759\u6001\u8D44\u6E90');
            return cache.addAll(PRECACHE_ASSETS);
          })
          .then(() => self.skipWaiting())
      );
    });
    
    // \u6FC0\u6D3B\u4E8B\u4EF6 - \u6E05\u7406\u65E7\u7F13\u5B58
    self.addEventListener('activate', event => {
      const currentCaches = [CACHE_NAME, ASSETS_CACHE, API_CACHE];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
          return Promise.all(cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          }));
        }).then(() => self.clients.claim())
      );
    });
    
    // \u54CD\u5E94\u7B56\u7565 - \u5904\u7406\u4E0D\u540C\u7C7B\u578B\u8BF7\u6C42
    self.addEventListener('fetch', event => {
      const url = new URL(event.request.url);
      
      // \u8DF3\u8FC7\u4E0D\u652F\u6301\u7684\u8BF7\u6C42
      if (event.request.method !== 'GET') return;
      
      // API\u8BF7\u6C42\u5904\u7406 - \u7F51\u7EDC\u4F18\u5148\uFF0C\u5931\u8D25\u65F6\u56DE\u9000\u5230\u7F13\u5B58
      if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
      }
      
      // \u9759\u6001\u8D44\u6E90\u5904\u7406 - \u7F13\u5B58\u4F18\u5148\uFF0C\u5931\u8D25\u65F6\u56DE\u9000\u5230\u7F51\u7EDC
      if (
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.svg') ||
        url.pathname.includes('cdn')
      ) {
        event.respondWith(handleAssetRequest(event.request));
        return;
      }
      
      // HTML\u8BF7\u6C42\u5904\u7406 - \u7F51\u7EDC\u4F18\u5148\uFF0C\u5931\u8D25\u65F6\u56DE\u9000\u5230\u7F13\u5B58\u6216\u79BB\u7EBF\u9875\u9762
      event.respondWith(handlePageRequest(event.request));
    });
    
    // API\u8BF7\u6C42\u5904\u7406
    async function handleApiRequest(request) {
      try {
        // \u5148\u5C1D\u8BD5\u7F51\u7EDC\u8BF7\u6C42
        const networkResponse = await fetch(request);
        // \u5982\u679C\u6210\u529F\uFF0C\u66F4\u65B0\u7F13\u5B58
        if (networkResponse.ok) {
          const cache = await caches.open(API_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // \u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4ECE\u7F13\u5B58\u83B7\u53D6
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // \u8FD4\u56DEJSON\u9519\u8BEF
        return new Response(JSON.stringify({
          error: 'Network error. Using offline cached data.'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      }
    }
    
    // \u9759\u6001\u8D44\u6E90\u8BF7\u6C42\u5904\u7406
    async function handleAssetRequest(request) {
      // \u5148\u67E5\u8BE2\u7F13\u5B58
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // \u7F13\u5B58\u672A\u547D\u4E2D\uFF0C\u4ECE\u7F51\u7EDC\u83B7\u53D6
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          // \u6210\u529F\u83B7\u53D6\u540E\u7F13\u5B58
          const cache = await caches.open(ASSETS_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // \u5BF9\u4E8E\u56FE\u7247\uFF0C\u8FD4\u56DE\u5360\u4F4D\u7B26
        if (request.url.match(/.(jpg|jpeg|png|gif|webp)$/i)) {
          return caches.match('/offline-image.png');
        }
        
        // \u5176\u4ED6\u8D44\u6E90\u8FD4\u56DE\u7F51\u7EDC\u9519\u8BEF
        return new Response('Network error', { status: 503 });
      }
    }
    
    // \u9875\u9762\u8BF7\u6C42\u5904\u7406
    async function handlePageRequest(request) {
      try {
        // \u5C1D\u8BD5\u7F51\u7EDC\u8BF7\u6C42
        const networkResponse = await fetch(request);
        // \u6210\u529F\u540E\u66F4\u65B0\u7F13\u5B58
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // \u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4ECE\u7F13\u5B58\u83B7\u53D6
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // \u7F13\u5B58\u4E5F\u6CA1\u6709\uFF0C\u8FD4\u56DE\u79BB\u7EBF\u9875\u9762
        return caches.match('/offline.html');
      }
    }
  `;
  return new Response(swScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache"
    }
  });
});
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-mJVZHY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-mJVZHY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
