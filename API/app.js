const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const admin = require('firebase-admin')
const uuid = require('uuid-v4');
const { getStorage } = require('firebase-admin/storage')

const serviceAccount = require('./dbcredentials/tic2024-41e34-firebase-adminsdk-m6dc6-6a07f5dec1.json')

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "tic2024-41e34.appspot.com" 
});
const db = getFirestore()
const bucket = admin.storage().bucket()

const express = require('express')
const app = express()
const logger = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
// const sharp = require('sharp')
const port = 3001

app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const nodemailer = require('nodemailer');

//NOU-Google
require("dotenv").config()
const passport = require("passport")
const session = require("express-session")
const GoogleStrategy = require("passport-google-oauth20").Strategy
app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
    })
  )
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3001/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  )
  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))

app.use(logger('dev'))
// app.use(cors())
app.use(cors({
    origin: 'http://localhost:3000',  // Domeniul frontend-ului tău
    credentials: true                 // Permite trimiterea cookie-urilor/credențialelor
  }));
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const bcrypt = require('bcrypt')
const saltRounds = 10

let jwt = require('jsonwebtoken')
const fs = require('fs')
const privateKey = fs.readFileSync('private.key')
const publicKey = fs.readFileSync('public.key')

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

//NOU-Google
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  )
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
     res.redirect("http://localhost:3000");
    }
  )
  app.get('/getUserGoogle', (req, res) => {
    if (req.isAuthenticated()) {  
        const { displayName, emails } = req.user;
        const token = jwt.sign({   // create login token
                data: {userName: displayName, userEmail:emails[0].value},
                exp: Math.floor(Date.now() / 1000) + (60 * 60)  //valid for 1h
                }, privateKey, {
                algorithm: 'RS256' //asymetric
                })
                console.log(token)
        res.json({
            success: true,
            userName: displayName,
            userEmail: emails[0].value,
            token: token
        });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
})

  app.get("/", (req, res) => {
    res.send(`Welcome ${req.user.displayName}`);
  })
  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/")
    })
  })

// MIDDLEWARE

// -> Check User authorization for post/put/delete
function checkAuthorization(req, res, next){
    console.log('Passing through middleware')
  
    let token = req.headers.authorization
    console.log(token)

    if (token && token.startsWith('Bearer ')) {   // received as "Bearer + token"
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
        user=decoded.data
        req.userName=user.userName
        req.userEmail=user.userEmail
        console.log("Authorized user: "+req.userName+" "+req.userEmail)
        next()
      }
    })
  }

//--------------------GET ROUTES------------------------

// -> Get all posts
app.get("/posts", async(req,res)=>{
    try{
        const postSnapshot=await db.collection('posts').get()

        if(postSnapshot.empty){
            res.status(404).send({error:"No post found"})
        }else{
            let posts=[]
            postSnapshot.forEach((doc)=>{
                post=doc.data()  // retrieve post data
                post.id=doc.id  // add id to post object
               // console.log("Post: ", post)
                posts.push(post)
            })
            res.status(200).send(posts)
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
  })

// -> Get user travel list
app.get('/user/favorites', checkAuthorization, async (req, res) => {
    try {
      const email = req.userEmail
  
      const usersRef = db.collection('users')
      const snapshot = await usersRef.where('email', '==', email).limit(1).get()  // find user by email
      if (snapshot.empty) {
            res.status(404).send({error:'No user found with this email'})
            return
      }  
            
      snapshot.forEach(userDoc => {
            const userFavorites = userDoc.data().favoritePosts || []  // get user favorite destinations
            if (userFavorites.length === 0) {
                res.status(404).send({ error: 'No favorite posts found for this user' })
                return
            }
          
            res.status(200).send({ travelList: userFavorites })
       })
    
  
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: 'Internal Server Error' })
    }
  })

  ///FA UN SINGUR REQUEST PE USER SI AUTHOR PROFILE
  app.get('/author/:authorName', async (req, res) => {
    try {
      const authorName = req.params.authorName;
      // console.log(authorName)
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('name', '==', authorName).limit(1).get();
  
      if (snapshot.empty) {
        return res.status(404).json({ error: 'No user found with this username' });
      }
  
      let userId = '';
      let profilePicture = '';
      // let followersList = [];
  
      snapshot.forEach((doc) => {
        userId = doc.id;
        const userData = doc.data();
        profilePicture = userData.profilePicture || null;
        // console.log(userId, " - ", profilePicture)

        // followersList = userData.followersList || [];
      });
  
      if (!userId) {
        return res.status(404).json({ error: 'User data not found.' });
      }
  
      // Căutăm poza de profil în storage (dacă există)
      let base64Image = '';
      if (profilePicture) {
        const filePath = `profilePics/${userId}/${profilePicture}`;
        const file = bucket.file(filePath);
        const [fileExists] = await file.exists();
  
        if (fileExists) {
          // console.log("DA")
          const [fileBuffer] = await file.download();
          base64Image = fileBuffer.toString('base64');
        }
      }
  
      res.status(200).json({
        profilePicture: base64Image,
        // followers: followersList.length,
        // isFollowing: followersList.includes(req.userEmail),
      });

      // res.status(200).json({ message: 'Profile picture retrieved successfully.', image: base64Image });
  
    } catch (error) {
      console.error('Error fetching author details:', error);
      res.status(500).json({ message: 'Error fetching author details.' });
    }
  });
  

