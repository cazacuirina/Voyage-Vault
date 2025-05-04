const { db , bucket, admin} = require("../database/database");
const uuid = require('uuid-v4');

exports.getAllPosts = async (req, res) => {
    try{
        const postSnapshot=await db.collection('posts').get()

        if(postSnapshot.empty){
            res.status(404).send({error:"No post found"})
        }else{
            let posts=[]
            postSnapshot.forEach((doc)=>{
                post=doc.data()  
                post.id=doc.id  
                posts.push(post)
            })
            res.status(200).send(posts)
        }
    }catch(error){
        res.status(500).send({error:error.message})
    }
}

exports.getPostByTitle = async (req, res) => {
    try {
    const postTitle = req.params.postTitle
    console.log(postTitle)

    const postRef = db.collection('posts').where('title', '==', postTitle).limit(1)
    const postDoc = await postRef.get()

    if (postDoc.empty) {  
        res.status(404).send({ error: 'Post not found' })
    } else {
        postDoc.forEach(doc => {
        const post = doc.data() 
        post.id=doc.id  
        console.log("Post: ", post)

        res.status(200).send(post)
        })
    }
    } catch (error) {
    res.status(500).send({ error: error.message })
    }
}

exports.getPostDetails = async (req, res) => {
    try {
        const postId = req.params.postId
    
        const postRef = db.collection('posts').doc(postId)
        const postDoc = await postRef.get()
    
        if (!postDoc.exists) {
          res.status(404).send({ error: 'Post not found' })
        } else {
          const { title, description, likes } = postDoc.data()  
    
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
}

exports.getPostStats = async (req, res) => {
  const userName = req.userName;
  const currentYear = new Date().getFullYear();

  try {
      const postsRef = db.collection('posts');
      
      const querySnapshot = await postsRef
          .where('author', '==', userName)  
          .get();

      if (querySnapshot.empty) {
          return res.status(404).send({ error: 'No posts found for this user' });
      }

      let postsStats = [];

      querySnapshot.forEach(postDoc => {
        const postData = postDoc.data();
        const postDate = new Date(postData.date._seconds * 1000);

         if (postDate.getFullYear() === currentYear) {
              const likes = postData.likes || 0;
              const starCounts = postData.starCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

              const totalRatings = Object.values(starCounts).reduce((acc, count) => acc + count, 0);

              postsStats.push({
                  date: postDate,
                  likes,
                  rating:  postData.rating,
                  totalRatings,
              });
          }
      });

      res.status(200).json(postsStats);

  } catch (error) {
      console.error('Error fetching post stats:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
}

exports.getPostImages = async (req, res) => {
    try {
        const postId = req.params.postId;
        console.log("Post ID:", postId);
    
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
    
          const [fileBuffer] = await file.download();
    
          const base64Image = fileBuffer.toString('base64');
    
          imageBase64Array.push({base64: `data:image/jpeg;base64,${base64Image}`})
         
        }
    
        res.status(200).json({ images: imageBase64Array });
        
      } catch (error) {
        console.error('Error fetching post images:', error);
        res.status(500).json({ error: 'Error fetching post images.' });
      }
}

exports.postBlogPost = async (req, res) => {
    try {
        const { title, city, country, description, author, date, images, isPremium, price } = req.body;
        if (!title || !city || !country || !description || !author || !date ) { 
          return res.status(400).json({ error: 'Title, city, country, description, author, date are required' }); 
        }
    
        const post = { title, city, country, description, author, date, likes: 0, rating: 0, images: [] };
        if (isPremium) {
          post.isPremium = isPremium;
          post.price = Number(price) || 0;  
        }
        
        const newPostRef = await db.collection('posts').add(post);
        const postId = newPostRef.id;
    
        const savedImageNames = [];
        for (let i = 0; i < images.length; i++) {
          console.log("NR img",i+1)
          const base64Image = images[i]; 
      
          const buffer = Buffer.from(base64Image, 'base64'); 
    
          const fileName = `image${i+1}.jpg`;
          const filePath = `PostsPics/${postId}/${fileName}`;
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
    
          savedImageNames.push(fileName);  
        }
    
        await newPostRef.update({ images: savedImageNames });
       
          res.status(201).send({ id: postId, title, city, country, description, author, date, images: savedImageNames });
     
    
      } catch (error) {
        console.error('Error uploading images or creating post:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
}

exports.putPost = async (req, res) => {
  try {
    const { title, city, country, description, images, isPremium, price } = req.body;
    const postId = req.params.postId;

    if (!title || !city || !country || !description) {
      return res.status(400).json({ error: 'Title, city, country, and description are required.' });
    }

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (postDoc.data().author !== req.userName) {
      return res.status(403).json({ error: 'Unauthorized to edit this post.' });
    }

    if (images && images.length > 0) {
      const oldImages = postDoc.data().images || [];
      const folderPath = `PostsPics/${postId}`;

      for (const imageName of oldImages) {
        const file = bucket.file(`${folderPath}/${imageName}`);
        await file.delete().catch(() => {}); 
      }

      const newImageNames = [];

      for (let i = 0; i < images.length; i++) {
        const buffer = Buffer.from(images[i], 'base64');
        const fileName = `image${i + 1}.jpg`;
        const filePath = `${folderPath}/${fileName}`;

        const metadata = {
          metadata: {
            firebaseStorageDownloadTokens: uuid(),
          },
          contentType: 'image/jpg',
          cacheControl: 'public, max-age=31536000',
        };

        const file = bucket.file(filePath);
        await file.save(buffer, { metadata });

        newImageNames.push(fileName);
      }

      await postRef.update({ images: newImageNames });
    }

    const updateData = {
      title,
      city,
      country,
      description,
      date: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof isPremium !== 'undefined') updateData.isPremium = isPremium;
    if (typeof price !== 'undefined') updateData.price = price;

    await postRef.update(updateData);

    res.status(200).json({ message: 'Post updated successfully.' });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.likePost = async (req, res) => {
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
            const userSnapshot = await usersRef.where('email', '==', email).limit(1).get()  
    
            if (!userSnapshot.empty) {
                let userDoc = {}
                userSnapshot.forEach(doc => {
                    userDoc = doc.data()
                    userId = doc.id
                })
                console.log(userDoc, userId)
            
                const userFavorites = userDoc.favoritePosts || []  
                const existingFavorite = userFavorites.find(favorite => favorite.postId === postId)
                
                postDoc = postSnapshot.data()
                console.log(postDoc)
            
                if (!existingFavorite) { 
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
    
                res.status(200).send(updatedPost)
            }
            
        } catch (error) {
            console.error(error)
            res.status(500).send({error:'Internal Server Error'})
        }
}

exports.ratePost = async (req, res) => {
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
            
            const roundedRating = Math.round(rating)
            starCounts[roundedRating] = (starCounts[roundedRating] || 0) + 1

            const totalRatings = Object.keys(starCounts).reduce((acc, key) => acc + (parseInt(key) * starCounts[key]), 0);
            const totalCount = Object.values(starCounts).reduce((acc, count) => acc + count, 0)
            avgRating = totalCount > 0 ? parseFloat((totalRatings / totalCount).toFixed(2)) : 0;

            const updatedPost = await postRef.update({
                rating: avgRating, 
                starCounts: starCounts
            })   

            console.log(starCounts)
            res.status(200).json({ message: 'Rating updated successfully', avgRating, starCounts });
        
          } catch (error) {
            console.error('Error updating rating:', error);
            res.status(500).json({ message: 'Internal server error' });
          }
    }
}

exports.gainPostAccess = async (req, res) => {
    try {
        const { postTitle } = req.params;
        const userName = req.userName;
    
        console.log(postTitle)
       
        if (!postTitle ) {
          return res.status(400).json({ error: "Missing required fields" });
        }
    
        const postsRef = db.collection("posts");
        const postSnapshot = await postsRef.where("title", "==", postTitle).limit(1).get();
    
        if (postSnapshot.empty) {
          return res.status(404).json({ error: "Post not found" });
        }
    
        const postDoc = postSnapshot.docs[0];
    
        await postDoc.ref.update({
          boughtBy: admin.firestore.FieldValue.arrayUnion(userName)
        });
    
        res.status(200).json({ success: true, message: "Access to post saved successfully." });
      } catch (error) {
        console.error("Error saving post access:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
}

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId

    const postRef = db.collection('posts').doc(postId)
    const postDoc = await postRef.get()  
    if (!postDoc.exists) {
        res.status(404).send({error:'Post not found'})
        return
    }

    if (postDoc.data().author !== req.userName) {   
        res.status(403).send({ error: 'Unauthorized to delete this post' })
        return
    }

    const likedByUserIds = postDoc.data().likedBy || []  
    console.log(likedByUserIds)
    
    const images = postDoc.data().images || [];
    const folderPath = `PostsPics/${postId}`;

    for (const imageName of images) {
      const file = bucket.file(`${folderPath}/${imageName}`);
      await file.delete().catch((err) => {
        console.warn(`Failed to delete image ${imageName}:`, err.message);
      });
    }

    const commentsRef = postRef.collection('comments')
    const commentsSnapshot = await commentsRef.get()  

    const batch = db.batch()

    commentsSnapshot.forEach(commentDoc => {
        batch.delete(commentDoc.ref)    
    })

    batch.delete(postRef)   

    await batch.commit()

    likedByUserIds.forEach(async userId => {
        const usersRef = db.collection('users')
        const userSnapshot = await usersRef.doc(userId).get() 

        if (!userSnapshot.empty) {
            console.log('User Snapshot:', userSnapshot.data())

            const updatedFavoritePosts = userSnapshot.data().favoritePosts.filter(post => post.postId !== postId)

            await usersRef.doc(userId).update({
                favoritePosts: updatedFavoritePosts
            })  
        }
    })

    res.status(204).send({message:'Post deleted successfully'})
} catch (error) {
    console.error(error)
    res.status(500).send({error:'Internal Server Error'})
}
}