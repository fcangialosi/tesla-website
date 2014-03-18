var mongoose = require('mongoose');

var statusSchema = mongoose.Schema({
    type    : String,
    style   : String,
    by      : String,
    until   : String,
    using   : String
});

statusSchema.methods.generateStyle = function(occupied) {
  if(occupied){
    return "font-family: 'Roboto Slab'; text-align: center; font-size: 5.75em; color: #D9534F;";
  } else {
    return "font-family: 'Roboto Slab'; text-align: center; font-size: 5.75em; color: #5CB85C;";
  }
}
module.exports = mongoose.model('Status', statusSchema);