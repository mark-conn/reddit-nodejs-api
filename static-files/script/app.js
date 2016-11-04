/* global $ */
$(document).ready(function() {
    $('.vote').on('click',function(){
        
        var postId = $(this).data('postid');
        var direction = $(this).data('direction');
        var votescore = $(this).closest('.post').find('.vote-scores').find('.votescore').data('votescore');
        var upvotes = $(this).closest('.post').find('.vote-scores').find('.upvotes').data('upvotes');
        var downvotes = $(this).closest('.post').find('.vote-scores').find('.downvotes').data('downvotes');
        // console.log(postId)
        // console.log(direction)
        var self = $(this);
        $.post({
        url: '/vote', 
        data: {postId: postId, vote: direction}
        
        }).then(function(answer) {
            console.log(votescore);
            if(direction === 1) {
            self.closest('.post').find('.vote-scores').find('.votescore').text("7");  
            // $(this).closest('.post').find('.vote-scores').find('.votescore').attr('votescore', 5);
            console.log(votescore);
            } else {
            (votescore -= 1);
            console.log(votescore);
            }
        }); 
        }); 
}); 