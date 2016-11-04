var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var favicon = require('serve-favicon');

var app = express();
app.use('/', express.static('static-files'));
// Specify the usage of the Pug template engine
app.set('view engine', 'pug');

// Middleware
// This middleware will parse the POST requests coming from an HTML form, and put the result in req.body.  Read the docs for more info!
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.use(favicon(__dirname + '/public/favicon.ico'));
// This middleware will parse the Cookie header from all requests, and put the result in req.cookies.  Read the docs for more info!
app.use(cookieParser());

// This middleware will console.log every request to your web server! Read the docs for more info!
app.use(morgan('dev'));

app.use(checkLoginToken);
/*
IMPORTANT!!!!!!!!!!!!!!!!!
Before defining our web resources, we will need access to our RedditAPI functions.
You will need to write (or copy) the code to create a connection to your MySQL database here, and import the RedditAPI.
Then, you'll be able to use the API inside your app.get/app.post functions as appropriate.
*/
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});
var reddit = require('./reddit-functions');
var redditAPI = reddit(connection);

function checkLoginToken(request, response, next) {
  // check if there's a SESSION cookie...
  if (request.cookies.SESSION) {
    redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
      // if we get back a user object, set it on the request. From now on, this request looks like it was made by this user as far as the rest of the code is concerned
      if (user) {
        request.loggedInUser = user;
      }
      next();
    });
  }
  else {
    // if no SESSION cookie, move forward
    next();
  }
}
// Resources
app.get('/homepage/:username', function(request, response) {
    redditAPI.getAllPosts(request.body.sort, {numPerPage: 50}, function(err, posts) {
        if (err) console.log(err, "Error using getAllPosts");
        else {
            response.render('homepage', {posts: posts, user: request.params.username});
        }
    });
})

app.post('/', function(request, response) {
    redditAPI.getAllPosts(request.body.sort, function(err, posts) {
        if(err) console.log(err);
        else {
            response.render('homepage', {posts: posts, user: request.loggedInUser.username});
        }
    })
    
})

app.get('/', function(request, response) {
    if(request.loggedInUser) {
      response.redirect(`/homepage/${request.loggedInUser.username}`);  
    } else {
    redditAPI.getAllPosts('', 0, function(err, posts) {
        if (err) console.log(err, "Error using getAllPosts");
        else {
            response.render('post-list', {posts: posts});
        }
    });
    }
    });

app.get('/login', function(request, response) {
  // code to display login form
  response.render('login-form');
  
});

app.post('/login', function(request, response) {
  // code to login a user
  // hint: you'll have to use response.cookie here
  redditAPI.checkLogin(request.body.username, request.body.password, function(err, user){
      if(err) console.log(err, "Error posting login");
      else {
        redditAPI.createSession(user, function(err, token) {
        if(err) {
            response.status(500).send('an error occurred, please try again later.');
        }
        else {
        response.cookie('SESSION', token);
        response.redirect(`/homepage/${user.username}`);
        }
        });  
      }
  });
});

app.get('/signup', function(request, response) {
  // code to display signup form
  response.render('signup-form');
});

app.post('/signup', function(request, response) {
  redditAPI.createUser(request.body.username, request.body.password
      , function(err, result){
      if(err) console.log(err, "error in signup post");
      else {
        redditAPI.createSession(result, function(err, token) {
        if(err) {
            response.status(500).send('an error occurred, please try again later.');
        }
        else {
        response.cookie('SESSION', token);  
        response.redirect(`/homepage/${request.body.username}`); 
        }
        });  
      }
  });  
});

app.get('/createPost/:id', function(request, response) {
    var sub = request.headers.referer.split('/r/')
    if(sub.length > 1) {
        response.render('create-content-subreddit', {subreddit: request.headers.referer, id: request.params.id, tag: sub[1]});
    } else {
    response.redirect('/subreddits');
    }
});

app.post('/createPost/:id', function(request, response) {
    if(!request.loggedInUser) {
        response.status(401).send("You must be logged in to post");
    } else {
        redditAPI.createPost(request.params.id, {
            title: request.body.title,
            url: request.body.url,
            userId: request.loggedInUser.userId
        }, function(err, post) {
            if(err) console.log(err, "Stopped here");
            else {
                response.redirect('/r/' + request.body.tag);
            }
        });
    }
});

app.post('/vote', function(request, response) {
  // code to add an up or down vote for a content+user combination
      if(!request.loggedInUser) {
        response.status(401).send("You must be logged in to post");
    } else {
        redditAPI.createOrUpdateVote(
            {
            vote: Number(request.body.vote),
            postId: Number(request.body.postId),
            userId: request.loggedInUser.userId
            }, function(err, result){
                if(err) console.log(err);
                else {
                response.send({"success": true});
                }
            });
    }
});

app.get('/subreddits', function(request, response) {
    redditAPI.getAllSubreddits(function(err, results){
        if(err) console.log(err);
        else {
            response.render('subreddits', {results: results});
        }
    })
});

app.get('/r/:id/:subreddit', function(request, response) {
   redditAPI.showSubreddit('', request.params.id, 0, function(err, posts) {
     if(err) console.log(err) 
     else {
        response.render('subreddit-page', {posts: posts, name: request.params.subreddit, id: request.params.id});
     }
   }); 
});

app.post('/r/:id/:subreddit', function(request, response) {
   redditAPI.showSubreddit(request.body.sort, request.params.id, 0, function(err, posts) {
     if(err) console.log(err) 
     else {
        response.render('subreddit-page', {posts: posts, name: request.params.subreddit, id: request.params.id});
     }
   }); 
});

app.post('/logout', function(request, response) {
    redditAPI.logOut(request.loggedInUser.token, function(err, result) {
        if(err) console.log(err);
        else {
          response.clearCookie('SESSION').redirect('/'); 
        }
    });
});

// Listen
var port = process.env.PORT || 3000;
app.listen(port, function() {
  // This part will only work with Cloud9, and is meant to help you find the URL of your web server :)
  if (process.env.C9_HOSTNAME) {
    console.log('Web server is listening on https://' + process.env.C9_HOSTNAME);
  }
  else {
    console.log('Web server is listening on http://localhost:' + port);
  }
});