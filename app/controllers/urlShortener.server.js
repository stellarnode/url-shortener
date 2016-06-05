"use strict";

var url = require("url");
var mongodb = require("mongodb").MongoClient;


function urlShortener(req, res) {
    
    var dbConnectLink = process.env.MONGO_URI;
    var baseUrl = process.env.APP_URL;
    
    function validateURL(obj) {
        
        /*
        console.log("here is the obj... \n", obj, "\n");
        console.log("testing for obj.hostname: ", obj.hostname);
        console.log("testing for obj.path: ", obj.path);
        //*/
        
        var validCharsHost = /[a-z0-9]([a-z0-9\-\.\%]?)+\.([a-z]+)/i;
        var validCharsPath = /[a-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\%]/i;
        var host = (validCharsHost.test(obj.hostname) && /^[^\-\.]/.test(obj.hostname) && /[^\-\.]$/.test(obj.hostname)) || obj.hostname === "localhost";
        var path = validCharsPath.test(obj.path) && (/^\/?/.test(obj.path) || obj.path === "" || obj.path === null || obj.path === "/");
        var protocol = obj.protocol === "http:" || obj.protocol === "https:" || obj.protocol === "ftp:" || obj.protocol === "" || obj.protocol === null;
        var result = false;
        
        if (host && path && protocol) {
            result = true;
        }
        
        if (obj.port) {
            var port = /\d{2,5}/.test(obj.port);
            if (!port) result = false;
        }

        return result;
    }
    
    function makeItShort(counter) {
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        var conversion = [];
        var num = counter;
        var div;
        var out;
        
        while (num > 0) {
            div = num % 62;
            num = Math.floor(num / 62);
            conversion.push(div);
        }
        
        if (conversion) {
            conversion.reverse();
            out = conversion.map(function(el) {
                return chars[el];
            });
            out = out.join("");
        } else {
            out = "Sorry. Something went wrong with our internal calculations.";
        }
        
        return out;
    }
    
    
    this.shortenLink = function(req, next) {
        var short;
        
        console.log("link i received from request... ", req.originalUrl);
        
        var link = req.originalUrl;
        link = link.replace(/^\/_api\/urls\//i, "");
        var parsedLink = url.parse(link);
        
        if (parsedLink.protocol === null || /localhost/i.test(parsedLink.protocol)) {
            parsedLink = url.parse("http://" + link);
            link = "http://" + link;
        }
        
        if (validateURL(parsedLink)) {

        ///////////
        
            console.log("parsed link... ", parsedLink);
        
            if (!parsedLink.protocol) {
                link = "http://" + link;
            }
            
            mongodb.connect(dbConnectLink, function(err, db) {
                if (err) {
                    console.error("We could not connect to our database. Please try again.");
                    return;
                }
                
                var links = db.collection("links");
                
                links.findOne({"linksCounter": {$gte: 0}}, function(err, doc) {
                    if (err) console.error(err);

                    if (!doc || !doc.linksCounter) {
                        links.insert({"linksCounter": 0}, function(err, result) {
                            if (err) console.log(err);
                        });
                    } 
                    
                    links.update({"linksCounter": {$gte: 0}}, {$inc: {"linksCounter": 1}}, function(err, c) {
                        if (err) console.error(err);
                        
                        links.findOne({"linksCounter": {$gte: 0}}, function(err, doc) {
                            if (err) console.log(err);
                            
                            short = makeItShort(doc.linksCounter);
                            links.insert({
                                "id": short,
                                "shortUrl": baseUrl + short,
                                "originalUrl": link
                            }, function(err, doc) {
                                if (err) {
                                    console.error(err);
                                }
                                
                                var outObj = {
                                    "shortUrl": doc.ops[0].shortUrl,
                                    "originalUrl": doc.ops[0].originalUrl
                                };
                                db.close();
                                next(outObj);
                            });
                            
                        });
                        
                    });
    
                });
            });
            
        ///////////    
            
        } else {
            short = "Invalid URL";
            next(short);
        }

    };
    
    this.restoreLink = function(short, next) {
        var long;
        var link = short.originalUrl.replace(/^\//, "");
        
        if (link) {
            mongodb.connect(dbConnectLink, function(err, db) {
                if (err) console.error(err);
                var links = db.collection("links");
                links.findOne({ "id": link }, function(err, doc) {
                    if (err) console.error(err);
                    
                    if (doc) {
                        long = doc.originalUrl;
                    } else {
                        long = short.originalUrl;
                    }
                    db.close();
                    next(long);
                });
            });
        } else {
            long = "/_home";
            next(long);
        }
        
    };
    
}

module.exports = urlShortener;