var express = require('express');
var User = require('./routes/user');
var Counter = require('./routes/counter');
var Status = require('./routes/status');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var url = require('url');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var flash = require('connect-flash');
var fs = require('fs');

var app = express();
var secret = '42xigUBluzIGgGl8zOSA'

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
app.get('/future',isLoggedIn,function(req,res){
  res.render('future',{user:req.user});
});
app.post('/future',isLoggedIn,function(req,res){
  addTime(req,res);
});
app.post('/newpost',function(req,res){
  incrementUnreadCount(url.parse(req.url,true).query);
});
app.get('/clear',isLoggedIn, function(req,res){
  clearUnread(url.parse(req.url,true).query);
  res.render('index');
});
app.get('/posts',function(req,res){
  Counter.findOne({'record':'teams'},function (err, doc) {
    res.json(doc);
  });
});
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var teams = {
  "general" : "60",
  "modeling" : "66",
  "lossy" : "69",
  "antenna" : "68",
  "rectenna" : "65",
  "ip" : "67",
  "grant" : "70"
}

var num_to_name = {
  "60" : "general",
  "66" : "modeling",
  "69" : "lossy",
  "68" : "antenna",
  "65" : "rectenna",
  "67" : "ip",
  "70" : "grant"
}

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

function addTime(req,res){
  var start = req.body.start;
  var end = req.body.end;
  var using = req.body.using;
  function pad(part,index,arr){
    arr[index]=String("0" + arr[index]).slice(-2);
  };
  start.forEach(pad);
  end.forEach(pad);
  start_string = "20"+start[0]+"-"+start[1]+"-"+start[2]+" "+start[3]+":"+start[4]+":"+start[5];
  end_string = "20"+end[0]+"-"+end[1]+"-"+end[2]+" "+end[3]+":"+end[4]+":"+end[5];
  new_doc = {
            title   : req.user.team_name+'\nReserved By:'+req.user.first_name+'\nUsing: '+using,
            start   : start_string,
            end     : end_string,
            color   : getTeamColor(req.user.team_name),
            allDay  : false
  };
  fs.lstat('./public/data/calendar.json',function(err,stats){
    buf = new Buffer(","+JSON.stringify(new_doc)+"]");
    cal = fs.openSync('./public/data/calendar.json','r+',function(err,fd){});
    bytes = fs.writeSync(cal,buf,0,buf.length,stats.size-1);
  });
}

function incrementUnreadCount(query){
  console.log(query);
  var forum_num = query.forum_num.toString();
  var topic_num = query.topic_num.toString();
  var client_secret = query.secret;
  if(client_secret == secret){
    console.log("secret is right");
    var team_name = num_to_name[forum_num];
    Counter.findOne({'record':'teams'},function (err, doc) {
      console.log("connected to db");
      if(topic_num in doc[team_num]){
        doc[team_name][topic_num] += 1;
      } else {
        doc[team_name][topic_num] = 1;
      }
      doc.save();
      console.log("SAVED!");
    });
  }
}

function clearUnread(query){
  console.log("clear?");
  var client_secret = query.secret;
  if(client_secret == secret){
    console.log("secret is righ");
    Counter.findOne({'record':'teams'},function (err,doc) {
      console.log("connected to db");
      doc['grant'] = undefined;
      doc['ip'] = undefined;
      doc['antenna'] = undefined;
      doc['rectenna'] = undefined;
      doc['modeling'] = undefined;
      doc['lossy'] = undefined;
      doc['general'] = undefined;
      doc.save();
    });
  }
}

function getTeamColor(team){
  if(team=="Rectenna Team"){
    return '#5a9ad5';
  } else if(team=="Modeling Team"){
    return '#6fac46';
  } else if(team=="Antenna Team"){
    return '#ffbf00';
  } else {
    return '#ff3419';
  }
}  