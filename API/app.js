const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const admin = require('firebase-admin')

const serviceAccount = require('./dbcredentials/tic2024-41e34-firebase-adminsdk-m6dc6-564329c655.json')

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();


const express = require('express')
const app = express()
const logger = require('morgan')
const cors = require('cors')
const port = 3001 // SCHIMBA 

app.use(logger('dev'))
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const bcrypt = require('bcrypt')
const saltRounds = 10

let jwt = require('jsonwebtoken')
const fs = require('fs')
const privateKey = fs.readFileSync('private.key');
const publicKey = fs.readFileSync('public.key');


// GET: getAllPosts, getPostFromUser?, getPostWithDestination?, getPostDetails (+getComments)
// POST: OK-postRegister, OK-postLogin, OK-postPost, OK-postComment, postTravelList?
// PUT: OK-putPost, OK-putLike, OK-putComment
// DELETE: OK-deletePost, deleteComment

function checkAuthorization(req, res, next){
    console.log('Passing through middleware')
  
    let token = req.headers.authorization
    console.log(token)

    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7)
    }
  
    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        if (err.expiredAt) {
          res.status(401).json(({error: "expired token"}))
        } else {
          res.status(401).json({error: "unauthorized"})
        }
      } else {
        req.userName = decoded.data
        console.log("Authorized user: "+req.userName)
        next()
      }
    })
  }

//--------------------GET ROUTES------------------------

// -> Get all posts
app.get("/posts", async(req,res)=>{
    try{
        const postSnapshot=await db.collection('posts').get() // ORDER BY NR LIKES, DATE

        if(postSnapshot.empty){
            res.status(404).send({error:"No post found"})
        }else{
            let posts=[]
            postSnapshot.forEach((doc)=>{
                post=doc.data()
                post.id=doc.id
                console.log("Post: ", post)
                posts.push(post)
            })
            res.status(200).send(posts)
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
  })

// -> Get post comments
app.get("/post/:postId/comments", async(req,res)=>{
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
                    console.log("Comment: ", comment)
                    comments.push(comment)
                })
                res.status(200).send(comments)
            }
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
  })



//--------------------POST ROUTES------------------------

