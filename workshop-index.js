var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});

var reddit = require('./redditTest');
var redditAPI = reddit(connection);

var app = express();
app.set('view engine', 'pug');

// app.get('/hello', function (request, response) {
//   var name = request.query.name;   
//   response.send(`<h1>Hello ${name}!</h1>`);
// });

// app.get('/hello/:name', function (request, response) {
//   var name = request.params.name
//   response.send(`<h1>Hello ${name}!</h1>`);
// });

// app.get('/calculator/:operation', function(request, response){
//     var operatorType = request.params.operation;
//     var num1 = parseInt(request.query.num1);
//     var num2 = parseInt(request.query.num2);
//     var solution = '';
//     switch(operatorType) {
//         case 'add':
//             solution = num1 + num2;
//             break;
//         case 'sub':
//             solution = num1 > num2 ? num1 - num2 : num2 - num1;
//             break;
//         case 'mult':
//             solution = num1 * num2;
//             break;
//         case 'div':
//             solution = num1 / num2;
//             break;
//         default:
//             response.status(response.send(400));
//     }

//         response.send({
//                 operator: operatorType,
//                 firstOperand: num1,
//                 secondOperand: num2,
//                 solution: solution
//             });
    
// });

    app.get('/posts', function(request, response) {
        redditAPI.getAllPosts('', 0, function(err, posts) {
            if (err) console.log(err, "Error using getAllPosts");
            else {
                console.log(posts);
                response.render('post-list', {posts: posts});
            }
        });
    });


app.get('/createContent', function(request, response) {
response.render('create-content');
})

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post('/createContent', urlencodedParser, function(request, response){
    redditAPI.createPost(2, {
      title: request.body.title,
      url: request.body.url,
      userId: 10
    }, function(err, post) {
      if (err) {
        console.log(err);
      }
      else {
        var postId = request.params.id  
        response.redirect(`/posts`);
      } 
    });
});



/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});