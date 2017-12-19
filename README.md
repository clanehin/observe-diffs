observe-diffs: Observe shallow differences between successive plain JavaScript objects.
=======================================================================================

A screamlet is simply a way to call a function that returns an object, while
receiving an event whenever certain aspects of the object change with each
subsequent call.

These events are:

raised
------

Whenever a previously undefined field appears in the result object.

updated
-------

Whenever a field is not reference-identical to it's previous value (including
when it is raised, but not when it is dropped).

dropped
-------

Whenever a field is no longer defined in the result object.

Motivation
==========

Observe-diffs facilitates conforming some instanced mutable data with a source
of pure immutable data. Only values that change need to be updated. React, for
example, does this with the DOM, but this function is more general purpose.

API
===

	const observeDiffs = require('observe-diffs');

observeDiffs({ raised, updated, dropped }) : function(object) : object
------------------------------------------------------------------------

Constructs a function that observes diffs between successive calls. Diffs are
recognized for all shallow keys of the parameter and observations take place each
time the observer function is called. An event listener can return a value,
which will appear in the return value of the observer function.

All calls to listeners take the form of:

	function(key, previous_value, next_value, output_value)

A raised or updated listener may return an output value. That value will appear
in the result of the observer function. The output is remembered and passed
back into each subsequent call of the listener.