// OK! -> Register a new user
app.post('/register', async(req, res) => {
    try {
        if(!req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
            return res.status(400).json({ error: 'Name, email and password are required' })
        }else{
            let user = req.body
            console.log('Trying to post the following data:', user)

            let emailField="email"
            const usersRef = db.collection('users');
            const snapshot = await usersRef.where(emailField, '==', user.email).get()
            if (!snapshot.empty) {
                res.status(409).send({error:'User with the same email already exists'})
            } else {
                bcrypt.hash(user.password, saltRounds, async function (err, hash) {
                    if (err) {
                        console.error(err)
                        res.status(500).send({error:'Internal Server Error'})
                        return;
                    }

                    user.password = hash
                    const newUser = await db.collection('users').add(user)
                    console.log('Added document with ID:', newUser.id)

                    const token = jwt.sign({
                        data: user.name,
                        exp: Math.floor(Date.now() / 1000) + (60 * 60)
                    }, privateKey, {
                        algorithm: 'RS256' // asymmetric
                    })

                    res.status(200).json({
                        token: token,
                        userName: newUser
                    })
                });
            }
        }
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

// OK! -> Login an existing user (username + token)
app.post ('/login', async(req, res) => {
    if(!req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
        return res.status(400).json({ error: 'Email and password are required' })
    }else{
        let user = req.body
        console.log('Trying to login with: ', user)

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', user.email).limit(1).get()
        if (snapshot.empty) {
            res.status(404).send({error:'No user found with this email'})
        }  else{
            let document ={}
            snapshot.forEach(doc => {
                document = doc.data()
            });
            
            console.log(document)
                if (document) {
                    let dbHash = document.password
                    bcrypt.compare(user.password, dbHash, function(err, result) {
                        if (result) {
                            const token = jwt.sign({
                            data: document.name,
                            exp: Math.floor(Date.now() / 1000) + (60 * 60)
                            }, privateKey, {
                            algorithm: 'RS256' //asymetric
                            })
                            console.log("TOKEN: "+token+" NAME "+document.name)
    
                            res.status(200).json({
                            token: token,
                            userName: document.name
                            })
                        } else {
                            res.status(401).json({error: 'Wrong password'})
                        }
                    });
                } else {
                    res.status(401).json({error: "The user doesn't exist"})
                }
        }
    }
})
// OK! -> Add a new Post
app.post('/post', checkAuthorization, async(req, res) => {
    try {
        if(!req.body.hasOwnProperty("title") || !req.body.hasOwnProperty("city") 
            || !req.body.hasOwnProperty("country") || !req.body.hasOwnProperty("description")
            || !req.body.hasOwnProperty("author") || !req.body.hasOwnProperty("date")){
            return res.status(400).json({ error: 'Title, city, coutry, description, author, date are required' })
        }else{
            let post = req.body
            
            console.log('Trying to post the following data:', post)

            const newPost = await db.collection('posts').add(post)
            console.log('Added document with ID:', newPost.id)
            res.status(201).send(newPost)
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'})
    }
})

// OK!-> Add a new Comment
app.post('/post/:postId/comments', checkAuthorization, async(req, res) => {
    try {
        if(!req.body.hasOwnProperty("comment")){
            return res.status(400).json({ error: 'Comment is required' })
        }else{
            let postId=req.params.postId
            let comment = req.body
            //comment.userName=req.userName
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
        res.status(500).send({error:'Internal Server Error'});
    }
})

//--------------------PUT ROUTES------------------------

// OK! -> Edit a Post
app.put('/post/:postId', checkAuthorization, async (req, res) => {
    try {
        if(!req.body.hasOwnProperty("title") || !req.body.hasOwnProperty("city") 
            || !req.body.hasOwnProperty("country") || !req.body.hasOwnProperty("description")){
            return res.status(400).json({ error: 'Title, city, coutry, description are required' })
        }else{
            const postId = req.params.postId
            const {title, city, country, description} = req.body
            const date=admin.firestore.FieldValue.serverTimestamp()

            const postRef = db.collection('posts').doc(postId)
            const postDoc = await postRef.get()

            if (!postDoc.exists) {
                res.status(404).send({error:'Post not found'})
                return
            }

            if (postDoc.data().author !== req.userName) { 
                res.status(403).send({ error: 'Unauthorized to edit this post' })
                return
            }

            const updatedPost = await postRef.update({
                title:title, city:city, country:country, description:description, date:date
            })

            res.status(200).send(updatedPost)
    }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'});
    }
})

// -> OK! - Like a post
app.put('/post/:postId/like', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId
        
        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()

        if (!postDoc.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        const updatedPost = await postRef.update({
            likes: admin.firestore.FieldValue.increment(1)
        })

        res.status(200).send(updatedPost)
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'});
    }
})

// -> OK! - Edit a comment
app.put('/post/:postId/comments/:commentId', checkAuthorization, async (req, res) => {
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
        res.status(500).send({error:'Internal Server Error'});
    }
})

//--------------------DELETE ROUTES------------------------

// -> OK! - Delete a Post
app.delete('/post/:postId', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        if (postDoc.data().author !== req.userName) { 
            res.status(403).send({ error: 'Unauthorized to delete this post' })
            return
        }

        const commentsRef = postRef.collection('comments');
        const commentsSnapshot = await commentsRef.get();

        const batch = db.batch()

        commentsSnapshot.forEach(commentDoc => {
            batch.delete(commentDoc.ref)
        });

        batch.delete(postRef)

        await batch.commit()

        res.status(204).send({message:'Post deleted successfully'})
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> OK! - Delete a Comment
app.delete('/post/:postId/comments/:commentId', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId;
        const commentId = req.params.commentId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get();

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
})


// PORNIRE SERVER
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
})

