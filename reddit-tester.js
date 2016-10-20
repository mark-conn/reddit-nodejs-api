var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});

var reddit = require('./redditTest');
var redditAPI = reddit(connection);

redditAPI.getAllPosts(25, function(err, result){
    if(err) console.log(err, "Error using getAllPosts");
    else {
       var newResults = result.map(function(postObj){
        return {
            id: postObj.id,
            title: postObj.title,
            url: postObj.url,
            createdAt: postObj.createdAt,
            updatedAt: postObj.updatedAt,
                user: {
                    id: postObj.uid,
                    username: postObj.username,
                    createdOn: postObj.createdOn,
                    updatedOn: postObj.updatedOn
                }
            }
        })    
        console.log(JSON.stringify(newResults, null, 4))    
    }
    connection.end();
})