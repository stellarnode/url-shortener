# Simple URL Shortener Microservice

## Overview

This project is a response to the [Free Code Camp](http://www.freecodecamp.com) full stack web development challenge with a goal to build a simple API microservice to shorten URLs.

## How to use

#### In order to add your URL to the database:

* Point your browser or your app to the following path on our domain: `/_api/urls/`. After this path you should put a valid URL you want to be shortened. For example, `http://www.google.com`.
* The API will respond with a JSON object with two fields - the shortened URL and the original URL. For example:

```
{
    "shortUrl":"https://url-shortener-stellarnode.c9users.io/B",
    "originalUrl":"http://www.google.com"
}
```

#### In order to use the shortened URL:

* Just point your browser or your app to the short URL you were provided. For example, `[our domain name]/B`.
* You will be redirected to the original URL you specified initially.

## License

MIT License. [Click here for more information.](LICENSE.md)
