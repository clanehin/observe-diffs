observe-diffs: Observe shallow differences between successive plain JavaScript objects.
=======================================================================================

Produces a function which can be called multiple times with a parameter that
may change between successive calls. For each shallow own key in the parameter, if
that key changes between successive calls, certain events will fire.

Motivation
----------

Observe-diffs makes it possible to create stateful, mutable representations of
a stream of immutable data points. Only values that change need to be updated.
Values can appear or disappear from the input stream at any time.

Observe-diffs facilitates solutions to some of the same problems that an
function reactive programming solution would solve. For example, you might use
observe-diffs to implement integral, derivative, or edge detection on a stream
of incoming values.

Parameters
----------

### raised

A raised event fires whenever a previously non-existant key appears in the
input.

### updated

An updated event fires whenever a previously existing value changes. Values are
tested via the edge method, by default, Object.is().

### dropped

A dropped event fires whenever a previously extant key is no longer present in
the input.

### edge

Tests whether or not two values are considered equal. By default, this is equivalent
to Object.is().

Usage
-----

observeDiffs({ raised, updated, dropped, egde ... }) : function(object) : object
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

