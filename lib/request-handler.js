var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');
//var db = require('../app/config');
// var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
var Links = require('../app/collections/links');
var Mongoose = require('mongoose');
Mongoose.connect('mongodb://lucas.d.becker:password123@ds057386.mlab.com:57386/shortly', function(err, data) {
  if (err) {
    console.log('err: ' + err);
  } else {
    console.log('Mongoose Connected');  
  }
});
var db = Mongoose.connection;
db.once('open', function() {
  console.log('DB Connection Open');
});

var userSchema = Mongoose.Schema({
  username: String,
  password: String
});

var User = Mongoose.model('User', userSchema);

var linkSchema = Mongoose.Schema({
  url: String,
  base: String,
  code: String,
  title: String,
  visits: Number
});

var URL = Mongoose.model('url', linkSchema);




exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  console.log('FETCHLINKS');
  URL.find({}, function(err, links) {
    res.status(200).send(links);
  });
};

exports.saveLink = function(req, res) {
  console.log('helllooooooooooo');
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  URL.find({url: uri}, function (err, results) {
    if (err) {
      return err;
    } else if (results.length === 0) {
      //make new entry
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          return res.sendStatus(404);
        } else {
          console.log('!!!!');
          var shasum = crypto.createHash('sha1');
          shasum.update(uri);
          var base1 = req.headers.origin;
          var newLink = new URL({
            url: uri,
            title: title,
            base: base1,
            code: shasum.digest('hex').slice(0, 5),
            visits: 0
          });
          newLink.save(function(newLink) {
            console.log('REDIRECT!');
            res.status(200).send(newLink);
   

          });

        }
      });
    } else {
      //URL is in database
      res.status(200).send();
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.find({username: username, password: password}, function(err, results) {
    if (err) {
      return err;
    } else if (results.length === 0) {
      console.log('please try again');
      res.redirect('/login');
    } else {
      util.createSession(req, res, {username: username});
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //open connection to DB
  //fetch data for given username
  //if it doesn't exist, create it

  User.find({username: username}, function(err, data) {
    if (err) {
      console.log('err: ' + err);
    } else {
      if (data.length === 0) {
        var newUser = new User({username: username, password: password});
        newUser.save(function(err, newUserData) {
          if (err) {
            console.log('Err creating new user: ' + err);
          } else {
            console.log('New User ' + username + ' created.');
            console.log(newUserData);
            util.createSession(req, res, newUser);
          }
        });
      } else {
        console.log('Username ' + username + ' is already taken.');
        res.redirect('/signup');
      }
    }
  });
};

exports.navToLink = function(req, res) {
  console.log('NAVTOLINK');
  //console.log(Object.keys(req));
  //console.log(req.params[0]);
  var promFind = Promise.promisify(URL.find, {context: URL});
  promFind({ code: req.params[0] }).then(function(link) {
    console.log('link = ' + link[0]);
    var exlink = link[0].url;
    console.log(exlink);
    if (!link) {
      res.redirect('/');
    } else {
      // res.redirect(exlink);
      URL.findByIdAndUpdate(link[0]._id, {$set: {visits: link[0].visits + 1}}, function() {
        res.redirect(exlink);
      });
      // link.set({ visits: link.visits + 1 })
      //    .save(function() {
      //      return res.redirect(link.URL);
      //    });
    }
    
  });
};