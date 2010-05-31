/*
 * Record interactions with javascript objects and functions.
 *
 * Dependencies:
 *     underscore.js (because I'm lazy and it's awsome)
 *     json2.js (in IE)
 *     jquery.js (for saving, fetching)
 */

var mimic = function(obj, priv, not_recursive) {
  return new mimic.fn.init(obj, priv, not_recursive);
};

mimic.fn = mimic.prototype = {
  init: function(obj, priv, not_recursive) {
    this.obj = obj;
    this.priv = priv;
    this.not_recursive = not_recursive;
    this.history = {};
    this.functions = [];
    this.defaults = {
      save: this._post,
      fetch: this._get
    };
    return this;
  },
  record: function() {
    this._wrap(this._report);
  },
  replay: function() {
    this._wrap(this._stub);
  },
  _wrap: function(wrapper) {
    var self = this;
    function inspect(obj, path) {
      _.each(obj, function(v, k) {
        // Just so happens that since strings are iterables, you end up having
        // an infinite recursion problem with this special case.
        if (_.isString(v)) return
        if (!self.priv && _.isString(k) && k.match(/^_.*/)) return
        var current_path = path ? path + '.' + k : k;
        if (_.isFunction(v)) {
          self.functions.push(current_path);
          obj[k] = _.wrap(v, _.bind(wrapper, self, current_path, obj));
          return
        }
        if (!self.not_recursive) return inspect(v, current_path);
      });
    }
    inspect(self.obj);
  },
  log: function() {
    /*
     * Echo interactions to the configured logger.
     */
  },
  _report: function(name, obj, fn) {
    var args = _.toArray(arguments).slice(3);
    var resp = fn.apply(obj, args);
    this.get_history(name).push({ out: resp, args: args });
    return resp;
  },
  _stub: function(name, obj, fn) {
    var resp = this.get_history(name).pop()
    if (!resp)
      return fn.apply(this, _.toArray(arguments).slice(3));
    return resp['resp'];
  },
  get_history: function(name) {
    if (name in this.history) return this.history[name];
    this.history[name] = [];
    return this.history[name];
  },
  save: function(path, fn) {
    if (!fn)
      fn = this.defaults.save;
    fn(path);
  },
  _post: function(path) {
    $.post(path, JSON.stringify(this.history));
  },
  fetch: function(path, fn) {
    if (!fn)
      fn = this.defaults.fetch
    fn(path);
  },
  _get: function(path) {
    var self = this;
    $.get(path, function(v) {
      self.history = JSON.parse(v);
    });
  }
};

mimic.fn.init.prototype = mimic.fn;

mimic.extend = mimic.fn.extend = function() {
  // Later, no really.
}