// -> Get destination details
app.get("/post/:postId/details", async (req, res) => {
    try {
      const postId = req.params.postId
  
      const postRef = db.collection('posts').doc(postId)
      const postDoc = await postRef.get()
  
      if (!postDoc.exists) {
        res.status(404).send({ error: 'Post not found' })
      } else {
        const { title, description, likes } = postDoc.data()  // select only 3 attributes from post
  
        const destinationDetails = {
          title,
          description,
          likes,
        }
  
        res.status(200).send(destinationDetails)
      }
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  })


// -> Get post by title
app.get("/post/:postTitle", async (req, res) => {
  try {
      console.log("AICI POST")
    const postTitle = req.params.postTitle
    console.log(postTitle)

    const postRef = db.collection('posts').where('title', '==', postTitle).limit(1)
    const postDoc = await postRef.get()

    if (postDoc.empty) {  //check if post exists
      res.status(404).send({ error: 'Post not found' })
    } else {
      postDoc.forEach(doc => {
      const post = doc.data() // get post data
      post.id=doc.id  //add post id
      console.log("Post: ", post)

      res.status(200).send(post)
      })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// -> Get following / not following
app.get('/user/:authorName/following', checkAuthorization, async (req, res) => {
  try {
    const email = req.userEmail;
    const authorName = req.params.authorName;

    const usersRef = db.collection('users');

    
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userId = '';
    let userFollowing = [];
    let userSubscribed = [];
    userSnapshot.forEach(doc => {
      userId = doc.id;
      userFollowing = doc.data().following || [];
      userSubscribed = doc.data().subscribed || [];
    });

  
    const authorSnapshot = await usersRef.where('name', '==', authorName).limit(1).get();

    if (authorSnapshot.empty) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // let authorId = '';
    // authorSnapshot.forEach(doc => {
    //   authorId = doc.id;
    // });

    
    // const isFollowing = userFollowing.includes(authorId);
    // const isSubscribed = userSubscribed.includes(authorId);

    const isFollowing = userFollowing.includes(authorName);
    const isSubscribed = userSubscribed.includes(authorName);

    // return res.status(200).json({ isFollowing });
    return res.status(200).json({ isFollowing, isSubscribed });

  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// -> Get creator's followers
app.get('/author/:authorName/followers', async (req, res) => {
  try {
      const authorName = req.params.authorName;
      // console.log(authorName)
      const usersRef = db.collection('users');

      // Căutăm autorul după nume
      const authorSnapshot = await usersRef.where('name', '==', authorName).limit(1).get();
      if (authorSnapshot.empty) {
          return res.status(404).json({ error: 'Author not found' });
      }

      let authorFollowers = 0;
      authorSnapshot.forEach(doc => {
          authorFollowers = doc.data().followers || 0;
          subscriptionPrice = doc.data().subscriptionPrice || 0; 
          console.log(authorFollowers)
      });

      res.status(200).json({ followers: authorFollowers,
        subscriptionPrice: subscriptionPrice
       });

  } catch (error) {
      console.error('Error fetching followers count:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// -> Get post pictures
app.get('/post/:postId/images', async (req, res) => {
  try {
    const postId = req.params.postId;
    console.log("Post ID:", postId);

    // Referință către postare
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postDoc.data();
    if (!postData.images || postData.images.length === 0) {
      return res.status(200).json({ message: 'No images for this post.', images: [] });
    }

    let imageBase64Array = [];

    for (let imageName of postData.images) {
      const filePath = `PostsPics/${postId}/${imageName}`;
      const file = bucket.file(filePath);

      const [fileExists] = await file.exists();
      if (!fileExists) {
        console.warn(`Imaginea ${imageName} nu există în storage.`);
        continue;
      }

      // Descărcăm fișierul ca buffer
      const [fileBuffer] = await file.download();

      // Convertim buffer-ul în string base64
      const base64Image = fileBuffer.toString('base64');

      imageBase64Array.push({base64: `data:image/jpeg;base64,${base64Image}`})
     
    }

    res.status(200).json({ images: imageBase64Array });
    
  } catch (error) {
    console.error('Error fetching post images:', error);
    res.status(500).json({ error: 'Error fetching post images.' });
  }
});



// -> Get post comments
app.get("/post/:postId/comments", async(req,res)=>{
    try{
        let postId=req.params.postId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()

        if (!postDoc.exists) {     // check if the post exists
            res.status(404).send({error:'Post not found'})
        }else{
            const commentsSnapshot=await postRef.collection('comments').get()
        
            if(commentsSnapshot.empty){
                res.status(404).send({error:"No comment found"})
                //!!!!!!!
                //res.status(200).send({ message: "No comments found for this post." });
            }else{
                let comments=[]
                commentsSnapshot.forEach((doc)=>{ 
                    comment=doc.data()    // get comment data
                    comment.id=doc.id     // add comment id
                    //console.log("Comment: ", comment)
                    comments.push(comment)
                })
                res.status(200).send(comments)
            }
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
  })

  app.get('/post/:postId/comments/:commentId/replies', checkAuthorization, async (req, res) => {
    try {
      const { postId, commentId } = req.params;
  
      // Referința la comentariul specific
      const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
  
      // Obținem comentariul pentru a ne asigura că există
      const commentDoc = await commentRef.get();
      if (!commentDoc.exists) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      // Obținem toate replies pentru acest comentariu
      const repliesCollection = commentRef.collection('replies');
      const repliesSnapshot = await repliesCollection.get();
  
      if (repliesSnapshot.empty) {
        return res.status(200).json([]);  // Returnează un array gol dacă nu sunt replies
      }
  
      // Extragem datele pentru fiecare reply și le returnăm
      const replies = repliesSnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });
  
      res.status(200).json(replies);
    } catch (error) {
      console.error('Error fetching replies:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

//--------------------POST ROUTES------------------------
app.post('/register', async(req, res) => {
    try {
        if(!req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
            return res.status(400).json({ error: 'Name, email and password are required' })
        }else{
          const user = {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
          };
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
                        token: token, //aici trebuie sa returnez username si useremail nou create
                        userName: user.name,  // Am adăugat username
                        userEmail: user.email // Am adăugat email-ul
                    })
                });
            }
        }
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> Login an existing user
app.post ('/login', async(req, res) => {
    // check if the user has both fields
    if(!req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
        return res.status(400).json({ error: 'Email and password are required' })
    }else{
      const user = {
        email: req.body.email,
        password: req.body.password,
      };
        console.log('Trying to login with: ', user)

        const usersRef = db.collection('users')
        const snapshot = await usersRef.where('email', '==', user.email).limit(1).get()  // find existing user by email
        if (snapshot.empty) {
            res.status(404).send({error:'No user found with this email'})
            return
        }  else{
            let document ={}
            snapshot.forEach(doc => {
                document = doc.data()  // get user data
            })
            
            console.log(document)
                if (document) {
                    let dbHash = document.password
                    bcrypt.compare(user.password, dbHash, function(err, result) {
                        if (result) {
                            const token = jwt.sign({   // create login token
                            data: {userName: document.name, userEmail:document.email},
                            exp: Math.floor(Date.now() / 1000) + (60 * 60)  //valid for 1h
                            }, privateKey, {
                            algorithm: 'RS256' //asymetric
                            })
                            console.log("TOKEN: "+token+" NAME "+document.name)
    
                            res.status(200).json({  
                            token: token,
                            userName: document.name,
                            userEmail: document.email
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

// -> Add a profile pic
app.post('/profile/picture', checkAuthorization, async (req, res) => {
    try {
      const { email, photo } = req.body;
      if (!email || !photo) {
        return res.status(400).json({ message: 'Email and photo are required.' });
      }
  
      const binaryData = Buffer.from(photo, 'base64');
      const usersRef = db.collection('users');
      const userSnapshot = await usersRef.where('email', '==', email).limit(1).get(); // Căutăm utilizatorul după email
  
      if (userSnapshot.empty) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      let userDoc = {};
      let userId = ''; 
      userSnapshot.forEach((doc) => {
        userDoc = doc.data();
        userId = doc.id;
      });

      const timestamp = Date.now()
      const fileName = `${timestamp}.jpg`;
      const filePath = `profilePics/${userId}/${fileName}`;
      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: uuid()
        },
        contentType: 'image/jpg',
        cacheControl: 'public, max-age=31536000',
      };
      const file = bucket.file(filePath)
      await file.save(binaryData, {
        metadata: metadata,
        public: false, 
      });
        await usersRef.doc(userId).update({
        profilePicture: fileName 
      });
  
      res.status(200).json({ message: 'Photo uploaded successfully.' });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ message: 'Error processing upload.' });
    }
  });
  

// -> Add a new Post
app.post('/post', checkAuthorization, async (req, res) => {
  try {
    const { title, city, country, description, author, date, images, isPremium, price } = req.body;
    if (!title || !city || !country || !description || !author || !date ) { //|| !images || images.length === 0
      return res.status(400).json({ error: 'Title, city, country, description, author, date are required' }); //, and images
    }

    const post = { title, city, country, description, author, date, likes: 0, rating: 0, images: [] };
    if (isPremium) {
      post.isPremium = isPremium;
      post.price = Number(price) || 0;  // Default price dacă nu este specificat
    }
    

    const newPostRef = await db.collection('posts').add(post);
    const postId = newPostRef.id;

    // const uploadedImages = [];
    const savedImageNames = [];
    for (let i = 0; i < images.length; i++) {
      console.log("NR ",i)
      const base64Image = images[i]; //images[0];
      // console.log(base64Image)
  
      const buffer = Buffer.from(base64Image, 'base64'); // Convert ArrayBuffer -> Buffer

      // const filePath1 = `C:\\Users\\irina\\OneDrive\\Documente\\test\\img1.jpg`;
      // fs.writeFileSync(filePath1, buffer);

    
      const fileName = `image${i+1}.jpg`;
      const filePath = `PostsPics/${postId}/${fileName}`;
      // const filePath = `PostsPics/aaaaaaaa/${fileName}`;
      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: uuid(),
        },
        contentType: 'image/jpg', 
        cacheControl: 'public, max-age=31536000', 
      };
      
      const file = bucket.file(filePath);
      await file.save(buffer, {
        metadata: metadata,
        public: false,  
      });

      const downloadToken = metadata.metadata.firebaseStorageDownloadTokens;
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
    
      savedImageNames.push(fileName); 
      // uploadedImages.push(publicUrl);
      // post.images.push(fileName);  
    }

    // await newPostRef.update({ images: uploadedImages });
    await newPostRef.update({ images: savedImageNames });
    // res.status(201).send({ id: postId, ...post });

      // post.images = uploadedImages; 
      // res.status(201).send({ images: uploadedImages });
      res.status(201).send({ id: postId, title, city, country, description, author, date, images: savedImageNames });
      // res.status(201).send({ id: postId, title, city, country, description, author, date, images: uploadedImages });
      // res.status(201).send({publicUrl})  //ce pun aici

  } catch (error) {
    console.error('Error uploading images or creating post:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


// -> Add a new Comment
app.post('/post/:postId/comments', checkAuthorization, async(req, res) => {
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

            if (postDoc.empty) {  // check if the post exists
                res.status(404).send({error:'Post not found'})
            }else{
                const commentsCollection = postRef.collection('comments')
                const newComment = await commentsCollection.add(comment) // add comment to subcollection
                comment.id=newComment.id
                console.log('Added document with ID:', newComment.id)

                res.status(201).send(comment)
            }
    }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> Add a Reply to a Comment
app.post('/post/:postId/comments/:commentId/replies', checkAuthorization, async (req, res) => {
  try {
    // console.log("HAHA")
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

      if (!commentDoc.exists) {  // Check if the comment exists
          return res.status(404).json({ error: 'Comment not found' });
      }

      const repliesCollection = commentRef.collection('replies');
      const newReply = await repliesCollection.add(replyData);  // Add reply to subcollection
      replyData.id = newReply.id;

      console.log('Added reply with ID:', newReply.id);

      await commentRef.update({
        // hasReplies: true,
        repliesCount: admin.firestore.FieldValue.increment(1) // Incrementează cu 1
      });

      res.status(201).json(replyData);
  } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// -> Pay for subscription
app.post("/stripe/create-checkout-session", checkAuthorization, async (req, res) => {
  try {
    const { authorName, price } = req.body;
    const userEmail = req.userEmail;


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Subscription to ${authorName}`,
            },
            unit_amount: price * 100,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      // success_url: `http://localhost:3000/success?authorName=${authorName}&userEmail=${userEmail}`,
      //success_url: `http://localhost:3000/subscription-success?authorName=${authorName}`,
      success_url: `http://localhost:3000/subscription-success?authorName=${encodeURIComponent(authorName)}&price=${encodeURIComponent(price)}`,

      cancel_url: "http://localhost:3000/'posts",
      // cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -> Pay for a single post
app.post("/stripe/create-post-checkout-session", checkAuthorization, async (req, res) => {
  try {
    const { postId, postTitle, price, authorName } = req.body;  // Capture the postId, price, and authorName from the request body
    const userEmail = req.userEmail;  // Assuming userEmail is available from the auth middleware

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",  // Set mode to "payment" for one-time payment (vs "subscription")
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Payment for post: ${postTitle}`,  // You can use the post title or ID
            },
            unit_amount: price * 100,  // Convert price to cents
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/post-pay-success?postTitle=${encodeURIComponent(postTitle)}&authorName=${encodeURIComponent(authorName)}&price=${encodeURIComponent(price)}`,
      cancel_url: "http://localhost:3000/posts",  // URL to redirect if payment is canceled
    });

    res.json({ url: session.url });  // Send the Stripe session URL to the client for redirect
  } catch (error) {
    console.error("Error creating Stripe session for post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// -> Save subscription payment
// app.post("/subscriber/payment", checkAuthorization, async (req, res) => {
//   try {
//     const { authorName, amount, isSubscription } = req.body;
//     const date=admin.firestore.FieldValue.serverTimestamp() 
//     const userName=req.userName
//     const isSub = Boolean(isSubscription);

//     //const userEmail=req.userEmail
//     if (!authorName || !amount || typeof isSubscription === 'undefined') {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const usersRef = db.collection('users')
//     const userSnapshot = await usersRef.where('name', '==', userName).limit(1).get()  // find user by email

//     if (!userSnapshot.empty) {
//             let userDoc = {}
//             userSnapshot.forEach(doc => {
//                 userDoc = doc.data()
//                 userId = doc.id
//             })
//             console.log(userDoc, userId)
//           }

//           const authorSnapshot = await usersRef.where('name', '==', userName).limit(1).get()  // find user by email

//     if (!authorSnapshot.empty) {
//             let authorDoc = {}
//             authorSnapshot.forEach(doc => {
//               authorDoc = doc.data()
//                 authorId = doc.id
//             })
//             console.log(authorDoc, authorId)
//           }

//     // Adaugă în colectia earnings a autorului
//     // await db.collection("authors").doc(authorName).collection("earnings").add({
//     //   subscriber: userName,
//     //   amount: amount,
//     //   isSubscription: isSub,
//     //   date: date,
//     // });
//     await usersRef.doc(userId)
//       .collection("payments").doc().set({
//         author: authorName,
//         amount: amount,
//         isSubscription: isSub,
//         date: date,
//       });

//       await usersRef.doc(authorId)
//       .collection("payments").doc().set({
//         subscriber: userName,
//         amount: amount,
//         isSubscription: isSub,
//         date: date,
//       });

//     // Adaugă în colectia payments a utilizatorului
//     // await db.collection("users").doc(userName).collection("payments").add({
//     //   author: authorName,
//     //   amount: amount,
//     //   isSubscription: isSub,
//     //   date: date,
//     // });

//     res.status(200).json({ message: "Payment saved successfully!" });
//   } catch (error) {
//     console.error("Error saving payment:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
app.post("/subscriber/payment", checkAuthorization, async (req, res) => {
  try {
    const { authorName, amount, isSubscription } = req.body;
    const priceAmount = Number(amount)
    const date = admin.firestore.FieldValue.serverTimestamp();
    const userName = req.userName;
    const userEmail = req.userEmail;
    const isSub = Boolean(isSubscription);

    // Verificare pentru câmpurile necesare
    if (!authorName || !amount || typeof isSubscription === 'undefined') {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const usersRef = db.collection("users");

    // Găsește userId-ul utilizatorului care plătește
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userSnapshot.docs[0].id;

    // Găsește authorId-ul autorului către care se face plata
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
    if (authorSnapshot.empty) {
      return res.status(404).json({ error: "Author not found" });
    }
    const authorId = authorSnapshot.docs[0].id;
    const authorEmail = authorSnapshot.docs[0].data().email;

    // Salvăm simultan plățile în colecțiile fiecăruia
    await Promise.all([
      usersRef.doc(userId).collection("payments").add({
        author: authorName,
        amount: priceAmount,
        isSubscription: isSub,
        date: date,
      }),
      usersRef.doc(authorId).collection("earnings").add({
        buyer: userName,
        amount: priceAmount,
        isSubscription: isSub,
        date: date,
      })
    ]);

    // Trimitere emailuri
    console.log("MAIL")
    await sendSubscriptionEmail(userEmail, userName, authorName, amount, false); // Către utilizator
    await sendSubscriptionEmail(authorEmail, authorName, userName, amount, true); // Către creator


    res.status(200).json({ message: "Payment saved successfully!" });
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/post/payment", checkAuthorization, async (req, res) => {
  try {
    const { postTitle, price, authorName } = req.body;
    const priceAmount = Number(price);
    const date = admin.firestore.FieldValue.serverTimestamp();
    const userName = req.userName;
    const userEmail = req.userEmail;
    const isSubscription = false; // Since this is a one-time post payment

    // Check for required fields
    if (!postTitle || !price || !authorName ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const usersRef = db.collection("users");

    // Find the paying user's ID
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userSnapshot.docs[0].id;

    // Find the author's ID
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
    if (authorSnapshot.empty) {
      return res.status(404).json({ error: "Author not found" });
    }
    const authorId = authorSnapshot.docs[0].id;
    const authorEmail = authorSnapshot.docs[0].data().email;

    // Save payments in both the user's and author's collections
    await Promise.all([
      usersRef.doc(userId).collection("payments").add({
        postTitle: postTitle,
        author: authorName,
        amount: priceAmount,
        isSubscription: isSubscription,
        date: date,
      }),
      usersRef.doc(authorId).collection("earnings").add({
        postTitle: postTitle,
        buyer: userName,
        amount: priceAmount,
        isSubscription: isSubscription,
        date: date,
      }),
    ]);

    // Send emails to both the buyer and the author
    console.log("Sending post payment emails...");
    // await sendPostPaymentEmail(userEmail, userName, authorName, price, postTitle, false); // To the buyer
    // await sendPostPaymentEmail(authorEmail, authorName, userName, price, postTitle, true); // To the author

    res.status(200).json({ message: "Post payment saved successfully!" });
  } catch (error) {
    console.error("Error saving post payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//--------------------PUT ROUTES------------------------

// -> Edit a Post
app.put('/post/:postId', checkAuthorization, async (req, res) => {
    try {
        // check if post has all 4 required fields
        if(!req.body.hasOwnProperty("title") || !req.body.hasOwnProperty("city") 
            || !req.body.hasOwnProperty("country") || !req.body.hasOwnProperty("description")){
            return res.status(400).json({ error: 'Title, city, coutry, description are required' })
        }else{
            const postId = req.params.postId
            const {title, city, country, description} = req.body
            const date=admin.firestore.FieldValue.serverTimestamp()  //update date with current timestamp

            const postRef = db.collection('posts').doc(postId)
            const postDoc = await postRef.get()

            if (!postDoc.exists) {
                res.status(404).send({error:'Post not found'})
                return
            }

            if (postDoc.data().author !== req.userName) {  //check if current user is the author of the post
                res.status(403).send({ error: 'Unauthorized to edit this post' })
                return
            }

            const updatedPost = await postRef.update({
                title:title, city:city, country:country, description:description, date:date
            })   //update post fields

            res.status(200).send(updatedPost)
    }
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> Rate a post 
app.put('/post/:postId/rate', checkAuthorization, async (req, res) => {
    console.log("ALOHA ",req.params.postId )
    if(!req.body.hasOwnProperty("rating")){
        return res.status(400).json({ error: 'Rating is required' })
    }else{
        try {

            const rating = req.body.rating

            const postId = req.params.postId
            const postRef = db.collection('posts').doc(postId)
            const postDoc = await postRef.get()

            if (!postDoc.exists) {
                res.status(404).send({error:'Post not found'})
                return
            }
            const postData = postDoc.data()
            let avgRating = postData.rating || 0
            const starCounts = postData.starCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            starCounts[rating] = (starCounts[rating] || 0) + 1

            const totalRatings = Object.keys(starCounts).reduce((acc, key) => acc + (parseInt(key) * starCounts[key]), 0);
            const totalCount = Object.values(starCounts).reduce((acc, count) => acc + count, 0)
            avgRating = totalCount > 0 ? (totalRatings / totalCount) : 0

            const updatedPost = await postRef.update({
                rating: avgRating, 
                starCounts: starCounts
            })   

            //res.status(200).send(updatedPost)
            res.status(200).json({ message: 'Rating updated successfully', avgRating });
        
          } catch (error) {
            console.error('Error updating rating:', error);
            res.status(500).json({ message: 'Internal server error' });
          }
    }
  
  });

// -> Like a post
app.put('/post/:postId/like', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId
        
        const postRef = db.collection('posts').doc(postId)
        const postSnapshot = await postRef.get()

        if (!postSnapshot.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        email=req.userEmail
        const usersRef = db.collection('users')
        const userSnapshot = await usersRef.where('email', '==', email).limit(1).get()  // find user by email

        if (!userSnapshot.empty) {
            let userDoc = {}
            userSnapshot.forEach(doc => {
                userDoc = doc.data()
                userId = doc.id
            })
            console.log(userDoc, userId)
        
            const userFavorites = userDoc.favoritePosts || []  // check if the post is already liked by user
            const existingFavorite = userFavorites.find(favorite => favorite.postId === postId)
            
            postDoc = postSnapshot.data()
            console.log(postDoc)
        
            if (!existingFavorite) { 
                // save post to favorite destionation list
                await usersRef.doc(userId).update({ 
                    favoritePosts: [
                        ...userFavorites,
                        {
                            postId: postId,
                            city: postDoc.city,
                            country: postDoc.country
                        }
                    ]
                })
            }

            const updatedPost = await postRef.update({
                likes: admin.firestore.FieldValue.increment(1),
                likedBy: admin.firestore.FieldValue.arrayUnion(userId)
            })
            // update post Like fields with user data

            res.status(200).send(updatedPost)
        }
        
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

const sendFollowNotification = async (authorEmail, followerName) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Sau alt serviciu SMTP
            // host: "smtp.gmail.com",
            // port: 465, // Port securizat pentru Gmail
            // secure: true, // Folosește SSL
            auth: {
                user: process.env.GMAIL_ADDRESS,  // Schimbă cu email-ul tău
                pass: process.env.GMAIL_PASSWORD // Folosește un App Password, NU parola normală
            },
            tls: {
              rejectUnauthorized: false
          }
        });

        const mailOptions = {
            from: process.env.GMAIL_ADDRESS,
            to: authorEmail,
            // subject: 'New Follower Notification!',
            //text: `Hey! ${followerName} just followed you! 🎉`
            subject: 'Congratulations! You are now a Premium Creator!',
            text: `Hello ${followerName},\n\nCongrats! You've reached over 1000 followers and have now become a Premium Creator. 🎉\n\nAs a Premium Creator, you can now monetize your content. You can set up subscription payments for your followers or set individual prices per post.💰\n\nDon't forget that the platform takes a small commission for every transaction.\n\nKeep up the great work!\n\nBest regards,\n🗺️Voyage Vault Team`
        };

        await transporter.sendMail(mailOptions);
        console.log('Follow notification email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendSubscriptionEmail = async (recipientEmail, recipientName, senderName, amount, isCreator) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Configurarea mesajului pentru creator și urmăritor
    let subject, text;

    if (isCreator) {
      subject = 'New Subscription Payment Received!';
      text = `Hello ${recipientName},\n\nYou have just received a subscription payment of $${amount} from ${senderName}. 💰\n\nPlease note that a small commission is retained by the platform for each transaction.\n\nKeep creating awesome content!\n\nBest regards,\n🗺️Voyage Vault Team`;
    } else {
      subject = 'Subscription Payment Successful!';
      text = `Hello ${recipientName},\n\nYour subscription payment of $${amount} to ${senderName} was successful! 🎉\n\nYou now have access to premium content. Enjoy the exclusive benefits!\n\nBest regards,\n🗺️Voyage Vault Team`;
    }

    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: recipientEmail,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Subscription email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendPostPaymentEmail = async (recipientEmail, recipientName, senderName, amount, postTitle, isAuthor) => {
  try {
    // console.log(recipientEmail, recipientName, senderName, amount, postTitle, isAuthor)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Configuring the email message for the author and the buyer
    let subject, text;

    if (isAuthor) {
      // Email to the author who received the payment
      subject = 'New Post Payment Received!';
      text = `Hello ${recipientName},\n\nYou have just received a payment of $${amount} for your post: "${postTitle}" from ${senderName}. 💰\n\nPlease note that a small commission is retained by the platform for each transaction.\n\nKeep up the great work!\n\nBest regards,\n🗺️Voyage Vault Team`;
    } else {
      // Email to the buyer who paid for the post
      subject = 'Post Payment Successful!';
      text = `Hello ${recipientName},\n\nYour payment of $${amount} for the post: "${postTitle}" by ${senderName} was successful! 🎉\n\nYou now have access to exclusive content from this post. Enjoy!\n\nBest regards,\n🗺️Voyage Vault Team`;
    }

    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: recipientEmail,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Post payment email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


// -> Follow a creator
app.put('/user/:authorName/follow', checkAuthorization, async (req, res) => {
  try {
      const authorName = req.params.authorName;
      const userEmail = req.userEmail;
      const userName = req.userName;

      // USER
      const usersRef = db.collection('users');
      const userSnapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

      if (userSnapshot.empty) {
          return res.status(404).json({ error: 'User not found' });
      }

      let userId = '';
      let userFollowing = [];
      userSnapshot.forEach(doc => {
          userId = doc.id;
          userFollowing = doc.data().following || [];
          //console.log(userId, " ",userFollowing)
          // followerName = doc.data().name;
      });

      //AUTHOR
      const authorSnapshot = await usersRef.where('name', '==', authorName).limit(1).get();
      if (authorSnapshot.empty) {
          return res.status(404).json({ error: 'Author not found' });
      }

      let authorId = '';
      let authorFollowers = 0;
      let authorEmail='';
      authorSnapshot.forEach(doc => {
          authorId = doc.id;
          authorFollowers = doc.data().followers || 0;
          authorEmail = doc.data().email
          //console.log(authorId, " ",authorFollowers)
      });

      if (!authorId) {
          return res.status(404).json({ error: 'Author ID not found' });
      }

      // Verificăm dacă user-ul deja urmărește autorul
     // const isAlreadyFollowing = userFollowing.includes(authorId);
     const isAlreadyFollowing = userFollowing.includes(authorName);

      // Dacă deja urmărește, îl eliminăm (Unfollow)
      if (isAlreadyFollowing) {
          await usersRef.doc(userId).update({
              //following: admin.firestore.FieldValue.arrayRemove(authorId)
              following: admin.firestore.FieldValue.arrayRemove(authorName)
          });

          await usersRef.doc(authorId).update({
              followers: admin.firestore.FieldValue.increment(-1)
          });

          return res.status(200).json({ message: 'Unfollowed successfully', isFollowing: false });
      }

      // Dacă NU urmărește deja, îl adăugăm (Follow)
      await usersRef.doc(userId).update({
          //following: admin.firestore.FieldValue.arrayUnion(authorId)
          following: admin.firestore.FieldValue.arrayUnion(authorName)
      });

      await usersRef.doc(authorId).update({
          followers: admin.firestore.FieldValue.increment(1)
      });

      // console.log(authorEmail)
      // await sendFollowNotification(authorEmail, userName);
      console.log("FLLW", authorFollowers)
      if (authorFollowers == 999) {
        sendFollowNotification(authorEmail, authorName); // Trimite notificare prin e-mail
      }

      res.status(200).json({ message: 'Followed successfully', isFollowing: true });

  } catch (error) {
      console.error('Error following/unfollowing user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// -> Subscribe to a creator
app.put("/users/:authorName/subscribe", checkAuthorization, async (req, res) => {
  try {
    const { authorName } = req.params.authorName;
    const userName = req.userName;

    const usersRef = db.collection('users');
    // Găsim autorul
    // Găsește userId-ul utilizatorului care plătește
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userSnapshot.docs[0].id;
    console.log(userId)
    if (!userId) return res.status(404).json({ error: "User ID not found" });

    // Găsește authorId-ul autorului către care se face plata
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
    if (authorSnapshot.empty) {
      return res.status(404).json({ error: "Author not found" });
    }
    const authorId = authorSnapshot.docs[0].id;
    console.log(authorId)
    if (!authorId) return res.status(404).json({ error: "Author ID not found" });

    await Promise.all([
      usersRef.doc(userId).update({
        //subscribed: admin.firestore.FieldValue.arrayUnion(authorId),
        subscribed: admin.firestore.FieldValue.arrayUnion(authorName),
      }),
      usersRef.doc(authorId).update({
        subscribers: admin.firestore.FieldValue.arrayUnion(userName),
      })
    ]);

    res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    console.error("Error saving subscriber:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -> Unsubscribe from a creator
app.put("/users/:authorName/unsubscribe", checkAuthorization, async (req, res) => {
  try {
    const { authorName } = req.params.authorName;
    const userName = req.userName;

    const usersRef = db.collection('users');

    // Găsim userId-ul utilizatorului care dorește să se dezaboneze
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userSnapshot.docs[0].id;
    console.log("User ID:", userId);
    if (!userId) return res.status(404).json({ error: "User ID not found" });

    // Găsim authorId-ul autorului de la care se dorește dezabonarea
    const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
    if (authorSnapshot.empty) {
      return res.status(404).json({ error: "Author not found" });
    }
    const authorId = authorSnapshot.docs[0].id;
    console.log("Author ID:", authorId);
    if (!authorId) return res.status(404).json({ error: "Author ID not found" });

    await Promise.all([
      usersRef.doc(userId).update({
        //subscribed: admin.firestore.FieldValue.arrayRemove(authorId),
        subscribed: admin.firestore.FieldValue.arrayRemove(authorName),
      }),
      usersRef.doc(authorId).update({
        subscribers: admin.firestore.FieldValue.arrayRemove(userName),
      })
    ]);

    res.status(200).json({ message: "Unsubscription successful" });
  } catch (error) {
    console.error("Error during unsubscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -> Gain post access (put - in colectia de posts)
app.put("/post/:postTitle/access", checkAuthorization, async (req, res) => {
  try {
    const { postTitle } = req.params;
    const userName = req.userName;

    console.log(postTitle)
    // Verificare câmpuri
    if (!postTitle ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const postsRef = db.collection("posts");
    const postSnapshot = await postsRef.where("title", "==", postTitle).limit(1).get();

    if (postSnapshot.empty) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postDoc = postSnapshot.docs[0];

    // Actualizare câmp "boughtBy" cu userName
    await postDoc.ref.update({
      boughtBy: admin.firestore.FieldValue.arrayUnion(userName)
    });

    res.status(200).json({ success: true, message: "Access to post saved successfully." });
  } catch (error) {
    console.error("Error saving post access:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// -> Edit a comment
app.put('/post/:postId/comments/:commentId', checkAuthorization, async (req, res) => {
    try {
        if(!req.body.hasOwnProperty("comment")){
            return res.status(400).json({ error: 'Comment is required' })
        }else{
            const postId = req.params.postId
            const commentId = req.params.commentId
            const comment=req.body.comment

            const postRef = db.collection('posts').doc(postId)  
            const postDoc = await postRef.get()  // find post

            if (!postDoc.exists) {  
                res.status(404).send({error:'Post not found'})
                return
            }

            const commentRef = postRef.collection("comments").doc(commentId)
            const commentDoc = await commentRef.get() // find post comment

            if (!commentDoc.exists) {
                res.status(404).send({error:'Comment not found'})
                return
            }

            if (commentDoc.data().userName !== req.userName) {   // check if user is the comment author
                res.status(403).send({ error: 'Unauthorized to edit this comment' })
                return
            }

            const updatedPost = await commentRef.update({
                comment: comment
            })   // update comment

            res.status(200).send(updatedPost)
     }
    } catch (error) {
        console.error(error);
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> Save subscription price for author
app.put('/user/subscription', checkAuthorization, async (req, res) => {
  try {
      const userEmail = req.userEmail;
      const subscriptionPrice = Number(req.body.subscriptionPrice);

      if (isNaN(subscriptionPrice) || subscriptionPrice < 0 || subscriptionPrice > 25) {
        return res.status(400).json({ error: 'Invalid subscription price' });
    }

      const usersRef = db.collection('users');
      const userSnapshot = await usersRef.where('email', '==', userEmail).limit(1).get();
  
      if (userSnapshot.empty) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      let userDoc = {};
      let userId = ''; 
      userSnapshot.forEach((doc) => {
        userDoc = doc.data();
        userId = doc.id;
      });

      // Actualizăm prețul abonamentului
      await usersRef.doc(userId).update({ subscriptionPrice });

      res.status(200).json({ message: 'Subscription price updated successfully' });

  } catch (error) {
      console.error('Error updating subscription price:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//--------------------DELETE ROUTES------------------------

// -> Delete a Post
app.delete('/post/:postId', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()   // find post

        if (!postDoc.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        if (postDoc.data().author !== req.userName) {   // check if user is the post author
            res.status(403).send({ error: 'Unauthorized to delete this post' })
            return
        }

        const likedByUserIds = postDoc.data().likedBy || []   // find users who liked the post
        console.log(likedByUserIds)

        const commentsRef = postRef.collection('comments')
        const commentsSnapshot = await commentsRef.get()  // find post comments

        const batch = db.batch()

        commentsSnapshot.forEach(commentDoc => {
            batch.delete(commentDoc.ref)    // first, delete comment subcollection
        })

        batch.delete(postRef)    // then, delete post

        await batch.commit()

        likedByUserIds.forEach(async userId => {
            const usersRef = db.collection('users')
            const userSnapshot = await usersRef.doc(userId).get()  // get users who liked the post

            if (!userSnapshot.empty) {
                console.log('User Snapshot:', userSnapshot.data())

                const updatedFavoritePosts = userSnapshot.data().favoritePosts.filter(post => post.postId !== postId)

                await usersRef.doc(userId).update({
                    favoritePosts: updatedFavoritePosts
                })   // delete post reference from favorites
            }
        })

        res.status(204).send({message:'Post deleted successfully'})
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})

// -> Delete a Comment
app.delete('/post/:postId/comments/:commentId', checkAuthorization, async (req, res) => {
    try {
        const postId = req.params.postId;
        const commentId = req.params.commentId

        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()    // find post

        if (!postDoc.exists) {
            res.status(404).send({error:'Post not found'})
            return
        }

        const commentRef = postRef.collection("comments").doc(commentId)
        const commentDoc = await commentRef.get()  // find post comment

        if (!commentDoc.exists) {
            res.status(404).send({error:'Comment not found'})
            return
        }

        if (commentDoc.data().userName !== req.userName) {  // check if user is the author of the comment
            res.status(403).send({ error: 'Unauthorized to delete this comment' })
            return
        }

        const deletedComment = await commentRef.delete()   // delete comment

        res.status(204).send({message:'Comment deleted successfully'})
    } catch (error) {
        console.error(error)
        res.status(500).send({error:'Internal Server Error'})
    }
})


// Start Server
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
})

