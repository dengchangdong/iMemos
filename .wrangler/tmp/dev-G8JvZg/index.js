var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __template = (cooked, raw2) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw2 || cooked.slice()) }));

// .wrangler/tmp/bundle-UGo9P6/checked-fetch.js
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

// .wrangler/tmp/bundle-UGo9P6/strip-cf-connecting-ip-header.js
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
    this.html = (html2, arg, headers) => {
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
      if (typeof html2 === "object") {
        if (!(html2 instanceof Promise)) {
          html2 = html2.toString();
        }
        if (html2 instanceof Promise) {
          return html2.then((html22) => resolveCallback(html22, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html22) => {
            return typeof arg === "number" ? this.newResponse(html22, arg, headers) : this.newResponse(html22, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
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
function buildMatcherFromPreprocessedRoutes(routes2) {
  const trie = new Trie();
  const handlerData = [];
  if (routes2.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes2.map(
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
    var _a2;
    const { middleware, routes: routes2 } = this;
    if (!middleware || !routes2) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (methodNames.indexOf(method) === -1) {
      methodNames.push(method);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes2].forEach((handlerMap) => {
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
          var _a22;
          (_a22 = middleware[m])[path] || (_a22[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a2 = middleware[method])[path] || (_a2[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes2[m]).forEach(
            (p) => re.test(p) && routes2[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes2).forEach((m) => {
        var _a22;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a22 = routes2[m])[path2] || (_a22[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes2[m][path2].push([handler, paramCount - len + i + 1]);
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
    const routes2 = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes2.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes2.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes2);
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
    const { routers, routes: routes2 } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes2.forEach((args) => {
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

// src/config.js
var CONFIG = {
  /** @type {string} 每页显示的数量限制 */
  PAGE_LIMIT: "10",
  /** @type {Object} HTTP请求头 */
  HEADERS: {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  },
  /** @type {Object} 正则表达式预编译，提高性能 */
  REGEX: {
    /** @type {RegExp} YouTube视频链接匹配 */
    YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
    /** @type {RegExp} Bilibili视频链接匹配 */
    BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
    /** @type {RegExp} 网易云音乐链接匹配 */
    NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
    /** @type {RegExp} GitHub仓库链接匹配 */
    GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
    /** @type {RegExp} 抖音视频链接匹配 */
    DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
    /** @type {RegExp} TikTok视频链接匹配 */
    TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    /** @type {RegExp} 微信公众号链接匹配 */
    WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
    /** @type {RegExp} Markdown格式的微信公众号链接匹配 */
    WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
    /** @type {RegExp} Markdown代码块匹配 */
    MD_CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
    /** @type {RegExp} Markdown行内代码匹配 */
    MD_INLINE_CODE: /`([^`]+)`/g,
    /** @type {RegExp} Markdown一级标题匹配 */
    MD_H1: /^# (.*$)/gm,
    /** @type {RegExp} Markdown二级标题匹配 */
    MD_H2: /^## (.*$)/gm,
    /** @type {RegExp} Markdown三级标题匹配 */
    MD_H3: /^### (.*$)/gm,
    /** @type {RegExp} Markdown引用匹配 */
    MD_QUOTE: /^\> (.*)$/gm,
    /** @type {RegExp} Markdown无序列表匹配 */
    MD_LIST_ITEM: /^- (.*)$/gm,
    /** @type {RegExp} Markdown有序列表匹配 */
    MD_NUM_LIST: /^(\d+)\. (.*)$/gm,
    /** @type {RegExp} Markdown加粗匹配 */
    MD_BOLD: /\*\*(.*?)\*\*/g,
    /** @type {RegExp} Markdown斜体匹配 */
    MD_ITALIC: /\*(.*?)\*/g,
    /** @type {RegExp} Markdown链接匹配（排除微信公众号链接） */
    MD_LINK: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
    /** @type {RegExp} Markdown图片匹配 */
    MD_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
    /** @type {RegExp} 标签匹配 */
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },
  /** @type {Object} CSS类名配置 */
  CSS: {
    /** @type {string} 卡片样式 */
    CARD: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden",
    /** @type {string} 文章内容样式 */
    PROSE: "prose dark:prose-invert max-w-none",
    /** @type {string} 链接样式 */
    LINK: "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors",
    /** @type {string} 嵌入容器样式 */
    EMBED_CONTAINER: "my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
  }
};

// src/utils.js
var utils = {
  /**
   * HTML转义，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  },
  /**
   * 格式化时间
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(timestamp) {
    const now = /* @__PURE__ */ new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / (1e3 * 60));
    const hours = Math.floor(diff / (1e3 * 60 * 60));
    if (minutes < 5)
      return "\u521A\u521A";
    if (minutes < 60)
      return `${minutes} \u5206\u949F\u524D`;
    if (hours < 24 && date.getDate() === now.getDate())
      return `${hours} \u5C0F\u65F6\u524D`;
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\//g, "-");
    }
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\//g, "-");
  },
  /**
   * 创建HTML元素（用于模板）
   * @param {TemplateStringsArray} strings - 模板字符串数组
   * @param {...any} values - 插入值
   * @returns {string} 生成的HTML字符串
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },
  /**
   * 按时间降序排序memos
   * @param {Array<Object>} memos - memo对象数组
   * @returns {Array<Object>} 排序后的memo数组
   */
  sortMemosByTime(memos) {
    if (!Array.isArray(memos))
      return [];
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1e3;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1e3;
      return timeB - timeA;
    });
  }
};

// src/markdown.js
var markdownRenderer = {
  /** @type {Map<string, string>} 处理缓存 */
  cache: /* @__PURE__ */ new Map(),
  /**
   * 主处理函数
   * @param {string} text - 要渲染的文本内容
   * @returns {string} 渲染后的HTML
   */
  render(text) {
    if (!text)
      return "";
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const containsSpecialLinks = text.includes("youtube.com") || text.includes("bilibili.com") || text.includes("douyin.com") || text.includes("tiktok.com") || text.includes("music.163.com") || text.includes("github.com") || text.includes("mp.weixin.qq.com");
    const markdown = this.ensureMarkdown(text);
    let html2;
    if (containsSpecialLinks) {
      const preProcessed = this.processSpecialLinks(markdown);
      html2 = this.renderToHtml(preProcessed);
    } else {
      html2 = this.renderToHtml(markdown);
    }
    this.cache.set(cacheKey, html2);
    return html2;
  },
  /**
   * 确保内容是Markdown格式
   * @param {string} text - 输入文本
   * @returns {string} 处理后的Markdown文本
   */
  ensureMarkdown(text) {
    const containsMarkdown = text.includes("# ") || text.includes("## ") || text.includes("### ") || text.includes("```") || text.includes("*") || text.includes("> ") || /\[.*\]\(.*\)/.test(text);
    if (containsMarkdown) {
      return text;
    }
    return text;
  },
  /**
   * 将Markdown渲染为HTML - 高效实现
   * @param {string} text - Markdown文本
   * @returns {string} 渲染后的HTML
   */
  renderToHtml(text) {
    let html2 = text;
    html2 = html2.replace(/\n{2,}/g, "\n\n");
    html2 = html2.replace(CONFIG.REGEX.MD_CODE_BLOCK, (match, lang, code) => {
      const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\n/g, "<br>");
      return utils.createHtml`<div class="code-block relative bg-gray-100 dark:bg-slate-800 rounded-md my-4" data-language="${lang || "text"}" data-original-code="${encodeURIComponent(code)}">
        <div class="code-header flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-500 dark:text-gray-400">${lang || "text"}</span>
          <button class="copy-btn relative p-1.5 text-base text-gray-600 dark:text-gray-300 bg-transparent border-none rounded cursor-pointer opacity-100 transition-all duration-200 z-5 flex items-center justify-center w-7 h-7 hover:bg-black/5 dark:hover:bg-white/5" aria-label="复制代码" type="button">
            <i class="ri-file-copy-line"></i>
          </button>
        </div>
        <pre class="p-4 overflow-auto"><code class="language-${lang || "text"}">${escapedCode}</code></pre>
      </div>`;
    });
    html2 = html2.replace(CONFIG.REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');
    html2 = html2.replace(CONFIG.REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    html2 = html2.replace(CONFIG.REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html2 = html2.replace(CONFIG.REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html2 = html2.replace(CONFIG.REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');
    html2 = html2.replace(CONFIG.REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html2 = html2.replace(CONFIG.REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');
    html2 = html2.replace(/(<li.*>.*<\/li>\n)+/g, (match) => {
      if (match.includes("list-decimal")) {
        return `<ol class="my-4">${match}</ol>`;
      }
      return `<ul class="my-4">${match}</ul>`;
    });
    html2 = html2.replace(CONFIG.REGEX.MD_BOLD, "<strong>$1</strong>");
    html2 = html2.replace(CONFIG.REGEX.MD_ITALIC, "<em>$1</em>");
    html2 = html2.replace(
      CONFIG.REGEX.MD_IMAGE,
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    html2 = html2.replace(CONFIG.REGEX.MD_LINK, (match, text2, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text2}</a>`;
    });
    html2 = html2.replace(CONFIG.REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`;
    });
    html2 = html2.replace(/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`;
    });
    const paragraphs = html2.split("\n\n");
    html2 = paragraphs.map((para) => {
      if (para.trim() === "" || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 last:mb-0">${para.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
    html2 = this.processSpecialLinks(html2);
    return html2;
  },
  /**
   * 处理特殊链接 - 高效精简实现
   * @param {string} html - 输入的HTML内容
   * @returns {string} 处理后的HTML内容
   */
  processSpecialLinks(html2) {
    if (html2.includes("<iframe") || html2.includes('<div class="' + CONFIG.CSS.EMBED_CONTAINER + '">')) {
      return html2;
    }
    const processLink = /* @__PURE__ */ __name((regex, processor) => {
      const processedMarker = {};
      html2 = html2.replace(new RegExp(regex.source, "g"), (match, ...args) => {
        const markerId = match.slice(0, 20) + (args[0] || "");
        if (processedMarker[markerId] || new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(html2)) {
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
      return html2;
    }, "processLink");
    html2 = processLink(CONFIG.REGEX.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    html2 = processLink(CONFIG.REGEX.WECHAT, (match) => {
      return this.createWechatCard(match);
    });
    const embedHandlers = [
      {
        regex: CONFIG.REGEX.YOUTUBE,
        createEmbed: (match, videoId) => {
          if (!videoId)
            return match;
          const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
          return this.createEmbedHTML(embedSrc, "w-full aspect-video", 'frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen');
        }
      },
      {
        regex: CONFIG.REGEX.BILIBILI,
        createEmbed: (match, avid, bvid) => {
          const id = bvid || avid;
          if (!id)
            return match;
          const embedSrc = `https://player.bilibili.com/player.html?${bvid ? "bvid=" + bvid : "aid=" + avid.replace("av", "")}&high_quality=1`;
          return this.createEmbedHTML(embedSrc, "w-full aspect-video");
        }
      },
      {
        regex: CONFIG.REGEX.DOUYIN,
        createEmbed: (match, vid1, vid2) => {
          const vid = vid1 || vid2;
          if (!vid)
            return match;
          const embedSrc = `https://www.douyin.com/video/${vid}`;
          return this.createEmbedHTML(embedSrc, "w-full aspect-video douyin-container");
        }
      },
      {
        regex: CONFIG.REGEX.TIKTOK,
        createEmbed: (match, vid) => {
          if (!vid)
            return match;
          const embedSrc = `https://www.tiktok.com/embed/v2/${vid}`;
          return this.createEmbedHTML(embedSrc, "w-full aspect-video");
        }
      },
      {
        regex: CONFIG.REGEX.NETEASE,
        createEmbed: (match, songId) => {
          if (!songId)
            return match;
          const embedSrc = `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
          return this.createEmbedHTML(embedSrc, "w-full h-24");
        }
      },
      {
        regex: CONFIG.REGEX.GITHUB,
        createEmbed: (match, repo) => {
          if (!repo)
            return match;
          return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <a href="${match}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK} flex-1 truncate">
              ${repo}
            </a>
          </div>`;
        }
      }
    ];
    embedHandlers.forEach((handler) => {
      html2 = processLink(handler.regex, handler.createEmbed);
    });
    return html2;
  },
  // 创建嵌入HTML
  createEmbedHTML(embedSrc, containerClass = "", attributes = "") {
    const cssClass = containerClass ? `${CONFIG.CSS.EMBED_CONTAINER} ${containerClass}` : CONFIG.CSS.EMBED_CONTAINER;
    return utils.createHtml`<div class="${cssClass}">
      <iframe src="${embedSrc}" ${attributes} class="w-full h-full" loading="lazy"></iframe>
    </div>`;
  },
  // 创建微信卡片
  createWechatCard(url, title = "\u5FAE\u4FE1\u516C\u4F17\u53F7\u6587\u7AE0") {
    url = url.replace(/[^a-zA-Z0-9-_.~]/g, (match) => {
      const code = match.charCodeAt(0);
      return "%" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
    });
    title = title.replace(/[<>"']/g, "");
    return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
      <svg class="w-6 h-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 00.166-.054l1.9-1.106a.598.598 0 01.504-.042 10.284 10.284 0 003.055.462c.079 0 .158-.001.237-.003a3.57 3.57 0 00-.213-1.88 7.354 7.354 0 01-4.53-6.924c0-3.195 2.738-5.766 6.278-5.951h.043l.084-.001c.079 0 .158 0 .237.003 3.738.186 6.705 2.875 6.705 6.277 0 3.073-2.81 5.597-6.368 5.806a.596.596 0 00-.212.043c-.09.019-.166.07-.237.117h-.036c-.213 0-.416-.036-.618-.073l-.6-.083a.71.71 0 00-.213-.035 1.897 1.897 0 00-.59.095l-1.208.581a.422.422 0 01-.16.036c-.164 0-.295-.13-.295-.295 0-.059.019-.118.037-.165l.075-.188.371-.943c.055-.14.055-.295-.018-.413a3.68 3.68 0 01-.96-1.823c-.13-.414-.206-.846-.213-1.278a3.75 3.75 0 01.891-2.431c-.002 0-.002-.001-.003-.004a5.7 5.7 0 01-.493.046c-.055.003-.11.004-.165.004-4.801 0-8.691-3.288-8.691-7.345 0-4.056 3.89-7.346 8.691-7.346M18.3 15.342a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496m-4.954 0a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496M23.999 17.33c0-3.15-3.043-5.73-6.786-5.943a7.391 7.391 0 00-.283-.004c-3.849 0-7.067 2.721-7.067 6.23 0 3.459 3.055 6.175 6.848 6.227.059.001.118.003.177.003a8.302 8.302 0 002.484-.377.51.51 0 01.426.035l1.59.93c.06.036.118.048.177.048.142 0 .26-.118.26-.26 0-.07-.018-.13-.048-.189l-.331-1.243a.515.515 0 01.178-.555c1.563-1.091 2.575-2.765 2.575-4.902"/>
      </svg>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK} flex-1 truncate">
        ${title}
      </a>
    </div>`;
  }
};
function simpleMarkdown(text) {
  if (!text)
    return "";
  return markdownRenderer.render(text);
}
__name(simpleMarkdown, "simpleMarkdown");

// src/template.js
var htmlTemplates = {
  /**
   * 错误页面模板
   * @param {Error} error - 错误对象
   * @returns {string} 错误页面HTML
   */
  errorPage(error) {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`
        <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
        <p class="text-sm">${error.message}</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  },
  /**
   * 404页面模板
   * @returns {string} 404页面HTML
   */
  notFoundPage() {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
      utils.createHtml`
        <h2 class="font-medium">未找到内容</h2>
        <p>您访问的内容不存在或已被删除</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  }
};
function parseNavLinks(linksStr) {
  if (!linksStr)
    return [];
  try {
    const jsonStr = linksStr.replace(/'/g, '"');
    const linksObj = JSON.parse(jsonStr);
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }));
  } catch (error) {
    console.error("\u89E3\u6790\u5BFC\u822A\u94FE\u63A5\u5931\u8D25:", error);
    return [];
  }
}
__name(parseNavLinks, "parseNavLinks");
function createArticleStructure(header, content) {
  return utils.createHtml`
    <article class="pb-8 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0 before:content-[''] before:w-[17px] before:h-[17px] before:bg-white before:border before:border-[#4e5ed3] before:rounded-full before:absolute before:left-[-9px] before:top-0 before:shadow-[3px_3px_0px_#bab5f8] dark:before:bg-[#1f2937] dark:before:border-[#818cf8] dark:before:shadow-[3px_3px_0px_#6366f1] hover:before:scale-110 hover:before:shadow-[4px_4px_0px_#bab5f8] dark:hover:before:shadow-[4px_4px_0px_#6366f1] before:transition-all before:duration-300">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `;
}
__name(createArticleStructure, "createArticleStructure");
function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime ? new Date(memo.createTime).getTime() : memo.createdTs * 1e3;
    const formattedTime = utils.formatTime(timestamp);
    const content = memo.content || "";
    const parsedContent = simpleMarkdown(content);
    const resources = memo.resources || memo.resourceList || [];
    const resourcesHtml = resources.length > 0 ? createResourcesHtml(resources) : "";
    const articleUrl = isHomePage ? `/post/${memo.name}` : "#";
    const header = utils.createHtml`
      <div class="flex">
        <a class="block" href="${articleUrl}">
          <time datetime="${new Date(timestamp).toISOString()}" class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs hover:text-blue-800 dark:hover:text-blue-300 transition-all bg-blue-100/70 dark:bg-blue-900/30 px-3 py-1 rounded-full hover:scale-105">${formattedTime}</time>
        </a>
      </div>
    `;
    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error("\u6E32\u67D3 memo \u5931\u8D25:", error);
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    );
  }
}
__name(renderMemo, "renderMemo");
var renderImageItem = /* @__PURE__ */ __name((resource, itemClass) => {
  const originalLink = resource.externalLink || "";
  const transformedLink = originalLink.replace(
    "images-memos.dengchangdong.com",
    "images-memos.dengchangdong.com/cdn-cgi/image/h=800"
  );
  return utils.createHtml`
    <div class="${itemClass} relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
      <img src="${transformedLink}" alt="${resource.filename || "\u56FE\u7247"}" class="rounded-lg w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-105 opacity-0" loading="lazy" data-preview="true"/>
      <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
        <i class="ri-image-line text-2xl animate-pulse"></i>
      </div>
    </div>
  `;
}, "renderImageItem");
function createResourcesHtml(resources) {
  const count = resources.length;
  if (count === 0) {
    return "";
  }
  const layoutConfig = {
    1: {
      container: "",
      item: "w-full aspect-video"
    },
    2: {
      container: "flex flex-wrap gap-1",
      item: "w-[calc(50%-2px)] aspect-square"
    },
    default: {
      container: "grid grid-cols-3 gap-1",
      item: "aspect-square"
    }
  };
  const { container: containerClass, item: itemClass } = layoutConfig[count] || layoutConfig.default;
  const imagesHtml = resources.map((resource) => renderImageItem(resource, itemClass)).join("");
  const content = containerClass ? `<div class="${containerClass}">${imagesHtml}</div>` : imagesHtml;
  return utils.createHtml`
    <figure class="mt-4">
      ${content}
    </figure>
  `;
}
__name(createResourcesHtml, "createResourcesHtml");
function renderPagination({ currentPage, hasMore, isHomePage, tag = "" }) {
  if (!isHomePage && !tag) {
    return "";
  }
  const buttonClass = "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline border-none cursor-pointer hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg shadow-md";
  if (isHomePage && currentPage === 1) {
    return utils.createHtml`
      <div class="pagination flex justify-center items-center mt-8">
        <a href="/page/2" class="${buttonClass}">
          <i class="ri-arrow-down-line text-xl mr-2"></i> 查看更多内容
        </a>
      </div>
    `;
  }
  const prevPageLink = currentPage > 2 ? `/page/${currentPage - 1}` : "/";
  const nextPageLink = `/page/${currentPage + 1}`;
  return utils.createHtml`
    <div class="pagination flex justify-between items-center mt-8">
      <a href="${prevPageLink}" class="${buttonClass}">
        <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
      </a>
      <span class="text-sm bg-blue-100/70 dark:bg-blue-900/30 px-4 py-1.5 rounded-full text-blue-700 dark:text-blue-300 font-medium">第 ${currentPage} 页</span>
      <a href="${nextPageLink}" class="${buttonClass} ${hasMore ? "" : "invisible"}">
        下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
      </a>
    </div>
  `;
}
__name(renderPagination, "renderPagination");
var _a;
function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = "") {
  const navItems = parseNavLinks(navLinks);
  const navItemsHtml = navItems.length > 0 ? navItems.map((item) => utils.createHtml`
        <li><a href="${item.url}" class="px-3 py-1.5 rounded-md transition-all hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium text-blue-500 hover:text-blue-700 hover:scale-105 flex items-center"><i class="ri-link mr-1 text-xs"></i>${item.text}</a></li>
      `).join("") : "";
  const articlesHtml = Array.isArray(content) ? content.join("") : content;
  return utils.createHtml(_a || (_a = __template(['\n    <!DOCTYPE html>\n    <html lang="zh-CN" class="scroll-smooth">\n      <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <meta name="description" content="', '">\n        <meta name="theme-color" content="#209cff">\n        <title>', `</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/3.5.0/remixicon.min.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"><\/script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                backgroundImage: {
                  'custom-gradient': 'linear-gradient(135deg, #3b82f6, #10b981)',
                  'custom-gradient-dark': 'linear-gradient(135deg, #1e3a8a, #065f46)',
                },
                colors: {
                  'indigo-timeline': '#4e5ed3',
                  'indigo-shadow': '#bab5f8',
                },
                fontFamily: {
                  'sans': ['Noto Sans SC', 'sans-serif'],
                  'poppins': ['Poppins', 'sans-serif'],
                }
              }
            }
          }
        <\/script>
        <style>
          html::-webkit-scrollbar, 
          body::-webkit-scrollbar,
          pre::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0);
            border-radius: 10px;
          }

          html::-webkit-scrollbar-thumb, 
          body::-webkit-scrollbar-thumb,
          pre::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }

          html::-webkit-scrollbar-thumb:hover, 
          body::-webkit-scrollbar-thumb:hover,
          pre::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.11);
            border-radius: 10px; 
          }

          html::-webkit-scrollbar-track:hover, 
          body::-webkit-scrollbar-track:hover,
          pre::-webkit-scrollbar-track:hover {
            background: rgba(0, 0, 0, 0);
            border-radius: 10px; 
          }
          
          /* \u65B0\u589E\u5B57\u4F53\u6837\u5F0F */
          body {
            font-family: 'Noto Sans SC', sans-serif;
            letter-spacing: 0.015em;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Noto Sans SC', sans-serif;
          }
          
          /* \u6539\u8FDB\u9634\u5F71\u6548\u679C */
          .shadow-lg {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 
                        0 8px 10px -6px rgba(0, 0, 0, 0.03);
            transition: box-shadow 0.3s ease, transform 0.3s ease;
          }
          
          .shadow-lg:hover {
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.1), 
                        0 10px 20px -5px rgba(0, 0, 0, 0.07);
          }
          
          /* \u5361\u7247\u52A8\u753B\u6548\u679C */
          article {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          article:hover::before {
            box-shadow: 4px 4px 0px #bab5f8;
            transform: scale(1.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          /* \u6309\u94AE\u52A8\u753B\u6548\u679C */
          button, .pagination a {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }
          
          button:hover, .pagination a:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          button:active, .pagination a:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .image-modal.active {
            display: flex;
            opacity: 1;
          }

          .image-modal-content img.loaded {
            opacity: 1;
          }

          .back-to-top.visible {
            opacity: 1;
            visibility: visible;
          }

          .article-content img, .mt-4 img {
            cursor: pointer;
            transition: opacity 0.3s ease, transform 0.3s ease;
            background-color: #0c7cd51c;
            opacity: 0.5;
            will-change: opacity, transform;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          }

          .article-content img.loaded, .mt-4 img.loaded {
            opacity: 1;
          }

          .article-content img:hover, .mt-4 img:hover {
            opacity: 0.95;
            transform: scale(1.01);
          }

          .image-placeholder {
            opacity: 1;
            transition: opacity 0.3s ease;
            will-change: opacity;
          }

          div.loaded .image-placeholder {
            opacity: 0;
          }
          
          /* \u94FE\u63A5\u8FC7\u6E21\u6548\u679C */
          a {
            transition: color 0.3s ease, text-decoration 0.3s ease;
            position: relative;
          }
          
          a:not(.pagination a):hover {
            text-decoration: none;
          }
          
          a:not(.pagination a):after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -2px;
            left: 0;
            background: currentColor;
            transition: width 0.3s ease;
          }
          
          a:not(.pagination a):hover:after {
            width: 100%;
          }
          
          /* \u4EE3\u7801\u5757\u4F18\u5316 */
          pre {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin: 1.5em 0;
          }
          
          code {
            font-family: 'Roboto Mono', monospace;
          }
          
          /* \u9875\u9762\u52A0\u8F7D\u52A8\u753B */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          main {
            animation: fadeIn 0.6s ease-out;
          }
          
          article {
            animation: fadeIn 0.6s ease-out;
            animation-fill-mode: both;
          }
          
          article:nth-child(2) { animation-delay: 0.1s; }
          article:nth-child(3) { animation-delay: 0.2s; }
          article:nth-child(4) { animation-delay: 0.3s; }
          article:nth-child(5) { animation-delay: 0.4s; }
        </style>
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container w-full max-w-xl [@media(min-width:1921px)]:max-w-2xl mx-auto px-4 py-12 sm:px-4 sm:py-12">
          <section class="bg-white/95 dark:bg-gray-800/95 p-8 rounded-xl shadow-lg w-full backdrop-blur-sm transition-all duration-300">
            <header class="flex items-center justify-between">
              <div class="flex items-center">
                <a href="/" class="flex items-center" aria-label="\u8FD4\u56DE\u9996\u9875">
                  <h1 class="text-xl md:text-lg font-semibold font-poppins text-gray-800 dark:text-gray-100 mb-0 tracking-wide">`, '</h1>\n                </a>\n              </div>\n              <div class="flex items-center space-x-4">\n                <nav class="mr-1" aria-label="\u7F51\u7AD9\u5BFC\u822A">\n                  <ul class="flex space-x-2">\n                    ', '\n                  </ul>\n                </nav>\n                <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-500 hover:text-blue-700 focus:outline-none transition-all shadow-sm" aria-label="\u5207\u6362\u4E3B\u9898">\n                  <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>\n                </button>\n              </div>\n            </header>\n            <main class="mt-8 relative">\n              ', "\n            </main>\n            \n            <!-- \u5206\u9875\u5BFC\u822A -->\n            ", '\n          </section>\n        </div>\n\n        <button \n          id="back-to-top" \n          class="back-to-top fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md cursor-pointer z-50 opacity-0 invisible transition-all duration-300 ease-in-out transform hover:from-blue-600 hover:to-blue-700 hover:scale-110 hover:shadow-lg"\n          aria-label="\u8FD4\u56DE\u9876\u90E8"\n        >\n          <i class="ri-arrow-up-line text-xl" aria-hidden="true"></i>\n        </button>\n        \n        <!-- \u56FE\u7247\u9884\u89C8\u6A21\u6001\u6846 -->\n        <div \n          id="imageModal" \n          class="image-modal fixed inset-0 w-full h-full bg-black/90 z-[100] justify-center items-center opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity hidden backdrop-blur-sm"\n          aria-modal="true" \n          aria-label="\u56FE\u7247\u9884\u89C8"\n        >\n          <div class="image-modal-content relative max-w-[90%] max-h-[90%] will-change-transform transform-gpu">\n            <button \n              class="image-modal-close absolute -top-10 right-0 text-white text-2xl cursor-pointer bg-transparent border-none p-2 will-change-transform"\n              aria-label="\u5173\u95ED\u9884\u89C8"\n            >\n              <i class="ri-close-line" aria-hidden="true"></i>\n            </button>\n            \n            <div \n              class="image-loading absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-base flex flex-col items-center gap-2.5"\n              role="status" \n              aria-live="polite"\n            >\n              <div class="spinner w-10 h-10 border-[3px] border-white/30 rounded-full border-t-white animate-spin will-change-transform"></div>\n              <span>\u52A0\u8F7D\u4E2D...</span>\n            </div>\n            \n            <figure class="w-full h-full flex items-center justify-center">\n              <img \n                id="modalImage" \n                src="" \n                alt="\u9884\u89C8\u56FE\u7247" \n                loading="lazy" \n                class="max-w-full max-h-[90vh] max-w-[90vw] object-contain rounded opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity"\n              >\n            </figure>\n            \n            <button \n              class="image-modal-prev absolute top-1/2 -translate-y-1/2 left-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 will-change-transform hover:bg-black/70 hover:scale-110"\n              aria-label="\u4E0A\u4E00\u5F20"\n            >\n              <i class="ri-arrow-left-s-line" aria-hidden="true"></i>\n            </button>\n            \n            <button \n              class="image-modal-next absolute top-1/2 -translate-y-1/2 right-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 will-change-transform hover:bg-black/70 hover:scale-110"\n              aria-label="\u4E0B\u4E00\u5F20"\n            >\n              <i class="ri-arrow-right-s-line" aria-hidden="true"></i>\n            </button>\n          </div>\n        </div>\n\n        <script>\n        ', "\n        <\/script>\n      </body>\n    </html>\n  "])), siteName, title, siteName, navItemsHtml, articlesHtml, renderPagination({ currentPage, hasMore, isHomePage, tag }), clientScript);
}
__name(renderBaseHtml, "renderBaseHtml");
var clientScript = `
  (function() {
    function safeDomUpdate(callback) {
      requestAnimationFrame(callback);
    }

    // \u4E3B\u9898\u5207\u6362\u529F\u80FD
    function initThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const html = document.documentElement;

      const THEMES = ['system', 'light', 'dark'];
      let currentThemeIndex = 0; // 0: system, 1: light, 2: dark

      const themeConfig = {
        'light': {
          icon: 'ri-sun-fill',
          label: '\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F',
          apply: () => { html.classList.remove('dark'); localStorage.theme = 'light'; }
        },
        'dark': {
          icon: 'ri-moon-fill',
          label: '\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F',
          apply: () => { html.classList.add('dark'); localStorage.theme = 'dark'; }
        },
        'system': {
          icon: 'ri-contrast-fill',
          label: '\u5207\u6362\u5230\u7CFB\u7EDF\u6A21\u5F0F',
          apply: () => {
            localStorage.removeItem('theme');
            html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
          }
        }
      };

      function updateThemeUI(theme) {
        const config = themeConfig[theme];
        themeIcon.className = \`\${config.icon} text-lg\`;
        themeToggle.setAttribute('aria-label', config.label);
      }

      function applyTheme(theme) {
        safeDomUpdate(() => {
          themeConfig[theme].apply();
          updateThemeUI(theme);
          currentThemeIndex = THEMES.indexOf(theme);
        });
      }
        
      const storedTheme = localStorage.theme;
      if (storedTheme && THEMES.includes(storedTheme)) {
        applyTheme(storedTheme);
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        }
        updateThemeUI('system');
      }

      themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        const newTheme = THEMES[currentThemeIndex];
        applyTheme(newTheme);
      });

      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemPreferenceChange = (event) => {
        if (!localStorage.theme) {
          safeDomUpdate(() => {
            html.classList.toggle('dark', event.matches);
          });
        }
      };
      mediaQueryList.addEventListener('change', handleSystemPreferenceChange);
    }

    // \u8FD4\u56DE\u9876\u90E8\u529F\u80FD
    function initBackToTop() {
      const backToTopBtn = document.getElementById('back-to-top');
      if (!backToTopBtn) return;

      const pageTopSentinel = document.createElement('div');
      Object.assign(pageTopSentinel.style, {
        position: 'absolute', top: '0', left: '0', width: '1px', height: '1px', pointerEvents: 'none'
      });
      document.body.appendChild(pageTopSentinel);

      const observer = new IntersectionObserver((entries) => {
        safeDomUpdate(() => {
          backToTopBtn.classList.toggle('visible', !entries[0].isIntersecting);
        });
      }, {
        threshold: 0,
        rootMargin: '300px 0px 0px 0px'
      });

      observer.observe(pageTopSentinel);

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // \u56FE\u7247\u9884\u89C8\u529F\u80FD
    function initImageViewer() {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      const closeBtn = modal?.querySelector('.image-modal-close');
      const prevBtn = modal?.querySelector('.image-modal-prev');
      const nextBtn = modal?.querySelector('.image-modal-next');
      const loadingIndicator = modal?.querySelector('.image-loading');

      if (!modal || !modalImg || !closeBtn || !prevBtn || !nextBtn || !loadingIndicator) {
        console.warn('Image viewer elements not found. Skipping initialization.');
        return;
      }

      let currentArticleImages = [];
      let currentIndex = 0;
      let isModalActive = false;

      const lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
            lazyLoadObserver.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      function loadImageIntoModal(imgElement) {
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');

        modalImg.src = imgElement.currentSrc || imgElement.src;
        modalImg.alt = imgElement.alt || '\u9884\u89C8\u56FE\u7247';

        modalImg.onload = null;
        modalImg.onerror = null;

        const handleLoad = () => {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        };
        const handleError = () => {
          loadingIndicator.style.display = 'none';
          console.error('Modal image failed to load:', modalImg.src);
        };

        if (modalImg.complete && modalImg.naturalWidth > 0) {
          handleLoad();
        } else {
          modalImg.onload = handleLoad;
          modalImg.onerror = handleError;
        }
      }

      function updateNavigationButtons() {
        const hasMultipleImages = currentArticleImages.length > 1;
        safeDomUpdate(() => {
          prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
          nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        });
      }

      function showImageInModal(img, index) {
        if (isModalActive) return;

        isModalActive = true;
        currentIndex = index;

        safeDomUpdate(() => {
          loadImageIntoModal(img);
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
          updateNavigationButtons();
        });
      }

      function navigateImages(direction) { 
        if (currentArticleImages.length <= 1) return;

        currentIndex = (currentIndex + direction + currentArticleImages.length) % currentArticleImages.length;
        const targetImg = currentArticleImages[currentIndex];

        if (targetImg) {
          loadImageIntoModal(targetImg);
        }
      }

      function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isModalActive = false;

        currentArticleImages = [];
        currentIndex = 0;
      }

      function getAllPreviewImages() {
        return Array.from(document.querySelectorAll('[data-preview="true"]'));
      }

      function getImagesInContext(triggerImg) {
        const article = triggerImg.closest('article');
        return article ? Array.from(article.querySelectorAll('[data-preview="true"]')) : getAllPreviewImages();
      }

      function setupPageImages() {
        getAllPreviewImages().forEach(img => {
          if (!img.dataset.src && img.src && !img.src.startsWith('data:image/svg+xml')) {
            img.setAttribute('data-src', img.src);
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
          }
          lazyLoadObserver.observe(img);

          if (!img.classList.contains('loaded')) {
            const handleLoad = () => {
              if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
                if (img.parentNode) img.parentNode.classList.add('loaded');
              }
              img.removeEventListener('load', handleLoad); 
              img.removeEventListener('error', handleError);
            };
            const handleError = () => {
              console.error('Image failed to load:', img.src);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
            };

            if (img.complete) {
              if (img.naturalWidth > 0) {
                handleLoad();
              } else {
                handleError();
              }
            } else {
              img.addEventListener('load', handleLoad);
              img.addEventListener('error', handleError);
            }
          }
        });
      }

      closeBtn.addEventListener('click', closeModal);
      prevBtn.addEventListener('click', () => navigateImages(-1));
      nextBtn.addEventListener('click', () => navigateImages(1));

      modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Clicked on modal background
          closeModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        switch(e.key) {
          case 'Escape': closeModal(); break;
          case 'ArrowLeft': navigateImages(-1); break;
          case 'ArrowRight': navigateImages(1); break;
        }
      });

      document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('[data-preview="true"]');
        if (targetImg) {
          e.preventDefault();
          currentArticleImages = getImagesInContext(targetImg);
          const index = currentArticleImages.indexOf(targetImg);
          if (index !== -1) {
            showImageInModal(targetImg, index);
          }
        }
      }, { passive: false });

      const observer = new MutationObserver((mutations) => {
        let hasNewPreviewImages = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('[data-preview="true"]') || node.matches('[data-preview="true"]'))) {
                hasNewPreviewImages = true;
                break;
              }
            }
            if (hasNewPreviewImages) break;
          }
        }
        if (hasNewPreviewImages) {
          setupPageImages();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setupPageImages();
    }

    // \u521D\u59CB\u5316\u4EE3\u7801\u590D\u5236\u529F\u80FD
    function initCodeCopyButtons() {
      // Helper to update button state after copy operation
      function updateCopyButtonUI(button, success) {
        button.innerHTML = success ? '<i class="ri-check-line"></i>' : '<i class="ri-error-warning-line"></i>';
        button.classList.add('copied');
        setTimeout(() => {
          button.innerHTML = '<i class="ri-file-copy-line"></i>';
          button.classList.remove('copied');
        }, 2000);
      }

      document.querySelectorAll('.code-block').forEach(block => {
        const button = block.querySelector('.copy-btn');
        if (!button) return;

        if (button.dataset.hasCopyListener === 'true') return;
        button.dataset.hasCopyListener = 'true';

        button.addEventListener('click', () => {
          const originalCode = block.getAttribute('data-original-code');
          const codeText = originalCode ? decodeURIComponent(originalCode) : (block.querySelector('code')?.textContent || '');

          navigator.clipboard.writeText(codeText)
            .then(() => updateCopyButtonUI(button, true))
            .catch(() => {
              const textarea = document.createElement('textarea');
              textarea.value = codeText;
              Object.assign(textarea.style, {
                position: 'fixed', opacity: '0', top: '0', left: '0' 
              });
              document.body.appendChild(textarea);
              textarea.select();

              try {
                const successful = document.execCommand('copy');
                updateCopyButtonUI(button, successful);
              } catch (err) {
                console.error('Failed to copy via execCommand:', err);
                updateCopyButtonUI(button, false);
              } finally {
                document.body.removeChild(textarea);
              }
            });
        });
      });
    }

    // \u589E\u5F3A\u7684Markdown\u5904\u7406 (\u4E3B\u8981\u7528\u4E8E\u52A8\u6001\u5185\u5BB9\u52A0\u8F7D\u540E\u7684\u4EE3\u7801\u590D\u5236\u6309\u94AE\u521D\u59CB\u5316)
    function enhanceMarkdown() {
      const observer = new MutationObserver((mutations) => {
        let hasNewCodeBlocks = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('.code-block') || node.matches('.code-block'))) {
                hasNewCodeBlocks = true;
                break;
              }
            }
            if (hasNewCodeBlocks) break;
          }
        }
        if (hasNewCodeBlocks) {
          initCodeCopyButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      initCodeCopyButtons();
    }

    // \u9875\u9762\u52A0\u8F7D\u5B8C\u6210\u540E\u521D\u59CB\u5316\u6240\u6709\u529F\u80FD
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      enhanceMarkdown(); // Handles code copy buttons

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initBackToTop);
      } else {
        setTimeout(initBackToTop, 200);
      }
    });
  })();
`;

// src/routes.js
function createHtmlResponse(html2, cacheTime = 300, status = 200) {
  return new Response(html2, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": `public, max-age=${cacheTime}`
    },
    status
  });
}
__name(createHtmlResponse, "createHtmlResponse");
function handleRouteError(error, c, status = 500, cacheTime = 300) {
  console.error("\u8DEF\u7531\u5904\u7406\u5931\u8D25:", error);
  const errorPageHtml = renderBaseHtml(
    "\u9519\u8BEF",
    htmlTemplates.errorPage(error),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createHtmlResponse(errorPageHtml, cacheTime, status);
}
__name(handleRouteError, "handleRouteError");
function createNotFoundResponse(c) {
  return handleRouteError(new Error("\u9875\u9762\u672A\u627E\u5230"), c, 404, 300);
}
__name(createNotFoundResponse, "createNotFoundResponse");
var apiHandler = {
  /** @type {Map<string, {data: any, timestamp: number}>} 缓存存储 */
  cache: /* @__PURE__ */ new Map(),
  /** @type {number} 缓存过期时间（毫秒） */
  cacheTTL: 60 * 1e3,
  // 默认1分钟
  /**
   * 通用缓存检查函数。
   * @param {string} cacheKey
   * @returns {any|null} 缓存数据或null。
   */
  checkCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - this.cacheTTL) {
      return cached.data;
    }
    return null;
  },
  /**
   * 通用缓存更新函数。
   * @param {string} cacheKey
   * @param {any} data
   * @returns {any} 缓存的数据。
   */
  updateCache(cacheKey, data) {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },
  /**
   * 内部通用API请求器。
   * @param {string} url - API URL。
   * @param {string} cacheKey - 缓存键。
   * @returns {Promise<any>}
   */
  async _fetchAndCache(url, cacheKey) {
    const cachedData = this.checkCache(cacheKey);
    if (cachedData)
      return cachedData;
    console.log("\u8BF7\u6C42 API:", url);
    const response = await fetch(url, { headers: CONFIG.HEADERS });
    if (!response.ok) {
      const errorMsg = `API \u8BF7\u6C42\u5931\u8D25: ${response.status} - ${url}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return this.updateCache(cacheKey, data);
  },
  /**
   * 获取memos数据，支持分页和标签过滤。
   * @param {object} c - Hono上下文对象。
   * @param {string} [tag=''] - 标签。
   * @param {number} [page=1] - 页码。
   * @returns {Promise<Array<object>>}
   */
  async fetchMemos(c, tag = "", page = 1) {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const offset = (page - 1) * limit;
      const cacheKey = `memos_${tag}_${limit}_${offset}`;
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
      return this._fetchAndCache(apiUrl, cacheKey);
    } catch (error) {
      console.error("\u83B7\u53D6 memos \u6570\u636E\u5931\u8D25:", error);
      throw error;
    }
  },
  /**
   * 获取单条memo数据。
   * @param {object} c - Hono上下文对象。
   * @param {string} name - memo的名称（ID）。
   * @returns {Promise<object|null>}
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      const data = await this._fetchAndCache(apiUrl, cacheKey);
      return data;
    } catch (error) {
      console.error("\u83B7\u53D6\u5355\u6761 memo \u6570\u636E\u5931\u8D25:", error);
      return null;
    }
  }
};
function getPageLimit(c) {
  return c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
}
__name(getPageLimit, "getPageLimit");
function getPageFromUrlParams(c) {
  const url = new URL(c.req.url);
  const pageParam = url.searchParams.get("page");
  return pageParam ? parseInt(pageParam) : 1;
}
__name(getPageFromUrlParams, "getPageFromUrlParams");
async function handleMemoListRoute(c, { getPage, tag = "", isExplicitPageRoute = false, getTitle }) {
  try {
    const currentPage = getPage(c);
    if (isNaN(currentPage) || currentPage < 1) {
      return createNotFoundResponse(c);
    }
    const memos = await apiHandler.fetchMemos(c, tag, currentPage);
    console.log(`\u83B7\u53D6\u5230 ${tag ? tag + " \u6807\u7B7E\u9875" : "\u5217\u8868\u9875"} memos \u6570\u91CF:`, memos.length);
    if (memos.length === 0 && currentPage > 1 && isExplicitPageRoute) {
      return createNotFoundResponse(c);
    }
    const sortedMemos = utils.sortMemosByTime(memos);
    const memosHtml = sortedMemos.map((memo) => renderMemo(memo, true));
    const limit = getPageLimit(c);
    const hasMore = memos.length >= limit;
    const title = getTitle(currentPage, tag, c.env.SITE_NAME);
    return createHtmlResponse(
      renderBaseHtml(
        title,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true,
        // isList
        tag
      )
    );
  } catch (error) {
    return handleRouteError(error, c);
  }
}
__name(handleMemoListRoute, "handleMemoListRoute");
var routes = {
  // robots.txt路由 - 禁止所有搜索引擎抓取
  async robots(c) {
    return new Response("User-agent: *\nDisallow: /", {
      headers: { "Content-Type": "text/plain" }
    });
  },
  // 主页路由处理
  async home(c) {
    return handleMemoListRoute(c, {
      getPage: getPageFromUrlParams,
      tag: "",
      isExplicitPageRoute: false,
      getTitle: (page, tag, siteName) => siteName
      // 首页标题就是站点名称
    });
  },
  // 分页路由处理
  async page(c) {
    return handleMemoListRoute(c, {
      getPage: (ctx) => parseInt(ctx.req.param("number")),
      tag: "",
      isExplicitPageRoute: true,
      // 这是明确的分页路由
      getTitle: (page, tag, siteName) => `\u7B2C ${page} \u9875 - ${siteName}`
    });
  },
  // 单页路由处理
  async post(c) {
    try {
      const name = c.req.param("name");
      const data = await apiHandler.fetchMemo(c, name);
      if (!data || !data.memo) {
        return createNotFoundResponse(c);
      }
      const memoHtml = renderMemo(data.memo, false);
      const postTitle = data.memo.content?.split("\n")[0]?.substring(0, 30) + " - " + c.env.SITE_NAME;
      return createHtmlResponse(
        renderBaseHtml(
          postTitle,
          memoHtml,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ),
        1800
        // 30分钟缓存
      );
    } catch (error) {
      return handleRouteError(error, c);
    }
  },
  // 标签页路由处理
  async tag(c) {
    const tag = c.req.param("tag");
    return handleMemoListRoute(c, {
      getPage: getPageFromUrlParams,
      tag,
      isExplicitPageRoute: false,
      getTitle: (page, tag2, siteName) => `${tag2} - ${siteName}`
    });
  },
  // API代理 - 用于缓存资源 (保持原有逻辑，因为是JSON响应)
  async api(c) {
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
};

// src/index.js
var app = new Hono2();
app.use("*", async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error("\u9519\u8BEF:", err);
    return c.text("\u670D\u52A1\u5668\u9519\u8BEF", 500);
  }
});
app.get("/", routes.home);
app.get("/page/:number", routes.page);
app.get("/post/:name", routes.post);
app.get("/tag/:tag", routes.tag);
app.get("/api/v1/memo", routes.api);
app.get("/robots.txt", routes.robots);
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

// .wrangler/tmp/bundle-UGo9P6/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-UGo9P6/middleware-loader.entry.ts
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
