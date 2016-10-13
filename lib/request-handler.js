var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

//var db = require('../app/config');
// var User = require('../app/models/user');
// var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');
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
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          Links.add(newLink);
          res.status(200).send(newLink);
        });
      });
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
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};