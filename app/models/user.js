var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  intialize: function() {
    this.on('creating', function(model, attrs, options) {
      var password = model.get('password');
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
          if (err) throw err;
          model.set('password', hash);
        });
      })
    });
  }
});

module.exports = User;

