'use strict';

var express = require('express');
var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var UrlShortener = require(path + '/app/controllers/urlShortener.server.js');


module.exports = function (app, passport) {

	// function isLoggedIn (req, res, next) {
	// 	if (req.isAuthenticated()) {
	// 		return next();
	// 	} else {
	// 		res.redirect('/login');
	// 	}
	// }

	var clickHandler = new ClickHandler();
	var urlShortener = new UrlShortener();

	app.route('/')
		.get(function (req, res) {
			res.redirect('/_home');
		});
		
	app.route('/_home')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});

	app.route(/\/_api\/urls\/?/i)
		.get(function(req, res) {
			var out = urlShortener.shortenLink(req, function(obj) {
				res.json(obj);
			});
		});
		
		
	app.route(/\/[a-z0-9]+/i)
		.get(function(req, res) {
			
			if (req.originalUrl === "/favicon.ico" || req.originalUrl === "/api/:id") {
				res.writeHead(200, {
				  'Content-Type': 'text/plain' });
				res.end();
			} else {
			
				var out = urlShortener.restoreLink(req, function(link) {
			
					console.log("i was looking for: ", req.originalUrl.replace(/^\//, ""));
					console.log("link found in database: ", link);
					
					res.writeHead(302, {Location: link});
					res.end();
					
				});
				
			}

		});	
		

/*//
// From here on, the remainder the of the ClementineJS template.
// Not related to the required functionality.
// TODO: clean up before release.

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});

	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});

	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			res.json(req.user.github);
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));

	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
		
//*/
////

};
