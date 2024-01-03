//const axios = require('axios')
//const { globalRequestParams, baseURL } = require('../Utils/requests.js')
//await axios.post(baseURL + 'register', randomUser, globalRequestParams);
//const response =await axios.post(baseURL + 'register', randomUser, globalRequestParams);
//await axios.post(`http://localhost:3000/post/${postId}/comments`, randomComment);
//const documentSnapshot = response.data
//const postId = documentSnapshot._path.segments[1]
// const documentData = documentSnapshot._converter.fromFirestore(documentSnapshot); //????
// const title = documentData.title

// IN FOR 10-20 users si posts +  5 comentarii la posts

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const admin = require('firebase-admin')

const serviceAccount = require('./dbcredentials/tic2024-41e34-firebase-adminsdk-m6dc6-564329c655.json')

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

var Chance = require('chance')
var chance = new Chance()

const bcrypt = require('bcrypt')
const saltRounds = 10

function generateRandomUser() {
  return {
    name: chance.name(),
    email: chance.email(),
    password: chance.string({ length: 8 }),
  }
}

function generateRandomPost(users) {
  const randomUser = chance.pickone(users)

  return {
    title: chance.sentence({ words: 3 }),
    author: randomUser.name,
    country: chance.country({full:true}),
    city: chance.city(),
    date: chance.date({ year: new Date().getFullYear() }),
    description: chance.paragraph({ sentences: 5 }),
    likes:chance.integer({ min: 0, max: 15 })
  }
}

function generateRandomComment(users) {
  const randomUser = chance.pickone(users)
  return{
    userName: randomUser.name,
    comment: chance.paragraph({ sentences: 2 })
  }
}

async function populateUsersCollection() {
  try {
    let users = []
    const userPromises = []

    for (let i = 0; i < 5; i++) {   // !!!! 10 - 20
      const randomUser = generateRandomUser()

      const promise = new Promise((resolve, reject) => {
        bcrypt.hash(randomUser.password, saltRounds, async function (err, hash) {
          if (err) {
            reject(err)
            return
          }

          randomUser.password = hash;
          const userRef = await db.collection('users').add(randomUser)
          randomUser.id = userRef.id
          users.push(randomUser)
          console.log('Added document with ID:', randomUser.id)
          resolve()
        });
      });

      userPromises.push(promise);
    }

    await Promise.all(userPromises)

    console.log('Users collection populated successfully.')
    console.log(users)

    return users 
  } catch (error) {
    console.error('Error populating users collection:', error)
  }
}


async function populatePostCollection(users) {
  try {
    const postPromises = []

    for (let i = 0; i < 10; i++) { // !!!! 10 - 20
      const randomPost = generateRandomPost(users)
      const postRef = await db.collection('posts').add(randomPost)
      randomPost.id = postRef.id

      const numComments = chance.integer({ min: 0, max: 7 }) //10

      const commentPromises = []

      for (let j = 0; j < numComments; j++) {
        const randomComment = generateRandomComment(users)
        const commentPromise = db.collection('posts').doc(postRef.id).collection('comments').add(randomComment)
        commentPromises.push(commentPromise) 
      }

      const comments = await Promise.all(commentPromises)
      console.log(`${randomPost.id} - comments added: ${comments.length}`)

      postPromises.push(randomPost) 
      randomPost.comments = comments
    }

    const posts = await Promise.all(postPromises)
    console.log('Posts collection populated successfully:', posts)
  } catch (error) {
    console.error('Error populating posts collection:', error)
  }
}



populateUsersCollection()
    .then(users => {
      populatePostCollection(users)
    })
    .catch(error => {
      console.error('Error:', error)
    })

