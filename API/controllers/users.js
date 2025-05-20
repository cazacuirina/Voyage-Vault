const { db, bucket } = require("../database/database");
const uuid = require('uuid-v4');

exports.getUserFavorites = async (req, res) => {
  try {
    const email = req.userEmail;
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();

    if (snapshot.empty) return res.status(404).send({ error: 'No user found' });

    const userDoc = snapshot.docs[0].data();
    const favorites = userDoc.favoritePosts || [];

    if (favorites.length === 0) return res.status(404).send({ error: 'No favorites found' });

    res.status(200).send({ travelList: favorites });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.getNewContent = async (req, res) => {
    try {
        const userEmail = req.userEmail;
        const usersRef = db.collection('users');
        
        const userSnapshot = await usersRef.where('email', '==', userEmail).limit(1).get();
        if (userSnapshot.empty) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
    
        const subscribed = userData.subscribed || [];
        const lastLogin = userData.lastLogin?.toDate?.() || new Date(0);
    
        if (subscribed.length === 0) {
          return res.status(200).json({ posts: [], lastVisibleDate: null });
        }
    
        const posts = [];
    
        const chunkArray = (arr, size) =>
          arr.length > size
            ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
            : [arr];
    
        const chunks = chunkArray(subscribed, 10);
        let lastVisible = null;
    
        for (const group of chunks) {
          let query = db
            .collection('posts')
            .where('author', 'in', group)
            .where('date', '>', lastLogin)
            .orderBy('date', 'desc')
            .limit(4)
            .select('title', 'author', 'country', 'city', 'likes', 'date');
    
          if (req.query.lastVisibleDate) {
            const startAfterDate = new Date(req.query.lastVisibleDate);
            query = query.startAfter(startAfterDate);
          }
    
          const snapshot = await query.get();
    
          snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
          });
    
          if (!lastVisible && snapshot.docs.length > 0) {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
          }
    
          if (posts.length > 0) break;
        }
    
        const lastVisibleDate = lastVisible?.get('date')?.toDate?.() || null;
    
        return res.status(200).json({ posts, lastVisibleDate });
    
      } catch (error) {
        console.error('Error fetching news:', error);
        return res.status(500).json({ error: 'Error fetching news.' });
      }
};

exports.getFinancials = async (req, res) => {
  try{
    const userName = req.userName
    const startOfYear = new Date(new Date().getFullYear(), 0, 1); 
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const userRef = usersRef.doc(userId);

    const [paymentsSnapshot, earningsSnapshot] = await Promise.all([
      userRef.collection("payments").where("date", ">=", startOfYear).select("amount", "date").get(),
      userRef.collection("earnings").where("date", ">=", startOfYear).select("amount", "date").get(),
    ]);

    const payments = paymentsSnapshot.docs.map(doc => doc.data());
    const earnings = earningsSnapshot.docs.map(doc => doc.data());

    res.status(200).json({
      payments,
      earnings,
    });
  } catch (error) {
    console.error("Error fetching financials:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

exports.getPayersPerPost = async (req, res) => {
  try {
    const userName = req.userName;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1); 
 
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const userRef = usersRef.doc(userId); 

    const earningsSnapshot = await userRef
      .collection("earnings")
      .where("date", ">=", startOfYear)
      .select("buyer", "isSubscription")
      .get();
    
    const buyersRaw = earningsSnapshot.docs
      .map(doc => doc.data())
      .filter(entry => entry.isSubscription === false);
      
    const uniqueBuyers = [...new Set(buyersRaw.map(entry => entry.buyer))];

    res.status(200).json({ buyers: uniqueBuyers.length });

  } catch (error) {
    console.error("Error fetching payers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

exports.getProfilePicture = async (req, res) => {
  try {
    const authorName = req.params.authorName;

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('name', '==', authorName).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No user found with this username' });
    }

    let userId = '';
    let profilePicture = '';

    snapshot.forEach((doc) => {
      userId = doc.id;
      const userData = doc.data();
      profilePicture = userData.profilePicture || null;
    });

    if (!userId) {
      return res.status(404).json({ error: 'User data not found.' });
    }

    let base64Image = '';
    if (profilePicture) {
      const filePath = `profilePics/${userId}/${profilePicture}`;
      const file = bucket.file(filePath);
      const [fileExists] = await file.exists();

      if (fileExists) {
        const [fileBuffer] = await file.download();
        base64Image = fileBuffer.toString('base64');
      }
    }

    res.status(200).json({
      profilePicture: base64Image
    });


  } catch (error) {
    console.error('Error fetching author details:', error);
    res.status(500).json({ message: 'Error fetching author details.' });
  }
}

exports.postProfilePicture = async (req, res) => {
  try {
    const { email, photo } = req.body;
    if (!email || !photo) {
      return res.status(400).json({ message: 'Email and photo are required.' });
    }

    const binaryData = Buffer.from(photo, 'base64');
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get(); 

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
}

exports.putUserSubscription = async (req, res) => {
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

    await usersRef.doc(userId).update({ subscriptionPrice });

    res.status(200).json({ message: 'Subscription price updated successfully' });

} catch (error) {
    console.error('Error updating subscription price:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
}
