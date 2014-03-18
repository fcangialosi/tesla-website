var express = require('express');
var User = require('./routes/user');
var Status = require('./routes/status');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var flash = require('connect-flash');

var app = express();

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

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
app.get('/login', function(req,res){
  res.render('login');
});
app.post('/login', passport.authenticate('local-login', {
	successRedirect : '/lab',
	failureRedirect : '/login',
	failureFlash : true
}));
app.get('/lab', isLoggedIn, function(req,res){
  Status.find(function (err, doc) {
    if (err) return err;
    res.render('lab', {user:req.user, status:doc[0]});
  });
});
app.get('/logout',routes.logout);
app.get('/user',isLoggedIn, function(req,res){
  res.render('user', {user:req.user});
});
app.post('/user',isLoggedIn, function(req,res){
  changePassword(req.user,req.body.password);
  req.logout();
  res.redirect('/login')
});
app.post('/checkin',isLoggedIn,checkInUpdate);
app.get('/checkout',isLoggedIn,checkout);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

function changePassword(user, newpass){
  var hashed = user.generateHash(newpass);
  User.update({'local.email':user.local.email}, {'local.password':hashed}, {multi:true}, function(err,numAffected){});
}

function checkInUpdate(req,res){
  var current;
  var message;
  Status.find(function (err, doc) {
    if (err) return err;
    current = doc[0];
    if(current.type=="OCCUPIED! :("){
      if(!(req.user.team_name.trim().toLowerCase()==current.by.trim().toLowerCase())){
        message = "Nice try, but " + current.by.trim() + " got to it first ;)";
        //res.redirect('http://youtu.be/vtkGtXtDlQA?t=2m41s'); return;
      } else {
        Status.update({'type':'OCCUPIED! :('},{'until':req.body.new_until,'using':req.body.new_using},{multi:true}, function(err,numAffected){});
        message = "Okay, I extended your time.";
      }
    } else {
      var condition = {'type':'AVAILABLE! :)'};
      var query = {'type':'OCCUPIED! :(', 'by':req.user.team_name.trim(), 'until':req.body.new_until, 'using':req.body.new_using, 'style':current.generateStyle(true)};
      Status.update(condition,query,{multi:true},function(err,numAffected){});
      message = "Request successful. It's all yours!";
    }
    Status.find(function (err, doc) {
      if (err) return err;
      res.render('lab',{user:req.user,status:doc[0],msg:message});
    });
  });
}

function checkout(req, res){
  var current;
  var message;
  Status.find(function (err, doc) {
    if (err) return err;
    current = doc[0];
    if(current.type=="AVAILABLE! :)"){
      message = "..but no one's here.."; 
    } else {
      if(req.user.team_name.trim().toLowerCase()==current.by.trim().toLowerCase()){
        var condition = {'type':'OCCUPIED! :('};
        var query = {'type':'AVAILABLE! :)','by':'','until':'','using':'','style':current.generateStyle(false)};
        Status.update(condition,query,{multi:true},function(err,numAffected){});
        message = "Checkout successful.";
      } else {
        message = "Sorry, you can't checkout a team other than your own.";
      }
    }
    Status.find(function (err,doc) {
      if (err) return err;
      res.render('lab',{user:req.user,status:doc[0],msg:message});
    });
  });
}