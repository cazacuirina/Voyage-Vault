const { db, admin } = require("../database/database");

exports.getPostComments = async (req, res) => {
    try{
        let postId=req.params.postId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()

        if (!postDoc.exists) { 
            res.status(404).send({error:'Post not found'})
        }else{
            const commentsSnapshot=await postRef.collection('comments').get()
        
            if(commentsSnapshot.empty){
                res.status(404).send({error:"No comment found"})
            }else{
                let comments=[]
                commentsSnapshot.forEach((doc)=>{ 
                    comment=doc.data()   
                    comment.id=doc.id   
                    comments.push(comment)
                })
                res.status(200).send(comments)
            }
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
}

exports.getReplies = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
    
        const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
    
        const commentDoc = await commentRef.get();
        if (!commentDoc.exists) {
          return res.status(404).json({ error: 'Comment not found' });
        }
    
        const repliesCollection = commentRef.collection('replies');
        const repliesSnapshot = await repliesCollection.get();
    
        if (repliesSnapshot.empty) {
          return res.status(200).json([]);  
        }
    
        const replies = repliesSnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });
    
        res.status(200).json(replies);
      } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}

exports.createComment = async (req, res) => {
    try {
        if(!req.body.hasOwnProperty("comment")){
            return res.status(400).json({ error: 'Comment is required' })
        }else{
            let postId=req.params.postId
            let comment = req.body

            if (!comment.hasOwnProperty("comment") || !comment.hasOwnProperty("userName")) {
              return res.status(400).json({ error: 'Comment and username are required' });
            }

            console.log('Post Id: '+postId+' Trying to post the following data: '+ comment)

            const postRef = db.collection('posts').doc(postId)
            const postDoc = await postRef.get()

            if (postDoc.empty) {  
                res.status(404).send({error:'Post not found'})
            }else{
                const commentsCollection = postRef.collection('comments')
                const newComment = await commentsCollection.add(comment) 
                comment.id=newComment.id
                console.log('Added document with ID:', newComment.id)

                res.status(201).send(comment)
            }
    }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'})
    }
}

exports.createReply = async (req, res) => {
    try {
          if (!req.body.hasOwnProperty("comment")) {
              return res.status(400).json({ error: 'Reply is required' });
          }
    
          let { postId, commentId } = req.params;
          console.log(postId, "  ", commentId)
          let replyData = req.body;
    
    
          console.log(replyData)
    
          if (!replyData.hasOwnProperty("comment") || !replyData.hasOwnProperty("userName")) {
            return res.status(400).json({ error: 'Reply and username are required' });
          }
    
          console.log(`Post ID: ${postId}, Comment ID: ${commentId} - Trying to add reply: ${replyData.comment}`);
    
          const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
          const commentDoc = await commentRef.get();
    
          if (!commentDoc.exists) { 
              return res.status(404).json({ error: 'Comment not found' });
          }
    
          const repliesCollection = commentRef.collection('replies');
          const newReply = await repliesCollection.add(replyData); 
          replyData.id = newReply.id;
    
          console.log('Added reply with ID:', newReply.id);
    
          await commentRef.update({
            repliesCount: admin.firestore.FieldValue.increment(1) 
          });
    
          res.status(201).json(replyData);
      } catch (error) {
          console.error('Error adding reply:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
}

exports.updateComment = async (req, res) => {
    try {
        if(!req.body.hasOwnProperty("comment")){
            return res.status(400).json({ error: 'Comment is required' })
        }else{
            const postId = req.params.postId
            const commentId = req.params.commentId
            const comment=req.body.comment

            const postRef = db.collection('posts').doc(postId)  
            const postDoc = await postRef.get()  

            if (!postDoc.exists) {  
                res.status(404).send({error:'Post not found'})
                return
            }

            const commentRef = postRef.collection("comments").doc(commentId)
            const commentDoc = await commentRef.get() 

            if (!commentDoc.exists) {
                res.status(404).send({error:'Comment not found'})
                return
            }

            if (commentDoc.data().userName !== req.userName) {  
                res.status(403).send({ error: 'Unauthorized to edit this comment' })
                return
            }

            const updatedPost = await commentRef.update({
                comment: comment
            })   

            res.status(200).send(updatedPost)
     }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'})
    }
}

exports.deleteComment = async (req, res) => {
    try {
        const postId = req.params.postId;
        const commentId = req.params.commentId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()   

        if (!postDoc.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        const commentRef = postRef.collection("comments").doc(commentId)
        const commentDoc = await commentRef.get() 

        if (!commentDoc.exists) {
            res.status(404).send({error:'Comment not found'})
            return
        }

        if (commentDoc.data().userName !== req.userName) { 
            res.status(403).send({ error: 'Unauthorized to delete this comment' })
            return
        }

        const deletedComment = await commentRef.delete()   

        res.status(204).send({message:'Comment deleted successfully'})
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
}
