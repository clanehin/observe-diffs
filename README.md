observe-diffs: Observe shallow differences between successive plain JavaScript objects.
=======================================================================================

Produces a function which can be called multiple times with a parameter that
may change between successive calls. For each shallow key in the parameter, if
that key changes between successive calls, certain events will fire.

Motivation
----------

Observe-diffs facilitates conforming some instanced mutable data with a source
of pure immutable data. Only values that change need to be updated. React, for
example, does this with the DOM, but this function is more general purpose.

Events
------

### raised

A raised event fires whenever a previously non-existant key appears.

### updated

An updated event fires whenever a value changes according to Object.is. This
includes immediately after the key is raised, but not when it is dropped.

### dropped

A dropped event fires whenever a previously extant key is no longer found.

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

