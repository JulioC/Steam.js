# Steam.js

A Node.js library for the Steam Web API, with wrappers to deal with its methods, like those used on [Steam Mobile App](http://store.steampowered.com/mobile).

## Install

<pre>
  npm install steam.js
</pre>

Or get the latest sources...

<pre>
  git clone git://github.com/JulioC/steam.js.git 
  cd steam.js
  npm link
</pre>

## Example Usage

```
var steam = require('steam');

steam.util.getServerInfo(function (e, d) {
  console.log('Server time: ' + d.servertimestring);
});

steam.request({
  interface: 'ISteamNews',
  method: 'GetNewsForApp',
  version: '0002',
  secure: false,
  get: {
    appid: 24010,
    maxlength: 128,
    count: 3
  }
}, function (e, d) {
  d.appnews.newsitems.forEach(function(news) {
    console.log(news);
  });
});

```

## Function Reference

### request(options, callback)

Make a request for the Steam API with a method with the given parameters.

If the first argument is a string, it will be threated as the `path` option. If it's an object, it should have at least the `interf` and `method` set. The available options are:

* `interface`: the Steam API interface
* `method`: the Steam API method 
* `version`: version of the method to be called, format `XXXX`, defaults to `0001`
* `path`: overwrites the interface, method and version options, with format `interface/method/vXXXX`
* `secure`: if the request should be made via https, defaults to `true`
* `get`: GET params for the HTTP request
* `post`: POST params for the HTTP request

Once the request is finished, the `callback` function will be called with 2 arguments, an error object (null if success) and the available data (parsed from json if success).

### util.getServerInfo(callback)

Shorthand for `request(SteamWebAPIUtil/GetServerInfo, callback)`. Get the current time on the server.

### util.getSupportedAPIList(options, callback)

Shorthand for `request(SteamWebAPIUtil/GetServerInfo, callback)`. Accepts an optional object with the `key` to be used on the request. Lists the available methods and their parameters.