var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    console.log('INITIALIZEMEEEEE');
    var model = this;
    this.on('saving', function() {
      var password = this.get('password');
      var hash = bcrypt.hashSync('password');
      console.log('HASHHERE', hash);
      this.set('password', hash);
        // bcrypt.hash(password, null, null, function(err, hash) {
        //   console.log('blahblah')
        //   if (err) {
        //     console.log('error!');
        //     throw err;
        //   } else {
        //     console.log('success!');
        //     console.log(this);
        //     model.set('password', hash);
        //   }
        // });
    });

  },

  compareHash: function(password, callback) {
  }

});

module.exports = User;

