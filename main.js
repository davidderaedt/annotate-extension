/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** extension to generate JSDoc annotations for functions */
define(function (require, exports, module) {
    'use strict';


    var AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        Menus = brackets.getModule("command/Menus"),
        Acorn_loose = require("thirdparty/acorn/acorn_loose"),
        Walker = require("thirdparty/acorn/util/walk");

    var EMPTY_MSG = "No function found";
    var COMMAND_ID = "annotate.annotate";
    var MENU_NAME = "Annotate function";

    // Global editor instance
    var _editor = {};
    var _output = {};
    
    
    /**
     * Create a jsdoc annotation and prepend it in the active document
     */ 
    var annotate = function () {
        // Get current active editor
        _editor = EditorManager.getCurrentFullEditor();

        //Get cursor position and set it to the beginning of the line
        var pos = _editor.getCursorPos();
        pos.ch = 0;

        // Get the text from the start of the document to the current cursor position and count it's length'
        var txtTo = _editor._codeMirror.getRange({
            line: 0,
            ch: 0
        }, pos);
        var cursorPosition = txtTo.length;

        // Get full txt
        var fullTxt = _editor._codeMirror.getValue();

        // Parse text
        var acornTxtFull = Acorn_loose.parse_dammit(fullTxt, {
            locations: true
        });

        // Find next function
        var found = new Walker.findNodeAfter(acornTxtFull, cursorPosition, "Function");

        if (found) {
            // There was a result, so build jsdoc
            _output = {};
            _output.loc = found.node.loc;
            _output.prefix = "";
            _output.name = found.node.id ? found.node.id.name : null;
            _output.params = [];
            _output.returnValue = undefined;

            // Add parameters to the _output object
            found.node.params.forEach(function (param) {
                _output.params.push(param.name);
            });

            // Find and add return value
            var foundReturnValue = new Walker.findNodeAfter(found.node, 0, "ReturnStatement");
            _output.returnValue = foundReturnValue.node ? foundReturnValue.node.argument.name : undefined;

            // set prefix (find first none whitespace character)
            var codeLine = _editor._codeMirror.getLine(_output.loc.start.line - 1);
            _output.prefix = codeLine.substr(0, codeLine.length - codeLine.trimLeft().length).replace(/[^\s\n]/g, ' ');

            // build annotation string
            var _outputString = _getJSDocString(_output);

            // insertJsdoc string into editor
            _insertJSDocString(_outputString, _output.loc);
        } else {
            // No function definition found
            window.alert(EMPTY_MSG);
        }
    };

    /**
     * Get a functions name 
     */ 
    var _getName = function () {
        //Todo
    };

    /**
     * Get a functions return value
     */ 
    var _getReturnValue = function () {
        //Todo
    };

    /**
     * Build the string representation of the  
     * @param {object} jsdoc object containing jsdoc properties 
     * @returns {string} annotation as a string 
     */ 
    var _getJSDocString = function (jsdoc) {
        var jsdocString = jsdoc.prefix + "/**\n";

        if (jsdoc.name && jsdoc.name.charAt(0) === "_") {
            jsdocString += jsdoc.prefix + " * @private \n";
        }

        // Add description
        jsdocString += jsdoc.prefix + " * Description \n";

        jsdoc.params.forEach(function (param) {
            jsdocString += jsdoc.prefix + " * @param {type} " + param + " Description \n";
        });
        if (jsdoc.returnValue)
            jsdocString += jsdoc.prefix + " * @returns {type} Description \n";

        jsdocString += jsdoc.prefix + " */ \n";

        return jsdocString;
    };

    /**
     * Insert the JSDoc annotation string to the document 
     * @param {string} jSDocString The JSDoc annotation string
     * @param {location} loc location of the function found 
     */ 
    var _insertJSDocString = function (jSDocString, loc) {
        var pos = {
            line: loc.start.line - 1,
            ch: 0
        };

        // Place jsdocString in the editor
        _editor._codeMirror.replaceRange(jSDocString, pos);

        EditorManager.focusEditor();
    };

    // Register stuff when brackets finished loading
    CommandManager.register(MENU_NAME, COMMAND_ID, annotate);
    KeyBindingManager.addBinding(COMMAND_ID, "Ctrl-Alt-A");

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID); //"menu-edit-annotate", 
});