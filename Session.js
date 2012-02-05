var util = require('util'),
  events = require('events'),
  steam = require('./main');

function Session(opt) {
  opt = opt || {};

  this.access_token = null;

  this.umqid = null;
  this.steamid = null;
  this.messagelast = 0;

  this.scope = opt.scope || ['read_profile', 'write_profile', 'read_client', 'write_client'];

  // public: DE45CD61, beta: 7DC60112, dev: E77327FA
  this.client_id = opt.client_id || 'DE45CD61';

  this.next_poll = null;
}
util.inherits(Session, events.EventEmitter);

module.exports = Session;

Session.prototype.connected = function () {
  return !!this.umqid;
};

Session.prototype.connect = function (opt, success) {
  var self = this;

  if (self.connected()) {
    return;
  }

  opt = opt || {};

  self.access_token = opt.access_token || self.access_token;

  if (self.access_token) {
    self.logon(function (d) {
      var data = {
        steamid: d.steamid,
        access_token: self.access_token
      };

      if (success) {
        success(data);
      }

      var poll_loop = function () {
        self.poll(poll_loop);
      };
      poll_loop();

      self.emit('connect', data);
    });
  } else if (opt.username && opt.password) {
    self.authenticate({
      username: opt.username,
      password: opt.password,
      authcode: opt.authcode
    }, function (d) {
      self.connect(null, success);
    });
  }
};

Session.prototype.authenticate = function (opt, success) {
  var self = this;

  if (self.connected()) {
    return;
  }

  opt = opt || {};

  steam.request({
    interface: 'ISteamOAuth2',
    method: 'GetTokenWithCredentials',
    post: {
      client_id: self.client_id,
      grant_type: 'password',
      username: opt.username,
      password: opt.password,
      x_emailauthcode: opt.emailauthcode,
      scope: self.scope.join(' ')
    }
  }, function (e, d) {
    if (e) {
      if (e.type !== 'steam') {
        self.emit('error', {
          error: e,
          data: d
        });
      } else {
        self.emit('auth_error', {
          code: d.x_errorcode,
          description: d.description
        });
      }
    } else {
      self.access_token = d.access_token;

      var data = {
        access_token: d.access_token
      };

      if (success) {
        success(data);
      }

      self.emit('authenticate', data);
    }
  });
};

Session.prototype.logon = function (success) {
  var self = this;

  if (self.connected()) {
    return;
  }

  steam.request({
    interface: 'ISteamWebUserPresenceOAuth',
    method: 'Logon',
    post: {
      access_token: self.access_token
    }
  }, function (e, d) {
    if (e) {
      self.emit('error', {
        error: e,
        data: d
      });
    } else {
      self.umqid = d.umqid;
      self.steamid = d.steamid;
      self.messagelast = d.message;

      var data = {
        steamid: d.steamid
      };

      if (success) {
        success(data);
      }

      self.emit('logon', data);
    }
  });
};

Session.prototype.poll = function (callback) {
  var self = this;

  if (!self.connected()) {
    return;
  }

  if (!self.next_poll) {
    self.next_poll = self.poll_status;
  }

  self.next_poll(function (d) {
    if (d.secure) {
      self.next_poll = self.poll_secure;
    } else {
      self.next_poll = self.poll_status;
    }

    if (callback) {
      callback(d);
    }

    self.emit('poll', d);
  });
};

Session.prototype.poll_status = function (callback) {
  var self = this;

  if (!self.connected()) {
    return;
  }

  steam.request({
    interface: 'ISteamWebUserPresenceOAuth',
    method: 'PollStatus',
    secure: 'false',
    post: {
      steamid: self.steamid,
      umqid: self.umqid,
      message: self.messagelast
    }
  }, function (e, d) {
    var data = {
      secure: false
    };

    if (e && !(e.type === 'steam' && e.info === 'Timeout')) {
      data.error = e;
      self.emit('error', {
        error: e,
        data: d
      });
    } else {
      if (d.messages) {
        d.messages.forEach(function (m) {
          if (m.secure_message_id) {
            data.secure = true;
          }
        });
      }

      self.emit('poll_status', d);
    }

    if (callback) {
      callback(data);
    }
  });
};

Session.prototype.poll_secure = function (callback) {
  var self = this;

  if (!self.connected()) {
    return;
  }

  steam.request({
    interface: 'ISteamWebUserPresenceOAuth',
    method: 'Poll',
    post: {
      access_token: self.access_token,
      umqid: self.umqid,
      message: self.messagelast
    }
  }, function (e, d) {
    var data = {
      secure: false
    };

    if (e && !(e.type === 'steam' && e.info === 'Timeout')) {
      data.error = e;
      self.emit('error', {
        error: e,
        data: d
      });
    } else {
      d.messages.forEach(function (m) {
        self.emit('message', m);
        self.emit('message_' + m.type, m);
      });

      self.messagelast = d.messagelast;

      self.emit('poll_secure', d);
    }

    if (callback) {
      callback(data);
    }
  });
};

Session.prototype.message = function (opt) {
  var self = this;

  steam.request({
    interface: 'ISteamWebUserPresenceOAuth',
    method: 'Message',
    post: {
      access_token: self.access_token,
      umqid: self.umqid,
      type: opt.type || 'saytext',
      text: opt.text,
      steamid_dst: opt.steamid
    }
  }, function (e, d) {
    if (e) {
      self.emit('error', {
        error: e,
        data: d
      });
    }
  });
};