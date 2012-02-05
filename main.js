var url = require('url'),
  qs = require('querystring'),
  request = require('request');

function Steam() {
  this.host = 'api.steampowered.com';
}

var steam = new Steam();
module.exports = steam;

Steam.prototype.request = function (opt, callback) {
  var self = this;

  opt = opt || {};

  if (typeof opt === 'string') {
    var parts = opt.split('/');
    opt = {
      interface: parts[0],
      method: parts[1],
      version: parts[2]
    };
  }

  var options = {
      interface: opt.interface,
      method: opt.method,
      version: opt.version || '0001',
      path: opt.path,
      secure: typeof opt.secure !== 'undefined' ? opt.secure : true,
      get: opt.get,
      post: opt.post
    },
    req = {
      url: url.format({
        protocol: options.secure ? 'https' : 'http',
        host: this.host,
        pathname: options.path || [options.interface, options.method, 'v' + options.version].join('/'),
        query: options.get
      })
    };

  if (options.post) {
    req.method = 'POST';
    req.body = '?' + qs.stringify(options.post).toString('ascii');
    req.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': options.url
    };
  }

  request(req, function (e, r, b) {
    var error = null,
      data = null;

    if (e) {
      error = {
        type: 'client',
        info: e // we should return a proper messagehere
      };
    } else if (r.statusCode !== 200) {
      error = {
        type: 'request',
        info: r.statusCode
      };
    } else {
      try {
        data = JSON.parse(b);
      } catch (ex) {
        error = {
          type: 'parse',
          info: 'failed to parse API response'
        };
        data = b;
      }
    }

    if (data && data.error && data.error !== 'OK') {
      error = {
        type: 'steam',
        info: data.error
      };
    }

    if (callback) {
      callback(error, data);
    }
  });
};

module.exports.util = {
  getServerInfo: function (callback) {
    steam.request('ISteamWebAPIUtil/GetServerInfo', callback);
  },
  getSupportedAPIList: function (opt, callback) {
    var self = this;

    opt = opt || {};

    var params = {};
    if (opt.key) {
      params.key = opt.key;
    } else {
      // [API Glitch?]
      // This will return some methods, without needing a key
      params.client_id = 'none';
    }

    steam.request({
      interface: 'ISteamWebAPIUtil',
      method: 'GetSupportedAPIList',
      get: params
    }, callback);
  }
};