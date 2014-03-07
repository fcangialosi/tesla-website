
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Team TESLA' });
};

exports.members = function(req, res){
  res.render('members', {title:"Team Members"});
}

exports.research = function(req, res){
  res.render('research', {title:"Our Research"});
}

exports.docs = function(req, res){
  res.render('docs', {title:"Papers and Presentations"});
}

exports.contact = function(req, res){
  res.render('contact', {title:"Contact Us!"});
}
