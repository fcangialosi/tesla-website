exports.index = function(req, res){
  res.render('index', { title: 'Team TESLA' });
};

exports.teams = function(req, res){
  res.render('teams', {title:"Sub-Teams"});
}

exports.people = function(req, res){
	res.render('people', {title:"People"});
}

exports.research = function(req, res){
  res.render('research', {title:"Our Research"});
}

exports.docs = function(req, res){
  res.render('docs', {title:"Documents"});
}

exports.contact = function(req, res){
  res.render('contact', {title:"Contact Us"});
}

exports.logout = function(req, res){
  req.logout();
  res.redirect('/login');
}