Brackets JSDoc Annotate
=================

A brackets extension to generate JSDoc annotations for your functions.

To install, place the ```annotate``` folder inside the ```brackets/src/extensions/user``` folder.

**Compatible with Brackets Sprint10**

Usage
=====
Open a project in Brackets, place your cursor before a function definition, and select ```Annotate``` form the ```Edit``` menu.

This will create a JSDoc like annotation according to the function signature.  It will add ```@private``` if the function starts with an underscore. It will create a ```@param``` for each parameter.


Known issues
=====

Annotations are not correctly indented.

No ```@return``` is generated since the extension only looks at the function signature to generate the annotation, not its body.
