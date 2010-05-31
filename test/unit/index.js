module('index');


var test_obj = function() {
  var sub_obj = function() {
    this.foo = function() { return 'zab.foo' };
    this.bar = 1;
    this.foobar = 'foobar';
    this.raboof = function() { return this.foobar };
    this._baz = function() { return 'zab._baz' };
    return this;
  };
  this.foo = 1;
  this.foobar = 'raboof';
  this._bar = function() { return '_bar' };
  this.baz = function() { return 'baz' };
  this.raboof = function() { return this.foobar };
  this.zab = new sub_obj();
  return this;
};

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
  expect();

  var obj = new test_obj();
  var m = mimic(obj);

  // ignore private functions, recurse
  m.record();
  same(m.functions, ['baz', 'raboof', 'zab.foo', 'zab.raboof'],
       "Ignore private functions, recurse");
  same(obj.baz(), 'baz', 'No changes to return values');
  same(m.get_history('baz'), [ { resp: 'baz', args: [] } ],
       'History is recorded');
  equals(obj.raboof(), 'raboof',
       "'this' context on the object is correctly bound.");
  same(m.get_history('raboof'), [ { resp: 'raboof', args: [] } ],
       'More history, just in case.');
  obj.zab.foo();
  same(m.get_history('zab.foo'), [ { resp: 'zab.foo', args: [] } ],
       "Recursion is working");
  same(obj.zab.raboof(), 'foobar', "'this' works for multi-level objects.");

  // record() arguments
  var obj = new test_obj();
  var m = mimic(obj);
  m.record();
  obj.baz('a', 'b', [], {}, 1);
  same(m.get_history('baz'), [ { resp: 'baz', args: ['a', 'b', [], {}, 1] } ],
       "Arguments are getting saved correctly.");

  // include private functions, don't recurse

});
