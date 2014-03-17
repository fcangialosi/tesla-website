
/**
 * Module dependencies.
 */

var express = require('express');
var User = require('./routes/user');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var flash = require('connect-flash');

var app = express();

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);
var statusSchema = mongoose.Schema({
    type    : String,
    style   : String,
    by      : String,
    until   : String
});
statusSchema.methods.generateStyle = function() {
  if(this.type.localeCompare("occupied") === 0){
    return "font-family: 'Roboto Slab'; text-align: center; font-size: 5.75em; color: #D9534F;";
  } else {
    return "font-family: 'Roboto Slab'; text-align: center; font-size: 5.75em; color: #5CB85C;";
  }
}
var Status = mongoose.model('Status', statusSchema);
var labstatus;
Status.find(function (err, kittens) {
  if (err) return err;
  labstatus = kittens[0];
});
console.log(labstatus);
require('./config/passport')(passport);

app.configure(function() {
  app.use(express.logger('dev'));
  app.use(express.cookieParser());

  app.use(express.session({secret:'hmwhatdoesthisdo'}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', routes.index);
app.get('/teams', routes.teams);
app.get('/people', routes.people);
app.get('/research',routes.research);
app.get('/docs',routes.docs);
app.get('/contact',routes.contact);
app.get('/login',routes.loginform);
app.post('/login', passport.authenticate('local-login', {
	successRedirect : '/lab',
	failureRedirect : '/login',
	failureFlash : true
}));
app.get('/lab', isLoggedIn, function(req,res){
  res.render('lab', {user:req.user, status:labstatus});
});
app.get('/logout',routes.logout);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
app.get('/user',isLoggedIn, function(req,res){
  res.render('user', {user:req.user});
});
app.post('/user',isLoggedIn, function(req,res){
  changePassword(req.user,req.body.password);
  req.logout();
  res.redirect('/login')
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

function changePassword(user, newpass){
  var hashed = user.generateHash(newpass);
  console.log(hashed);
  User.update({'local.email':user.local.email}, {'local.password':hashed}, {multi:true}, function(err,numAffected){});
}