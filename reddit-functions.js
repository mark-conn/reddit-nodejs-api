var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var secureRandom = require('secure-random');

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(username, password, callback) {
      
      // first we have to hash the password...
      bcrypt.hash(password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO users (username,password, createdAt) VALUES (?, ?, ?)', [username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                        callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    createPost: function(subredditId, post, callback) {
      if(!subredditId || !post) {
        callback(new Error("Please insert a post and valid subreddit id"))
      } else {
      conn.query(
        'INSERT INTO posts (userId, title, url, subredditId, createdAt) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, subredditId, new Date()],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id,title,url,userId, createdAt, updatedAt FROM posts WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
      }
    },
    getAllPosts: function(sortingMethod, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      // if(!sortingMethod) sortingMethod = '';
      // if(!options) options = 0;
      
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      switch(sortingMethod) {
        case 'Newest ranking':
          sortingMethod = `posts.createdAt DESC`;
          break;
        case 'Hotness ranking':
          sortingMethod = `sum(votes.vote)/(datediff(curDate(), posts.createdAt)) DESC`;
          break;
        case `Top ranking`:
          sortingMethod = `SUM(votes.vote) DESC`;
          break;
        case 'Controversial':
          sortingMethod = '';
          break;
        default:
          sortingMethod = `voteScore DESC`;
      }
      
  conn.query(`
  SELECT 
  posts.id as posts_id, 
  posts.url as posts_url, 
  posts.title as posts_title, 
  posts.subredditId, 
  posts.userId,
  posts.createdAt,
  votes.vote,
  votes.createdAt,
  votes.postId AS vote_pid,
  votes.userId AS vote_uid,
  SUM(votes.vote > 0) as upVotes,
  SUM(votes.vote < 0) as downVotes,
  COUNT(votes.vote) as voteCount,
  SUM(votes.vote) as voteScore,
  users.id AS uid, 
  users.username, 
  users.createdAt AS ucAt, 
  users.updatedAt AS uuAt,
  subreddits.id as subreddit_id,
  subreddits.name,
  subreddits.description,
  subreddits.createdAt as subreddit_createdAt,
  subreddits.updatedAt as subreddit_updatedAt
  FROM posts 
  JOIN users ON posts.userId = users.id
  LEFT JOIN subreddits ON posts.subredditId = subreddits.id
  LEFT JOIN votes ON posts.id = votes.postId
        GROUP BY posts.id
        ORDER BY ${sortingMethod}
        LIMIT ? OFFSET ?`
        , [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
        results = results.map(function(postObj) {
          return {
            id: postObj.posts_id,
            title: postObj.posts_title,
            url: postObj.posts_url,
            userId: postObj.userId,
            subreddit: {
              id: postObj.subreddit_id,
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
            },
            votes: {
              score: postObj.voteScore,
              upVotes: postObj.upVotes,
              downVotes: postObj.downVotes
            }
          };
        });
            callback(null, results);
          }
        }
      );
    },
    getAllPostsForUser: function(userId, options, callback) {
          if (!callback) {
            callback = options;
            options = {};
          }
          var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
          var offset = (options.page || 0) * limit;
        if(!userId) {
          callback(new Error("please insert a user id"));
        } else {
  conn.query(`
  SELECT *  
  FROM posts 
  LEFT JOIN 
       (SELECT users.id AS uid, users.username, users.createdAt AS ucAt, users.updatedAt AS uuAt FROM users) as user        
        ON posts.userId = user.uid
  LEFT JOIN (
  SELECT subreddits.id as subreddit_id,
  subreddits.name,
  subreddits.description,
  subreddits.createdAt as subreddit_createdAt,
  subreddits.updatedAt as subreddit_updatedAt
  FROM subreddits) as subreddit_table
          ON posts.subredditId = subreddit_table.subreddit_id
  LEFT JOIN 
        (SELECT votes.vote,
        votes.createdAt,
        votes.postId AS vote_pid,
        votes.userId AS vote_uid,
        SUM(votes.vote > 0) as upVotes,
        SUM(votes.vote < 0) as downVotes,
        SUM(votes.vote) as voteScore
  FROM votes) as voteTable
        ON posts.id = voteTable.vote_pid
        WHERE user.uid = ?
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?`, 
        [userId, limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            results = results.map(function(postObj) {
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
            },
            votes: {
              score: postObj.voteScore,
              upVotes: postObj.upVotes,
              downVotes: postObj.downVotes
            }
          };
            });
            callback(null, results);
          }
        }
      );
    }
    },
    getSinglePost: function(postId, callback) {
        conn.query(`
  SELECT *  
  FROM posts 
  LEFT JOIN 
       (SELECT users.id AS uid,
        users.username, 
        users.createdAt AS ucAt, 
        users.updatedAt AS uuAt 
        FROM users) as user        
        ON posts.userId = user.uid
  LEFT JOIN (
  SELECT subreddits.id as subreddit_id,
  subreddits.name,
  subreddits.description,
  subreddits.createdAt as subreddit_createdAt,
  subreddits.updatedAt as subreddit_updatedAt
  FROM subreddits) as subreddit_table
          ON posts.subredditId = subreddit_table.subreddit_id
  LEFT JOIN 
        (SELECT votes.vote,
        votes.createdAt,
        votes.postId AS vote_pid,
        votes.userId AS vote_uid,
        SUM(votes.vote > 0) AS upVotes,
        SUM(votes.vote < 0) AS downVotes,
        SUM(votes.vote) AS voteScore
  FROM votes) AS voteTable
        ON posts.id = voteTable.vote_pid
        WHERE posts.id = ?
        ORDER BY posts.createdAt DESC`, [postId],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            results = results.map(function(postObj) {
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
            },
            votes: {
              score: postObj.voteScore,
              upVotes: postObj.upVotes,
              downVotes: postObj.downVotes
            }
          };
            })
            callback(null, results);
          }
        }
      );
    },
    createSubreddit: function(sub, callback) {
      if(!sub || !sub.name) {
        callback(new Error("name is mandatory"));
      } else {
      conn.query(
        `INSERT INTO subreddits(name, description, createdAt) VALUES (?, ?, ?)`, [sub.name, sub.description, new Date()],
        function(err, result) {
          if(err) { callback(err); }
          else {
            conn.query(
              `SELECT * FROM subreddits WHERE id = ?`, [result.insertId],
                            function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
              );
          }
        }
        );
      }
    },
    getAllSubreddits: function(callback) {
      conn.query(
        `SELECT * FROM subreddits ORDER BY createdAt DESC`,
         function(err, result) {
           if (err) {
             callback(err);
           }
           else {
             callback(null, result);
           }
         });
    },
    createOrUpdateVote: function(voteObj, callback) {
      if(voteObj.vote === 1 || voteObj.vote === 0 || voteObj.vote === -1) {
      conn.query(
        `INSERT INTO votes SET postId= ?, 
         userId= ?, vote= ?, createdAt= ?, updatedAt = ? 
         ON DUPLICATE KEY UPDATE vote= ?;`
         , [voteObj.postId, voteObj.userId, voteObj.vote, Date.now(), Date.now(), voteObj.vote],
        function(err, result) {
            if(err) console.log(err, "error in createOrUpdateVote");
            else {
              callback(null, result);
            }
        });
      } else {
        callback(new Error("Rejected! Use a proper vote input"));
      }
    },
    checkLogin: function(user, pass, callback) {
  conn.query('SELECT * FROM users WHERE username = ?', [user], function(err, result) {
    if(err) console.log(err, "Error in checkLogin");
    else {
    if (result.length === 0) {
      callback(new Error('username or password incorrect')); // in this case the user does not exists
    }
    else {
      var user = result[0];
      var actualHashedPassword = user.password;
      bcrypt.compare(pass, actualHashedPassword, function(err, result) {
        if(err) console.log(err, "error in bycrypt compare");
        else {
        if(result === true) { // let's be extra safe here
          callback(null, user);
        }
        else {
          callback(new Error('username or password incorrect')); // in this case the password is wrong, but we reply with the same error
        }}
      });
    }}
  });
},
    createSession: function(user, callback) {
    var token = secureRandom.randomArray(100).map(code => code.toString(36)).join('');
    conn.query('INSERT INTO sessions SET userId = ?, username = ?, token = ?', [user.id, user.username, token],
    function(err, result) {
        if(err) {
          callback(err);
        }
        else {
          callback(null, token);
        }
    });
  },
    getUserFromSession: function(sessionToken, callback) {
    if(sessionToken) {
    conn.query('SELECT * FROM sessions WHERE token = ?', [sessionToken],
      function(err, user) {
          if(err) {
            callback(err);
          }
          else {
            callback(null, user[0]);
          }
      }
    )};
  },
    showSubreddit: function(sortingMethod, sub, options, callback) {
      if (!callback) {
        callback = options;
        options = {};
      }
      
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      switch(sortingMethod) {
        case 'Newest ranking':
          sortingMethod = `posts.createdAt DESC`;
          break;
        case 'Hotness ranking':
          sortingMethod = `sum(votes.vote)/(datediff(curDate(), posts.createdAt)) DESC`;
          break;
        case `Top ranking`:
          sortingMethod = `SUM(votes.vote) DESC`;
          break;
        case 'Controversial':
          sortingMethod = '';
          break;
        default:
          sortingMethod = `voteScore DESC`;
      }
      
  conn.query(`
  SELECT 
  posts.id as posts_id, 
  posts.url as posts_url, 
  posts.title as posts_title, 
  posts.subredditId, 
  posts.userId,
  votes.vote,
  votes.createdAt,
  votes.postId AS vote_pid,
  votes.userId AS vote_uid,
  SUM(votes.vote > 0) as upVotes,
  SUM(votes.vote < 0) as downVotes,
  COUNT(votes.vote) as voteCount,
  SUM(votes.vote) as voteScore,
  users.id AS uid, 
  users.username, 
  users.createdAt AS ucAt, 
  users.updatedAt AS uuAt,
  subreddits.id as subreddit_id,
  subreddits.name,
  subreddits.description,
  subreddits.createdAt as subreddit_createdAt,
  subreddits.updatedAt as subreddit_updatedAt
  FROM posts 
  JOIN users ON posts.userId = users.id
  LEFT JOIN subreddits ON posts.subredditId = subreddits.id
  LEFT JOIN votes ON posts.id = votes.postId
        WHERE posts.subredditId = ?
        GROUP BY posts.id
        ORDER BY ${sortingMethod}
        LIMIT ? OFFSET ?`
        , [sub, limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
        results = results.map(function(postObj) {
          return {
            id: postObj.posts_id,
            title: postObj.posts_title,
            url: postObj.posts_url,
            userId: postObj.userId,
            subreddit: {
              id: postObj.subreddit_id,
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
            },
            votes: {
              score: postObj.voteScore,
              upVotes: postObj.upVotes,
              downVotes: postObj.downVotes
            }
          };
        });
            callback(null, results);
          }
        }
      );
    },
    logOut: function(token, callback) {
      conn.query('DELETE FROM sessions WHERE token= ?', [token],
      function(err, result) {
        if(err) {
          callback(err);
        } else {
          callback(null, result);
        }
        
      })
      
    }
  };
};
