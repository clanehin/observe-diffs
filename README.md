observe-diffs: Observe shallow differences between successive plain JavaScript objects.
=======================================================================================

Produces a function which can be called multiple times. For each shallow key in the parameter,
if that key changes between successive calls, certain events will fire.

Motivation
----------

Observe-diffs facilitates conforming some instanced mutable data with a source
of pure immutable data. Only values that change need to be updated. React, for
example, does this with the DOM, but this function is more general purpose.

Events
------

### raised

A raised even first whenever a previously undefined field appears in the result
object.

### updated

An updated event fires whenever a field is not reference-identical to it's
previous value (including when it is raised, but not when it is dropped).

### dropped

A dropped event fires whenever a field is no longer defined in the result
object.

Usage
-----

	const observeDiffs = require('observe-diffs');

observeDiffs({ raised, updated, dropped }) : function(object) : object
------------------------------------------------------------------------

Returns a function that observes diffs between successive calls. Diffs are
recognized for all shallow keys of the parameter and observations take place each
time the observer function is called.

All calls to listeners take the form of:

	function(key, previous_value, next_value, output_value)

In some cases parameters will be undefined. For example, previous\_value is
always undefined for the raised event.

A raised or updated listener may return an output value. That value will appear
in the result of the observer function. The output is remembered and passed
back into each subsequent call of the listener.

