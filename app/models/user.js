var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  links: function() {
    return this.hasMany(Link);
  },

  initialize: function() {
    var model = this;
    this.on('saving', function() {
      var password = this.get('password');
      var hash = bcrypt.hashSync(password);
      this.set('password', hash);
    });

  },

});

module.exports = User;

