var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
    general    : {
    	String : Number
    },	
    rectenna   : {
    	String : Number
    },
    antenna      : {
    	String : Number
    },
    lossy   : {
    	String : Number
    },
    gigabox   : {
    	String : Number
    },
    ip : {
    	String : Number
    },
    grant : {
    	String : Number
    }
});

module.exports = mongoose.model('Counter', counterSchema);