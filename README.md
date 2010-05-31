Mimic takes functions and monitors what they do. It then stubs those functions
out and mimics their behavior returing the same outputs as when it monitored
them in the past.

# Usage

To monitor an object's function calls and return values:

    var my_obj = {
        fn: funciton(foo, bar) {
            return [bar, foo];
        }
    }
    var m = mimic(my_obj);
    m.record()
    my_obj.fn('a', 'b');
    // [ 'b', 'a' ]'
    m.get_history('fn');
    // [ { "out": ["b", "a"], "args": ["a", "b"] } ]

You can then save this history for later consumption:

    m.save('http://localhost:8080/mimic/my_obj.json');

Then, from somewhere else, you can load that history up and mimic that
session's behavior:

    var m = mimic(my_obj);
    m.fetch('http://localhost:8080/mimic/my_obj.json');
    m.replay();
    my_obj.fn('a', 'b');
    // ["b", "a"]

# node.js

# Browser
