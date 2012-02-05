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

Making a request for the Steam Web API

```
var steam = require('steam.js');

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

Creating a _Steam echo bot_

```
var Session = require('steam.js/Session');

var session = new Session();
session.connect({
  username: 'gaben',
  password: 'c4ke'
});

session.on('message_saytext', function (m) {
  session.message({
    steamid: m.steamid_from,
    text: m.text
  });
});
```

## TODO

The plans are to expose most methods of the Web API on the Core in a nice way, like it's done with `util`. I don't plan to parse the return value of those methods, but I'll probrably improve error handling.

On the Session module, there are a lot of methods still to implement. It will be done as it's necessary.

I want to create new modules, for TF, Portal, Economy, but it will take longer for that...

## Function Reference

Note: since the library is still WIP, the functions are most likely to change, specially the return values and callbacks

### Core

The module used for direct requests for the Steam Web API

```
var steam = require('steam.js');
```

#### request(options, callback)

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

#### util.getServerInfo(callback)

Shorthand for `request(SteamWebAPIUtil/GetServerInfo, callback)`. Get the current time on the server.

#### util.getSupportedAPIList(options, callback)

Shorthand for `request(SteamWebAPIUtil/GetServerInfo, callback)`. Accepts an optional object with the `key` to be used on the request. Lists the available methods and their parameters.

### Session

Reproduces the behavior expected from the Mobile App, handles authorization, server notifications and client messaging.

```
var Session = require('steam.js/Session');
```

#### session = new Session(options)

Creates a new Steam Session with the given options (all optional):

* `scope`: array of actions to request access for on authorization, defaults to `['read_profile', 'write_profile', 'read_client', 'write_client']`
* `client_id`: registered Client ID, Valve hasn't made any public method to get one

#### sesion.connected()

Returns true if a valid session id is set

#### sesion.connect(options, success)

Authenticates with the server and keep connected, querying the server for incoming messages. The (`access_token`) or (`username`, password` and `authcode` [optional]) options must be provided:

* `access_token`: pre-obtained access token, can be kept between sessions
* `username`: Steam Account username
* `password`: Steam Account password
* `authcode`: If Steam Guard is active on the Steam Account, try login once without it to receive the code via email

If connected, calls success with object:

* `access_token`: same as above, to be kept for future sessions
* `steamid`: 64 bits representation of the Account

#### sesion.message(options)

Send a message for another user. Available options are:

* `type`: Type of the message. Valid types are `saytext` (default), `emote`, `typing`
* `text`: Text message to send (optional if `type == 'typing'`)
* `steamid`: 64 bits Steam ID of the target user

#### [events](http://nodejs.org/docs/latest/api/events.html)

(to be documented)

**Error**

* `error`
* `auth_error`

**Authentication**

* `authenticate`
* `connect`
* `logon`

**Polling**

* `poll` 
* `poll_status`
* `poll_secure`

**Message**

* `message`
* `message_typing `
* `message_saytext`
* `message_mysaytext`
* `message_emote`
* `message_myemote`
* `message_leftconversation`
* `message_personastate`
