var express = require('express');
var app = express();

// app.get('/hello', function (request, response) {
//   var name = request.query.name;   
//   response.send(`<h1>Hello ${name}!</h1>`);
// });

// app.get('/hello/:name', function (request, response) {
//   var name = request.params.name
//   response.send(`<h1>Hello ${name}!</h1>`);
// });

app.get('/calculator/:operation', function(request, response){
    var operatorType = request.params.operation;
    var num1 = parseInt(request.query.num1);
    var num2 = parseInt(request.query.num2);
    var solution = '';
    switch(operatorType) {
        case 'add':
            solution = num1 + num2;
            break;
        case 'sub':
            solution = num1 > num2 ? num1 - num2 : num2 - num1;
            break;
        case 'mult':
            solution = num1 * num2;
            break;
        case 'div':
            solution = num1 / num2;
            break;
        default:
            response.status(response.send(400));
    }

        response.send({
                operator: operatorType,
                firstOperand: num1,
                secondOperand: num2,
                solution: solution
            });
    
});



/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});