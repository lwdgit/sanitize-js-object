# sanitize-js-object

Make js object getter safer.


Eg:

var z = console.log(window.a.b.c.d)

Output:

var z = console.log(((((window || {}).a || {}).b || {}).c || {}).d)