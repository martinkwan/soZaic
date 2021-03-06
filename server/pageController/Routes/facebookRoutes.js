"use strict";

const fbController = require('../routesController');
const FacebookStrategy = require(`passport-facebook`).Strategy;
const utils = require(`../../serverController/utils`);


module.exports = function(appRoute, passport, key, localApiKeys) {
  console.log('Inside FB Routes');

  //need following only for logging in:

  let callbackUrl = ""
  if (key.facebook.clientID && key.facebook.clientSecret) {
    callbackUrl = `https://sozaic.herokuapp.com/api/facebook/auth/callback`
  } else {
    callbackUrl = utils.callbackURL('facebook')
  }

  passport.use(new FacebookStrategy({
    clientID: key.facebook.clientID || localApiKeys.facebook.clientID,
    clientSecret: key.facebook.clientSecret || localApiKeys.facebook.clientSecret,
    callbackURL: callbackUrl
  },
    (accessToken, refreshToken, profile, cb) => {
      let userTokens = {};

      userTokens.profile = profile;
      userTokens.accessToken = accessToken;

      cb(null, userTokens);
    }
  ));

  appRoute.get('/auth', passport.authenticate('facebook', { scope : ['user_friends', `user_photos`, `user_videos`, `public_profile`, `user_posts`, `user_likes`]}));


  appRoute.get(`/auth/callback`,
    passport.authenticate(`facebook`, { failureRedirect: `/logindfgbr` }),
    function(req, res) {
      req.session.facebook = req.session.passport.user
      res.redirect(`/#/feed/facebook`);
    }
  )

  utils.routeFeed(appRoute, (req, res) => {

    if (req.session.facebook === undefined) {
      res.status(404).send(`please login`);
    } else {
      fbController.fbData(req, res, req.session.facebook.profile.id, req.session.facebook.accessToken);
    }
  })

  //following only for logging in:

  appRoute.get(`/feed/specific`, (req, res) => {
    fbController.fbSp(req, res, req.session.facebook.profile.id,  req.session.facebook.accessToken, req.query);
  })

  appRoute.get(`/feed/post`, (req, res) => {
    console.log(req.data);
  })

};



/*
FB auth wouldn't allow to use localhost or 127.0.0.1.
Didn't want to have to push to heroku every time for dev purposes.
Had to change OS system admin file to get to work.
Must use local.host for local-node-server, works for twitter also.
These links helpful to make work:
http://stackoverflow.com/questions/21310648/facebook-app-this-must-be-derived-from-canvas-url-secure-canvas-url
https://support.rackspace.com/how-to/modify-your-hosts-file/
*/
