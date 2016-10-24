var express = require('express');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});

var reddit = require('./redditTest');
var redditAPI = reddit(connection);

var app = express();

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

//     app.get('/posts', function(request, response) {
//         redditAPI.getAllPosts('', 0, function(err, result) {
//             if (err) console.log(err, "Error using getAllPosts");
//             else {
// var htmlResults = (`<div id="contents">
//   <h1>List of contents</h1>
//   <ul class="contents-list">`)
//   for(var i = 0; i < result.length; i++) {
//   htmlResults +=
//   `<li class="${result[i].id}">
//       <h2 class="${result[i].subreddit.name}">
//         <a href=${result[i].url}>${result[i].title}</a>
//       </h2>
//       <p>Created by ${result[i].user.username}</p>
//     </li>`
//     }
//  var htmlEnd =  (`</ul>
// </div>`)
            
//             }
//             response.send(htmlResults + htmlEnd);
//         });

//     });

app.get('/createContent', function(request, response) {
    var htmlForm = `
  <form action="/createContent" method="POST"> 
  <div>
    <input type="text" name="url" placeholder="Enter a URL to content">
  </div>
  <div>
    <input type="text" name="title" placeholder="Enter the title of your content">
  </div>
  <button type="submit">Create!</button>
  </form>`
    response.send(htmlForm)
    
})



/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});