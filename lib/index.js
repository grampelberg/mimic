/*
 * Record interactions with javascript objects and functions.
 *
 * Dependencies:
 *     underscore.js (because I'm lazy and it's awsome)
 *     json2.js (in IE)
 *     jquery.js (for saving, fetching)
 *
 * Todo:
 *     Take a function as an input to monitor only that function.
 */

window.onerror = function() {
    alert(printStackTrace().join('\n\n'));
}

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
    // This is a hack that should get removed.
    this.ignore = [ 'Event' ];
    return this;
  },
  record: function() {
    this._wrap(this._report);
  },
  replay: function() {
    this._wrap(this._stub);
  },
  _each: function(obj, iterator, context) {
    // This is a special  copy of _.each that doesn't use the native forEach
    // since it gets confused on some objects.
    var breaker = typeof StopIteration !== 'undefined' ?
      StopIteration : '__break__';
    try {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) iterator.call(context, obj[key],
                                                         key, obj);
      }
    } catch (e) {
      if (e != breaker) throw e
    }
    return obj;
  },
  _parent: function(obj) {
    // To wrap functions passed in as root (jQuery.ajax for example), need to
    // find the parent to be able to assign the wrapped function.
    /* someday ..... */
  },
  _wrap: function(wrapper, base_obj, base_path) {
    // XXX - Probably shouldn't wrap things more than once. Add a parameter to
    // every function that shows it's wrapped.
    var self = this;
    function inspect(obj, path) {
      self._each(obj, function(v, k) {
        // Just so happens that since strings are iterables, you end up having
        // an infinite recursion problem with this special case.
        if (_.isString(v)) return
        if (!self.priv && _.isString(k) && k.match(/^_.*/)) return
        var current_path = path ? path + '.' + k : k.toString();
        // A hack to get away from recursive loops.
        if (self.ignore.indexOf(current_path) != -1) return
        if (_.isFunction(v)) {
          self.functions.push(current_path);
          obj[k] = _.wrap(v, _.bind(wrapper, self, current_path, obj));
          _.extend(obj[k], v);
          return
        }
        if (!self.not_recursive) return inspect(v, current_path);
      });
    }
    inspect(base_obj ? base_obj : self.obj , base_path);
  },
  log: function() {
    /*
     * Echo interactions to the configured logger.
     */
  },
  _report: function(name, obj, fn) {
    console.log(name);
    var args = _.toArray(arguments).slice(3);
    this._wrap(this._report, args, name);
    var resp = fn.apply(obj, args);
    console.log(resp);
    this.get_history(name).push({ out: resp, args: args });
    return resp;
  },
  _stub: function(name, base_obj, fn) {
    var self = this;
    var args = _.toArray(arguments).slice(3);
    var resp = this.get_history(name).pop();
    this._wrap(this._cb_stub, args, name);
    function call(obj, path) {
      _.each(obj, function(v, k) {
        if (_.isString(v)) return
        var current_path = path ? path + '.' + k : k.toString();
        if (_.isFunction(v)) {
          setTimeout(_.bind(v, self, base_obj), 100);
          return
        }
        call(v, current_path);
      });
    };
    call(args, name);
    if (!resp)
      return fn.apply(this, _.toArray(arguments).slice(3));
    return resp['out'];
  },
  _cb_stub: function(name, obj, fn) {
    var resp = this.get_history(name).pop();
    // If there isn't any history, there's no way to figure out what to do,
    // just fail (if somewhat silently).
    if (!resp)
      return
    return fn.apply(obj, resp.args);
  },
  get_history: function(name) {
    if (name in this.history) return this.history[name];
    this.history[name] = [];
    return this.history[name];
  },
  save: function(path) {
    _.bind(this.defaults.save, this)(path);
  },
  _post: function(path) {
    $.post(path, JSON.stringify(this.history));
  },
  fetch: function(path) {
    _.bind(this.defaults.fetch, this)(path);
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
