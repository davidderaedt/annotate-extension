
/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** This file is only used to be tested against annotate */
define(function (require, exports, module) {

    'use strict';


    var greetings = "Hello world";
    

    function declaration(input) {            
        
        var content = "stuff";
    }

    
    var expression = function(p1, p2) {
        
        var content = "stuff";
        
    };
    
    
    function noParams() {
                
        return null;
        
    }


    var _privateStuff = function(p1, p2) {
        var content = "I start with an underscore";
    };
    
    
    var myObject = {};
    
    myObject.myFunction = function (param1, param2, param3) {
        
    };
    

    myObject.prototype.myFunction = function (param1, param2) {
    
    };
    
    
    var a = {
        doA: function(param1, param2){
            var content = "stuff";
            
            return content;
        },
        doB: function(param1, param2){
            var content = "stuff";
            
            return content;
        }
    };
    
});