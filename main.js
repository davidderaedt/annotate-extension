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


    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menus               = brackets.getModule("command/Menus");


    var EMPTY_MSG   = "No function found";
    var COMMAND_ID  = "annotate.annotate";
    var MENU_NAME   = "Annotate function";

    

    function insert(input) {            
        
        var editor = EditorManager.getCurrentFullEditor();
        var pos    = editor.getCursorPos();
        pos.ch = 0;       
 
        editor._codeMirror.replaceRange(input, pos);

        EditorManager.focusEditor();
        
    }
    
    /**
     * get the whitespace characters from line start to beginning of function def
     * @param string input lines from start of the function definition
     * @param string match function definition start
     */
    function getPrefix(input, match) {
        
        var indexOf = input.indexOf(match),
            prefix  = "";
        if (indexOf != -1) {
            prefix = input.substr(0, indexOf);
        }
        
        return prefix;
        
    }
    
    function getTarget() {
        
        var editor = EditorManager.getCurrentFullEditor();
        var pos    = editor.getCursorPos();
        pos.ch = 0;       
 
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
                params: results.slice(2),
                prefix: getPrefix(txtFrom, results[0])
            };
        } 
        else if (results[0] === "private" && results[1] === "function") { 
            return {
                name: results[1],
                params: results.slice(3),
                prefix: getPrefix(txtFrom, results[0])
            };            
        }
        else if (results[0] === "public" && results[1] === "function") { 
            return {
                name: results[1],
                params: results.slice(3),
                prefix: getPrefix(txtFrom, results[0])
            };            
        }
        else if (results[0] === "static" && results[1] === "function") { 
            return {
                name: results[1],
                params: results.slice(3),
                prefix: getPrefix(txtFrom, results[0])
            };            
        }
        else if (results[0] === "var" && results[1] === "function") { 
            return {
                name: results[1],
                params: results.slice(3),
                prefix: getPrefix(txtFrom, results[0])
            };            
        }
        else {
            return null;
        }
        
    }
    
    
    /**
     * Generate comment block
     * @param string fname function name
     * @param string params function parameters
     * @param string prefix whitespace prefix for comment block lines
     */
    function generateComment(fname, params, prefix) {
        
        var output = [];
        output.push("/**");
                
        // Assume function is private if it starts with an underscore
        if (fname.charAt(0) === "_") {
            output.push(" * @private");
        }
        
        // Add description
        output.push(" * Description");
        
        // Add parameters
        if (params.length > 0) {
            var i;
            for (i = 0; i < params.length; i++) {
                var param = params[i];
                output.push(" * @param {type} " + param + " Description");
            }
        }
        
        // TODO use if 'return' is found in the function body?
        //output += " * @return {type} ???\n";
        output.push(" */");
        
        return prefix + output.join("\n" + prefix) + "\n";
    }

    
    
    function annotate() {
        
        var target = getTarget();
        
        if(target === null) {
            window.alert(EMPTY_MSG);
            return;
        }
        
        var comment = generateComment(target.name, target.params, target.prefix);
        
        insert(comment);
    }


    CommandManager.register(MENU_NAME, COMMAND_ID, annotate);
    KeyBindingManager.addBinding(COMMAND_ID, "Ctrl-Shift-D");

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID);//"menu-edit-annotate", 

});
