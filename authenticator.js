var OAuth = require('oauth').OAuth;
var config = require('./config');

// Create the oauth object for accessing Twitter
var oauth = new OAuth(
  config.request_token_url,
  config.access_token_url,
  config.consumer_key,
  config.consumer_secret,
  config.oauth_version,
  config.oauth_callback,
  config.oauth_signature
);

module.exports = {
  redirectToTwitterLoginPage: function(req, res) {
    // ask Twitter for request token
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
      if (error) {
        console.log(error);
        res.send("Authentication failed!");
      } else {
        // use the request token to take the client to Twitter's Authentication
          res.cookie('oauth_token', oauth_token, { httpOnly: true });
          res.cookie('oauth_token_secret', oauth_token_secret, { httpOnly: true });
          res.redirect(config.authorize_url + '?oauth_token='+oauth_token);
      }
    });
  },
  authenticate: function(req, res, cb) {
    // check if the request token and temporary credential are there
    if (!(req.cookies.oauth_token && req.cookies.oauth_token_secret && req.query.oauth_verifier)) {
      return cb("Request does not have all the required keys");
  }

    // clear the request token cookies
    res.clearCookie('oauth_token');
    res.clearCookie('oauth_token_secret');

    // exchange oauth-verifier for an access token
    oauth.getOAuthAccessToken(
      req.cookies.oauth_token,
      req.cookies.oauth_token_secret,
      req.query.oauth_verifier,
      function(error, oauth_access_token, oauth_access_token_secret, results) {
        if (error) {
          return cb(error);
        }

        // get the user's twitter id
        oauth.get('https://api.twitter.com/1.1/account/verify_credentials.js',
          oauth_access_token, oauth_access_token_secret,
          function(error, data) {
            if (error) {
              console.log(error);
              return cb(error);
            }

            // parse the JSON response
            data = JSON.parse(data);

            // store the access token, token secret, and user's twitter id
            res.cookie('acccess_token', oauth_access_token, { httpOnly: true });
            res.cookie('access_token_secret', oauth_access_token_secret, { httpOnly: true });
            res.redirect('twitter_id', data.id.str, { httpOnly: true });
          });
      });

    // tell router that authentication was successful
    cb();
  }
};
