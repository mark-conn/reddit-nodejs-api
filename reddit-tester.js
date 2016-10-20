var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});

var reddit = require('./redditTest');
var redditAPI = reddit(connection);

redditAPI.getSinglePost(3, function(err, result) {
    if(err) console.log(err, "Error using getAllPostsForUser");
    else {
      var newResults = result.map(function(postObj){
        return {
            id: postObj.id,
            title: postObj.title,
            url: postObj.url,
            userId: postObj.userId,
            createdAt: postObj.createdAt,
            updatedAt: postObj.updatedAt,
                user: {
                    id: postObj.uid,
                    username: postObj.username,
                    createdOn: postObj.ucAt,
                    updatedOn: postObj.uuAt
                }
            }
        })    
        console.log(JSON.stringify(newResults, null, 4))    
    }
    connection.end();
})











// redditAPI.getAllPostsForUser(9, 25, function(err, result) {
//     if(err) console.log(err, "Error using getAllPostsForUser");
//     else {
//       var newResults = result.map(function(postObj){
//         return {
//             id: postObj.id,
//             title: postObj.title,
//             url: postObj.url,
//             userId: postObj.userId,
//             createdAt: postObj.createdAt,
//             updatedAt: postObj.updatedAt,
//                 user: {
//                     id: postObj.uid,
//                     username: postObj.username,
//                     createdOn: postObj.ucAt,
//                     updatedOn: postObj.uuAt
//                 }
//             }
//         })    
//         console.log(JSON.stringify(newResults, null, 4))    
//     }
//     connection.end();
// })




// redditAPI.getAllPosts(25, function(err, result){
//     if(err) console.log(err, "Error using getAllPosts");
    // else {
    //   var newResults = result.map(function(postObj){
    //     return {
    //         id: postObj.id,
    //         title: postObj.title,
    //         url: postObj.url,
    //         userId: postObj.userId,
    //         createdAt: postObj.createdAt,
    //         updatedAt: postObj.updatedAt,
    //             user: {
    //                 id: postObj.uid,
    //                 username: postObj.username,
                    // createdOn: postObj.ucAt,
                    // updatedOn: postObj.uuAt
    //             }
    //         }
    //     })    
    //     console.log(JSON.stringify(newResults, null, 4))    
    // }
    // connection.end();
// })