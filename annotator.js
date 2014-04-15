/*
Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(['exports', 'thirdparty/esprima-master/esprima', 'thirdparty/lodash-amd/modern/main'], function (exports, esprima, _) {
    /**
     * From esmorph.js:
     * Traverse a AST and run a visitor function on each node
     * @param {type} object to run visitor on
     * @param {type} visitor The function that should be run on visitor
     * @param {type} path Description
     */
    function traverse(object, visitor, path) {
        var key, child;

        if (typeof path === 'undefined') {
            path = [];
        }

        visitor.call(null, object, path);
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                if (typeof child === 'object' && child !== null) {
                    traverse(child, visitor, [object].concat(path));
                }
            }
        }
    }

    /**
     * From esmorph.js
     * Find a return statement within a function which is the exit for
     * the said function. If there is no such explicit exit, a null
     * will be returned instead.
     * @param {object} functionNode The node that should be inspected for a return statement
     */
    function findExit(functionNode) {
        var exit = null;

        function isFunction(node) {
            return node.type && node.range &&
                (node.type === esprima.Syntax.FunctionDeclaration ||
                node.type === esprima.Syntax.FunctionExpression);
        }

        traverse(functionNode, function (node, path) {
            var i, parent;
            if (node.type === esprima.Syntax.ReturnStatement) {
                for (i = 0; i < path.length; ++i) {
                    parent = path[i];
                    if (isFunction(parent)) {
                        if (parent.range === functionNode.range) {
                            exit = node;
                        }
                        break;
                    }
                }
            }
        });

        return exit;
    }

    /**
     * Add node.loc.start.column spaces to get the same indentation as the node
     * @param {type} node The node you want to get the indentation for
     */
    function getIndentation(node) {
        return Array(node.loc.start.column).join(' ');
    }

    /**
    * Build the type specific jsDoc parts
    * @param {node} node The node you want to build the jsDoc for
    * @param {string} indentation The indentation the jsDoc string should get
    * @return {string} Returns type specific jsDocs part
    */
    function buildJsDoc(node, indentation) {
        var jsDoc = "";
        switch (node.type) {
            case esprima.Syntax.Literal:
                jsDoc += "\n" + indentation + " * @type {" + typeof node.value + "}";
                break;
            case esprima.Syntax.FunctionDeclaration:
            case esprima.Syntax.FunctionExpression:
                jsDoc += "\n" + indentation + " * @type {function}";
                _.forEach(node.params, function (v, key) {
                    jsDoc += getParamString(v, indentation);
                });
                jsDoc += getReturnString(node, indentation);
                break;
            case esprima.Syntax.ObjectExpression:
                jsDoc += "\n" + indentation + " * @type {object}";
                break;
            default:
                break;
        }
        return jsDoc;
    }

    /**
     * Returns the jsDoc string representation for a parameter of a function
     * @param {type} param The parameter you want to get the jsDoc representation for
     * @return {type} Description
     */
    function getParamString(param, indentation) {
        return "\n" + indentation + " * @param {Type} " + param.name + " Description";
    }

    /**
     * Try to find a return statement to a function, if it finds one, return the corresponding jsDoc string
     * @param {type} node The node from which you want to find the return value.
     * @return {type} Description
     */
    function getReturnString(node, indentation) {
        var returnStatement = findExit(node);
        //Todo: find the type of the returned argument, as it is, it's always an object
        return (_.isObject(returnStatement) ? "\n" + indentation + " * @return {" + typeof returnStatement.argument + "} Description" : "");
    }

    /**
     * Annotate ExpressionStatement
     * @param {type} node The ast node you want to annotate
     * @return {type} Description
     */
    exports.ExpressionStatement = function (node) {
        var indentation = getIndentation(node),
            jsDoc = "/**";
        
        jsDoc += "\n" + indentation + " * Description";

        switch (node.expression.type) {
            case esprima.Syntax.Literal:
            case esprima.Syntax.CallExpression:
                return;
            case esprima.Syntax.AssignmentExpression:
                if (node.expression.left.property.name === node.expression.left.property.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";
                jsDoc += buildJsDoc(node.expression.right, indentation);
        }

        jsDoc += "\n" + indentation + " */\n" + indentation;
        return jsDoc;
    };

    /**
     * Annotate VariableDeclaration
     * @param {type} node Description
     * @return {type} Description
     */
    exports.VariableDeclaration = function (node) {
        // Add node.loc.start.column spaces to get the same indentation as the node
        var indentation = getIndentation(node),
            jsDoc = "/**";
        
        jsDoc += "\n" + indentation + " * Description";

        // Add each declaration
        _.forEach(node.declarations, function (value, key) {
            jsDoc += "\n" + indentation + " * @name " + value.id.name; //Todo: remove this line, as jsDoc will check the name at generation time

            // check if variable is uppercase, if so, it's a constant
            if (value.id.name === value.id.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";

            // check the type with which the variable is initialized
            if (value.init !== null) {
                jsDoc += buildJsDoc(value.init, indentation);
            }

            // check if first character is an underline, if so it's a private variable
            if (value.id.name.charAt(0) === '_') jsDoc += "\n" + indentation + " * @private";
        });
        jsDoc += "\n" + indentation + " */\n" + indentation;
        return jsDoc;
    };

    /**
     * Annotate FunctionDeclaration
     * @param {type} node Description
     */
    exports.FunctionDeclaration = function (node) {
        var indentation = getIndentation(node),
            jsDoc = "/**";
        
        jsDoc += "\n" + indentation + " * Description";
        jsDoc += buildJsDoc(node, indentation);
        jsDoc += "\n" + indentation + " */\n" + indentation;

        return jsDoc;
    };

    /**
     * Annotate Properties
     * @param {type} node Description
     * @return {type} Description
     */
    exports.Property = function (node) {
        var indentation = getIndentation(node),
            jsDoc = "/**";
        
        jsDoc += "\n" + indentation + " * Description";
        jsDoc += "\n" + indentation + " * @name " + node.key.name;

        // check if variable is uppercase, if so, it's a constant
        if (node.key.name === node.key.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";

        // check the type with which the variable is initialized
        if (node.value !== null) {
            jsDoc += buildJsDoc(node.value, indentation);
        }

        // check if first character is an underline, if so it's a private variable
        if (node.key.name.charAt(0) === '_') jsDoc += "\n" + indentation + " * @private";

        jsDoc += "\n" + indentation + " */\n" + indentation;

        return jsDoc;
    };
});