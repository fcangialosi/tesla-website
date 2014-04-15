var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
    generalTopic	: [String],
    generalCount 	: [Number],
    rectennaTopic 	: [String],
    rectennaCount	: [Number],
    antennaTopic    : [String], 
    antennaCount	: [Number],
    lossyTopic   	: [String],
    lossyCount		: [Number],
    ipTopic			: [String],
    ipCount			: [Number],
    grantTopic 		: [String],
    grantCount 		: [Number]
});

module.exports = mongoose.model('Counter', counterSchema);