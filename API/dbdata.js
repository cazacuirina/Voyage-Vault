const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const admin = require('firebase-admin')

const serviceAccount = require('./dbcredentials/tic2024-41e34-firebase-adminsdk-m6dc6-6a07f5dec1.json')

initializeApp({
  credential: cert(serviceAccount)
})
const db = getFirestore()

var Chance = require('chance')
var chance = new Chance()

const bcrypt = require('bcrypt')
const saltRounds = 10

// Generate User
function generateRandomUser() {
  return {
    name: chance.name(),
    email: chance.email(),
    password: chance.string({ length: 8 }),
  }
}

// Generate Post
function generateRandomPost(users) {
  const randomUser = chance.pickone(users)  // select random user from list

  return {
    title: chance.sentence({ words: 3 }),
    author: randomUser.name,
    country: chance.country({full:true}),
    city: chance.city(),
    date: chance.date({ year: new Date().getFullYear() }),
    description: chance.paragraph({ sentences: 5 }),
    likes:chance.integer({ min: 0, max: 15 }),
    rating:chance.floating({ min: 1, max: 5, fixed: 1 })
  }
}

// Generate post Comments
function generateRandomComment(users) {
  const randomUser = chance.pickone(users)  // select random user from list
  return{
    userName: randomUser.name,
    comment: chance.paragraph({ sentences: 2 })
  }
}

// Add Users to db collection
async function populateUsersCollection() {
  try {
    let users = []
    const userPromises = []

    for (let i = 0; i < 5; i++) {   // -> 10
      const randomUser = generateRandomUser()

      const promise = new Promise((resolve, reject) => {  // wait for user to be saved in db (async operation)
        bcrypt.hash(randomUser.password, saltRounds, async function (err, hash) {
          if (err) {
            reject(err)
            return
          }

          randomUser.password = hash
          const userRef = await db.collection('users').add(randomUser)  // save user to db
          randomUser.id = userRef.id
          users.push(randomUser)  // add user to the list
          console.log('Added document with ID:', randomUser.id)
          resolve()
        });
      });

      userPromises.push(promise)
    }

    await Promise.all(userPromises)  // wait for all promises to be resolved

    console.log('Users collection populated successfully.')
    console.log(users)

    return users 
  } catch (error) {
    console.error('Error populating users collection:', error)
  }
}

// Add Posts and Comments to db collection
async function populatePostCollection(users) {
  try {
    const postPromises = []

    for (let i = 0; i < 10; i++) { // -> 20
      const randomPost = generateRandomPost(users)
      const postRef = await db.collection('posts').add(randomPost)  // save post to db
      randomPost.id = postRef.id

      const numComments = chance.integer({ min: 0, max: 7 }) //10

      const commentPromises = []

      for (let j = 0; j < numComments; j++) {
        const randomComment = generateRandomComment(users)
        const commentPromise = db.collection('posts').doc(postRef.id).collection('comments').add(randomComment) // save comment to subcollection
        commentPromises.push(commentPromise)  // first, add comments to the post
      }

      const comments = await Promise.all(commentPromises)
      console.log(`${randomPost.id} - comments added: ${comments.length}`)

      postPromises.push(randomPost)  // then, add post with comments to list
      randomPost.comments = comments  
    }

    const posts = await Promise.all(postPromises)   // wait for all promises to be resolved

    console.log('Posts collection populated successfully:', posts)
  } catch (error) {
    console.error('Error populating posts collection:', error)
  }
}



populateUsersCollection()     // create users collection
    .then(users => {
      populatePostCollection(users)  // create posts collection + comments subcolection
    })
    .catch(error => {
      console.error('Error:', error)
    })

