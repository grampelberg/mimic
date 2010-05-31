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
  this.callback = function(cb) {
    setTimeout(_.bind(cb, this, 'callback'), 100);
  };
  this.obj_callback = function(obj) {
    setTimeout(_.bind(obj.cb, this, 'obj_callback'), 100);
  };
  return this;
};

var normal_functions =  ['baz', 'raboof', 'zab.foo', 'zab.raboof', 'callback',
                         'obj_callback'];
var special_functions = [ '_bar', 'baz', 'raboof','callback',
                          'obj_callback'];

