module('index');

test('mimic()', function() {
  expect(9);

  var obj = new test_obj();
  var m = mimic(obj);
  equals(m.obj, obj, "Internal obj == constructor.");
  ok(!m.priv, "Default param (ignore private functions)");
  ok(!m.not_recursive, "Default param (recursive)");

  var m = mimic(obj, true, true);
  ok(m.priv, "Constructor param (include private functions)");
  ok(m.not_recursive, "Constructor param (don't recurse)");

  equals(m.defaults.save, m._post, "Default save function.");
  equals(m.defaults.fetch, m._get, "Default fetch function.");

  same(m.history, {}, "History is an object/dictionary");
  same(m.functions, [], "Bound functions list is an array");
});

test('mimic().get_history', function() {
  expect(2);

  var m = mimic(new test_obj());
  same(m.get_history('foobar'), [], 'Empty list for new function history.');
  same(m.history, { foobar: [] }, 'Auto-insert new commands to history.');
});

test('mimic().record', function() {
  expect(13);

  var obj = new test_obj();
  var m = mimic(obj);

  // ignore private functions, recurse
  m.record();
  same(m.functions, normal_functions,
       "Ignore private functions, recurse");
  same(obj.baz(), 'baz', 'No changes to return values');
  same(m.get_history('baz'), [ { out: 'baz', args: [] } ],
       'History is recorded');
  obj._bar();
  same(m.get_history('_bar'), [], 'Private functions are ignored.');
  equals(obj.raboof(), 'raboof',
       "'this' context on the object is correctly bound.");
  same(m.get_history('raboof'), [ { out: 'raboof', args: [] } ],
       'More history, just in case.');
  obj.zab.foo();
  same(m.get_history('zab.foo'), [ { out: 'zab.foo', args: [] } ],
       "Recursion is working");
  same(obj.zab.raboof(), 'foobar', "'this' works for multi-level objects.");


  // record() arguments
  var obj = new test_obj();
  var m = mimic(obj);
  m.record();
  obj.baz('a', 'b', [], {}, 1);
  same(m.get_history('baz'), [ { out: 'baz', args: ['a', 'b', [], {}, 1] } ],
       "Arguments are getting saved correctly.");

  // include private functions, don't recurse
  var obj = new test_obj();
  var m = mimic(obj, true, true);
  m.record();
  same(m.functions, special_functions, 'Incude private, don\'t recurse');
  equals(obj._bar(), '_bar', 'Private function exists.');
  same(m.get_history('_bar'), [ { out: '_bar', args: [] } ],
       "Private functions are recorded.");
  obj.zab.foo();
  same(m.get_history('zab.foo'), [], "Recursion didn't occur.");
});

test('mimic().record - argument callbacks', function() {
  expect(2);
  stop();

  var obj = new test_obj();
  var m = mimic(obj);
  m.record();
  var verify = function() {
    same(m.get_history('callback.0'),
         [ { out: 'callback', args: ['callback'] } ],
         "Full history of the callback in the root object.");
    start();
  };

  obj.callback(function(v) {
    setTimeout(verify, 1);
    return v
  });
  same(m.get_history('callback.0'), [], 'No history yet.');
});

test('mimic().record - argument (object) callbacks', function() {
  expect(2);
  stop();

  var obj = new test_obj();
  var m = mimic(obj);
  m.record();
  var verify = function() {
    same(m.get_history('obj_callback.0.cb'),
         [ { out: 'obj_callback', args: ['obj_callback'] } ],
         "Full history of the callback in the root object.");
    start();
  };
  obj.obj_callback({ cb: function(v) {
    setTimeout(verify, 1);
    return v
  } });
  same(m.get_history('obj_callback.0.cb'), [], 'No history yet.');
});

test('mimic().replay - argument callbacks', function() {
  expect(1);
  stop();

  var obj = new test_obj();
  var m = mimic(obj);
  m.defaults.fetch = function(p) {
    this.history = { "callback": [ { out: undefined, args: [] } ],
                     "callback.0": [ { out: "zxcv", args: ["zxcv"] } ] };
  };
  m.fetch('none');
  m.replay();
  obj.callback(function(v) {
    equals(v, 'zxcv');
    start();
  });
});

test('mimic().replay - argument (object) callbacks', function() {
  expect(1);
  stop();

  var obj = new test_obj();
  var m = mimic(obj);
  m.defaults.fetch = function(p) {
    this.history = { "obj_callback": [ { out: undefined, args: [] } ],
                     "obj_callback.0.cb": [ { out: "zxcv", args: ["zxcv"] } ] };
  };
  m.fetch('none');
  m.replay();
  obj.obj_callback({ cb: function(v) {
    equals(v, 'zxcv');
    start();
  }
                   });
});

test('mimic().fetch', function() {
  expect(2);

  var obj = new test_obj();
  var m = mimic(obj);

  var hist = { baz: [ { out: "zxcv", args: [] } ],
               "zab.foo": [ { out: "vbnm", args: [] } ] };
  m.defaults.fetch = function(p) {
    this.history = hist;
  };
  ok(!m.fetch('data/replay.json'), 'Fetching runs.');
  same(m.history, hist, 'History has been set.');
});

test('mimic().save', function() {
  expect(2);

  var obj = new test_obj();
  var m = mimic(obj);

  var hist = { baz: [ { out: "zxcv", args: [] } ],
               "zab.foo": [ { out: "vbnm", args: [] } ] };
  var saved = {};
  m.defaults.save = function(p) {
    saved = this.history;
  };
  m.history = hist;
  ok(!m.save('data/replay.json'), 'Can actually save.');
  same(saved, hist, 'Correctly saved off.');
});

test('mimic().replay', function() {
  expect(8);

  var obj = new test_obj();
  var m = mimic(obj);

  m.defaults.fetch = function(p) {
    this.history = { baz: [ { out: "zxcv", args: [] } ],
                     "zab.foo": [ { out: "vbnm", args: [] } ] };
  };
  ok(!m.fetch('data/replay.json'), 'Can acutally fetch stuff.');
  ok(!m.replay(), 'Replay hooks up right.');
  same(m.functions, normal_functions, 'Ignore private functions, recurse');
  same(m.get_history('baz'), [ { "out": "zxcv", args: [] } ],
       'History has been setup right by fetch.');

  equals(obj.baz(), 'zxcv',
         'Function has been stubbed and is returning history right.');
  same(m.get_history('baz'), [],
       'History is getting decremented on stub call.');
  equals(obj.zab.foo(), 'vbnm', 'Recursive functions are working.');
  same(m.get_history('zab.foo'), [],
       'History is getting decremented at any level.');
});
