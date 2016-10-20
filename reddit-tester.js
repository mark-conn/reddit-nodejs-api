var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'connman', 
  password : '',
  database: 'reddit'
});

var reddit = require('./redditTest');
var redditAPI = reddit(connection);

// redditAPI.getAllSubreddits(function(err, result){
//     if(err) console.log(err, "error using getAllSubreddits");
//     else {
//      console.log(JSON.stringify(result, null, 4));
//     }
//     connection.end();
// });

// redditAPI.getSinglePost(3, function(err, result) {
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
//         console.log(JSON.stringify(result, null, 4))    
//     }
//     connection.end();
// })

// redditAPI.createPost(1, {
//       title: `70s porn rules!`,
//       url: 'https://www.reddit.com',
//       userId: 2
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(post);
//       } connection.end();
//     });

// redditAPI.createSubreddit({
//       name: `ass to ass`,
//       description: `great movie`
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(post);
//       } connection.end();
//     });

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




redditAPI.getAllPosts(25, function(err, result){
    if(err) console.log(err, "Error using getAllPosts");
    else {
      var newResults = result.map(function(postObj){
        return {
            id: postObj.id,
            title: postObj.title,
            url: postObj.url,
            userId: postObj.userId,
            subreddit: {
                name: postObj.name,
                description: postObj.description
            },
            createdAt: postObj.createdAt,
            updatedAt: postObj.updatedAt,
                user: {
                    id: postObj.uid,
                    username: postObj.username,
                    createdAt: postObj.ucAt,
                    updatedAt: postObj.uuAt
                }
            }
        })    
        console.log(JSON.stringify(newResults, null, 4))    
    }
    connection.end();
})