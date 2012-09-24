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
        
        editor._codeMirror.replaceRange(input, pos);

        EditorManager.focusEditor();        
    }

    
    function getTarget() {
        
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
        
        if (results[0] === "function") {
            return {
                name: results[1],
                params: results.slice(2)
            };
        } 
        else if (results[0] === "var" && results[2] === "function") { 
            return {
                name: results[1],
                params: results.slice(3)
            };            
        }
        else {
            return null;
        }
        
    }
    
    
    function generateComment(fname, params) {
        
        var output = "/**\n";
                
        // Assume function is private if it starts with an underscore
        if (fname.charAt(0) === "_") {
            output += " * @private\n";
        }
        
        // Add description
        output += " * Description\n";
        
        // Add parameters
        if (params.length > 0) {
            var i;
            for (i = 0; i < params.length; i++) {
                var param = params[i];
                output += " * @param {type} " + param + " Description\n";
            }
        }
        
        // TODO use if 'return' is found in the function body?
        //output += " * @return {type} ???\n";
        output += " */\n";
        
        return output;
    }

    
    
    function annotate() {
        
        var target = getTarget();
        
        if(target === null) {
            window.alert(EMPTY_MSG);
            return;
        }
        
        var comment = generateComment(target.name, target.params);
        
        insert(comment);
    }


    CommandManager.register(MENU_NAME, COMMAND_ID, annotate);

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID);//"menu-edit-annotate", 

});