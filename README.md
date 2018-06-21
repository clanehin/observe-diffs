observe-diffs: Observe shallow differences between successive plain JavaScript objects.
=======================================================================================

Creates an observer function that takes a single parameter. For each call to this function,
any shallow differences between the successive values of the parameter's fields
will trigger an event.

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

observeDiffs({ raised, updated, dropped, edge ... }) : function(object) : object
------------------------------------------------------------------------

Returns a function that observes differences between successive calls. Differences are
recognized for all shallow keys of the parameter and observations take place each
time the observer function is called.

All calls to listeners take the form of:

	function(key, previous_value, next_value, output_value)

In some cases parameters will be undefined. For example, `previous\_value` is
always undefined for the raised event, and `next\_value` is always undefined
for the dropped event.

A raised or updated listener *may* return an output value. That value will appear
in the result of the observer function. The output is also remembered and passed
back into the subsequent call to the listener.

