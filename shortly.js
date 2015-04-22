var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.cookieParser());

app.use(express.static(__dirname + '/public'));

var sess;

app.use(session({
  // genid: function(req) {
  //   return genuuid()
  // },
  secret: 'leroy jenkins',
  saveUninitialized: true,
  resave: false
}));

app.get('/',
function(req, res) {
  sess = req.session;
  // console.log('sess.username: ',sess.username)
  if (!sess.username) {
    res.redirect(301,'/login');
  }
  res.render('index');
});

app.get('/logout',
  function(req, res) {
    req.session.destroy();
    res.redirect(301,'/login');
})

app.get('/create',
function(req, res) {
  sess = req.session;
  if (!sess.username) {
    res.redirect(301,'/login');
  }
  // console.log('sess.username: ',sess.username)
  res.render('index');
});

app.get('/login', function(req, res) {
    sess = req.session;
  // console.log('sess.username: ',sess.username)
  res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  sess = req.session;

  new User({'username': username})
  .fetch()
  .then(function(user) {
    if (user) {
      var hash = user.attributes.password;
      var result = bcrypt.compareSync(password, hash);
      if (result) {
        console.log('Logged in as:', user.attributes.username);
        sess.username = req.body.username;
        res.redirect(301,'/');
      } else {
        console.log('Incorrect password!');
        res.redirect(301,'/login');
      }
    } else {
      console.log('Username doesnt exists!');
      res.redirect(301,'/login');
    }
  });
});

app.get('/signup', function(req, res) {
    sess = req.session;
  console.log('sess.username: ',sess.username)
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  sess = req.session;

//In create account template, checks if username exists, if not, creates a new record.
  new User({'username': username})
  .fetch()
  .then(function(user) {
    if (!user) {
      User.forge({'username': username, 'password': password}).save()
      .then(function(){
        console.log('New user successfully created!');
        sess.username = username;
        res.redirect(301,'/');
      });
    } else {
      console.log('Username already exists!');
    }
  });
});

app.get('/links',
function(req, res) {
    sess = req.session;
    if (!sess.username) {
      res.redirect(301,'/login');
    }

    new User({username: sess.username}).fetch().then(function(user) {
      var userId = user.attributes.id;

      Links.reset().query({where: {user_id: userId}}).fetch().then(function(links) {
        res.send(200, links.models);
      });
    });
});

app.post('/links',
function(req, res) {
  sess = req.session;
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
          new User({username: sess.username}).fetch().then(function(user) {
            var userId = user.attributes.id;

            var link = new Link({
              url: uri,
              title: title,
              base_url: req.headers.origin,
              user_id: userId
            });

            link.save().then(function(newLink) {
              Links.add(newLink);
              res.send(200, newLink);
            });
          })

      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


var checkAuth = function() {

};



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
