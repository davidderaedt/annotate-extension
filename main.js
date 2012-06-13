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


    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        Menus          = brackets.getModule("command/Menus");


    var EMPTY_MSG   = "No function found";
    var COMMAND_ID  = "annotate.annotate";
    var MENU_NAME   = "Annotate function";


    function insert(input) {
            
        
        var editor = EditorManager.getCurrentFullEditor();
        var pos = editor.getCursorPos();
                        
        var i;
        var lines = input.split("\n");
        
        
        for (i = 0; i < lines.length; i++) {
            
            if (i !== lines.length - 1) {
                lines[i] = lines[i] + "\n";
            }
            
            editor._codeMirror.setLine(pos.line, lines[i]);
            
            // TODO: indent (looks like code mirror does not indent correctly multiline comments)
            //editor._codeMirror.indentLine(pos.line);
            
            pos.line++;
        }

        EditorManager.focusEditor();
        
    }

    function _generateComment() {
        
        var output = "/**\n";
        
        var editor = EditorManager.getCurrentFullEditor();
        var pos = editor.getCursorPos();
        
        // Take the text of the document, starting with the current cursor line
        var txtFrom = editor._codeMirror.getRange(pos, {line: editor._codeMirror.lineCount() });
        
        // For now, we generate annotations from the signature only (missing return statements)
        txtFrom = txtFrom.substr(0, txtFrom.indexOf("{"));
        
        // Look for words
        var re = /\w+/g;
        var results = txtFrom.match(re);
        
        // The first word found should be "function", and next ones parameters
        if (results[0] !== "function") {
            window.alert(EMPTY_MSG);
            return;
        }
                
        // Assume function is private if it starts with an underscore
        var fname = results[1];
        if (fname.charAt(0) === "_") {
            output += " * @private\n";
        }
        
        // Add description
        output += " * Description\n";
        
        // Add parameters
        if (results.length > 2) {
            var i;
            for (i = 2; i < results.length; i++) {
                var param = results[i];
                output += " * @param {type} " + param + " Description\n";
            }
        }
        
        // TODO use if 'return' is found in the function body?
        //output += " * @return {type} ???\n";
        output += " */";
        
        return output;
    }

    
    function annotate() {
        
        var comment = _generateComment();
        insert(comment);
    }


    CommandManager.register(MENU_NAME, COMMAND_ID, annotate);

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider();
    menu.addMenuItem("menu-edit-annotate", COMMAND_ID);

});