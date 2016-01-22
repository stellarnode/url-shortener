"use strict";

var url = require("url");
var mongodb = require("mongodb").MongoClient;


function urlShortener(req, res) {
    
    var dbConnectLink = process.env.MONGO_URI;
    var baseUrl = process.env.APP_URL;
    
    function validateURL(obj) {
        
        /*
        
        var result;
        var myRegExp =/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
        var urlToValidate = obj.originalUrl;
        
        console.log("validating url: ", urlToValidate);
        
        if (!myRegExp.test(urlToValidate)) {
            result = false;
        } else {
            result =  true;
        }
        
        //*/
        
        //*
        
        var validCharsHost = /[a-z0-9\-\.\%]/i;
        var validCharsPath = /[a-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\%]/i;
        var host = validCharsHost.test(obj.hostname) && /^[^\-\.]/.test(obj.hostname) && /[^\-\.]$/.test(obj.hostname);
        var path = validCharsPath.test(obj.path) && (/^\/?/.test(obj.path) || obj.path === "" || obj.path === null);
        var protocol = obj.protocol === "http:" || obj.protocol === "ftp:" || obj.protocol === "" || obj.protocol === null;
        var result = false;
        
        if (host && path && protocol) {
            result = true;
        }
        
        if (obj.port) {
            var port = /\d{2, 5}/.test(obj.port);
            if (!port) result = false;
        }
        
        //*/
        
        console.log("obj to validate: ", obj);
        
        console.log("host: ", host, " path: ", path, " protocol: ", protocol, " port: ", port, " validation result: ", result);

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
        
        console.log("composition for short link: ", out);
        return out;
    }
    
    function makeItShortandRemember(link) {
        var short;
        
        
        
    }
    
    
    this.shortenLink = function(req, next) {
        var short;
        var link = req.originalUrl;
        link = link.replace(/^\/_api\/urls\//i, "");
        var parsedLink = url.parse(link);
        
        if (validateURL(parsedLink)) {
        
        ///////////    
        
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
                    console.log("doc with linkCounter found =", doc);
                    if (!doc || !doc.linksCounter) {
                        links.insert({"linksCounter": 0}, function(err, result) {
                            if (err) console.log(err);
                            console.log("first document with counter inserted: ", result);
                        });
                    } 
                    
                    links.update({"linksCounter": {$gte: 0}}, {$inc: {"linksCounter": 1}}, function(err, c) {
                        if (err) console.error(err);
                        
                        links.findOne({"linksCounter": {$gte: 0}}, function(err, doc) {
                            if (err) console.log(err);
                            console.log("link: ", link, "... links counter passed further: ", doc.linksCounter);
                            short = makeItShort(doc.linksCounter);
                            links.insert({
                                "id": short,
                                "shortUrl": baseUrl + short,
                                "originalUrl": link
                            }, function(err, doc) {
                                if (err) {
                                    console.error(err);
                                    console.log(err);
                                }
                                
                                console.log("before forming the output obj: ", doc.ops[0].shortUrl, doc.ops[0].originalUrl);
                                
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
                    long = doc.originalUrl;
                    next(long);
                });
            });
        } else {
            long = "Sorry, could not find the link in our database.";
            next(long);
        }
        
    };
    
}

module.exports = urlShortener;