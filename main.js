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
        esprima = require("thirdparty/esprima-master/esprima"),
        estraverse = require("thirdparty/estraverse-master/estraverse"),
        annotator = require("annotator"),
        _ = require("thirdparty/lodash-amd/modern/main");

    var EMPTY_MSG = "No function found";
    var DUPLICATE_MSG = "There is already some JSDoc for the next annotatable";
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
        //pos.ch = 0;

        // Get the text from the start of the document to the current cursor position and count it's length'
        var txtTo = _editor.document.getRange({
            line: 0,
            ch: 0
        }, pos);
        var cursorPosition = txtTo.length;

        // Get full txt
        var fullTxt = _editor.document.getText();

        // get the ast
        var ast = esprima.parse(fullTxt, {
            tolerant: true,
            attachComment: true,
            loc: true,
            range: true
        });

        var isAnnotated = false;
        var lastAnnotatable;

        // traverse the ast
        estraverse.traverse(ast, {
            enter: enter
        });

        function enter(node, parent) {
            // If one annotation is done, break traversing the tree
            if (isAnnotated) return estraverse.VisitorOption.Break;

            // Check if node is annotatable and if so, call it's anotation function
            if (isAnnotatable(node) && node.range[0] < cursorPosition) {
                lastAnnotatable = node;
            }

            // Annotate the last annotatable
            if (node.range[0] > cursorPosition) {
                isAnnotated = true;
                var jsDoc;
                // Create jsDoc annotation
                jsDoc = annotator[lastAnnotatable.type](lastAnnotatable, parent);

                // Check if there is already a jsdoc annotation for this annnotatable
                var jsDocCommentExists = false;
                _.forEach(lastAnnotatable.leadingComments, function (value, key) {
                    if (value.type === "Block" && value.value.charAt(0) === "*") {
                        // jsDoc comment
                        jsDocCommentExists = true;
                        //Todo: Maybe ask, whether user wants to overwrite last comment?...
                    }
                });

                // Insert jsDoc into output variable
                if (_.isString(jsDoc) && !jsDocCommentExists) {
                    var insertLocation = {
                        line: lastAnnotatable.loc.start.line - 1,
                        ch: lastAnnotatable.loc.start.column
                    };
                    _editor.document.replaceRange(jsDoc, insertLocation);
                    EditorManager.focusEditor();
                }
            }
        }

        /**
         * Check if a node is of an annotatable type
         * @param {object} Check if node is annotatable
         */
        function isAnnotatable(node) {
            // Annotatable elements
            var ANNOTATABLES = [
                esprima.Syntax.ExpressionStatement,
                esprima.Syntax.VariableDeclaration,
                esprima.Syntax.FunctionDeclaration,
                esprima.Syntax.Property
            ]; // That's it for the timebeeing
            if (ANNOTATABLES.indexOf(node.type) != -1) {
                return true;
            } else {
                return false;
            }
        }
    };

    // Register stuff when brackets finished loading
    CommandManager.register(MENU_NAME, COMMAND_ID, annotate);
    KeyBindingManager.addBinding(COMMAND_ID, "Ctrl-Alt-A");

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID); //"menu-edit-annotate"
});