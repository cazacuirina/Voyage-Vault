const { db } = require("../database/database");
const {
    sendFollowNotification
  } = require('./emailService');

exports.getFollowingStatus = async (req, res) => {
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
    
        const isFollowing = userFollowing.includes(authorName);
        const isSubscribed = userSubscribed.includes(authorName);
    
        return res.status(200).json({ isFollowing, isSubscribed });
    
      } catch (error) {
        console.error('Error checking following status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}

exports.getFollowersList = async (req, res) => {
    try {
        const authorName = req.params.authorName;
      
        const usersRef = db.collection('users');
  
        const authorSnapshot = await usersRef
          .where('name', '==', authorName)
          .select('followers', 'noSubscribers', 'subscriptionPrice') 
          .limit(1)
          .get();
  
        if (authorSnapshot.empty) {
          return res.status(404).json({ error: 'Author not found' });
        }
  
        const authorDoc = authorSnapshot.docs[0];
        const data = authorDoc.data();
  
        const authorFollowers = data.followers || 0;
        const authorSubscribers = data.noSubscribers || 0;
        const subscriptionPrice = data.subscriptionPrice || 0;
  
        res.status(200).json({
          followers: authorFollowers,
          subscribers: authorSubscribers,
          subscriptionPrice: subscriptionPrice
        });
    } catch (error) {
        console.error('Error fetching followers count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.followAuthor = async (req, res) => {
    try {
          const authorName = req.params.authorName;
          const userEmail = req.userEmail;
    
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
          });
    
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
          });
    
          if (!authorId) {
              return res.status(404).json({ error: 'Author ID not found' });
          }
    
         const isAlreadyFollowing = userFollowing.includes(authorName);
    
          if (isAlreadyFollowing) {
              await usersRef.doc(userId).update({
                  following: admin.firestore.FieldValue.arrayRemove(authorName)
              });
    
              await usersRef.doc(authorId).update({
                  followers: admin.firestore.FieldValue.increment(-1)
              });
    
              return res.status(200).json({ message: 'Unfollowed successfully', isFollowing: false });
          }
    
          await usersRef.doc(userId).update({
              following: admin.firestore.FieldValue.arrayUnion(authorName)
          });
    
          await usersRef.doc(authorId).update({
              followers: admin.firestore.FieldValue.increment(1)
          });
    
          if (authorFollowers == 999) {
            sendFollowNotification(authorEmail, authorName); 
          }
    
          res.status(200).json({ message: 'Followed successfully', isFollowing: true });
    
      } catch (error) {
          console.error('Error following/unfollowing user:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
}

exports.subscribeToAuthor = async (req, res) => {
    try {
        const { authorName } = req.params.authorName;
        const userName = req.userName;
    
        const usersRef = db.collection('users');
        const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
        if (userSnapshot.empty) {
          return res.status(404).json({ error: "User not found" });
        }
        const userId = userSnapshot.docs[0].id;
        console.log(userId)
        if (!userId) return res.status(404).json({ error: "User ID not found" });
    
        const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
        if (authorSnapshot.empty) {
          return res.status(404).json({ error: "Author not found" });
        }
        const authorId = authorSnapshot.docs[0].id;
        console.log(authorId)
        if (!authorId) return res.status(404).json({ error: "Author ID not found" });
    
        await Promise.all([
          usersRef.doc(userId).update({
            subscribed: admin.firestore.FieldValue.arrayUnion(authorName),
          }),
          usersRef.doc(authorId).update({
            noSubscribers: admin.firestore.FieldValue.increment(1),
            subscribers: admin.firestore.FieldValue.arrayUnion(userName),
          })
        ]);
    
        res.status(200).json({ message: "Subscription successful" });
      } catch (error) {
        console.error("Error saving subscriber:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
}

exports.unsubscribeFromAuthor = async (req, res) => {
    try {
        const { authorName } = req.params.authorName;
        const userName = req.userName;
    
        const usersRef = db.collection('users');
    
        const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
        if (userSnapshot.empty) {
          return res.status(404).json({ error: "User not found" });
        }
        const userId = userSnapshot.docs[0].id;
        console.log("User ID:", userId);
        if (!userId) return res.status(404).json({ error: "User ID not found" });
    
        const authorSnapshot = await usersRef.where("name", "==", authorName).limit(1).get();
        if (authorSnapshot.empty) {
          return res.status(404).json({ error: "Author not found" });
        }
        const authorId = authorSnapshot.docs[0].id;
        console.log("Author ID:", authorId);
        if (!authorId) return res.status(404).json({ error: "Author ID not found" });
    
        await Promise.all([
          usersRef.doc(userId).update({
            subscribed: admin.firestore.FieldValue.arrayRemove(authorName),
          }),
          usersRef.doc(authorId).update({
            noSubscribers: admin.firestore.FieldValue.increment(-1),
            subscribers: admin.firestore.FieldValue.arrayRemove(userName),
          })
        ]);
    
        res.status(200).json({ message: "Unsubscription successful" });
      } catch (error) {
        console.error("Error during unsubscription:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
}