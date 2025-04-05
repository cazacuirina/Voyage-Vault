<template>
  <v-app id="postlist">
    <v-content>

    <v-container>
    <v-row class="d-flex justify-center mb-4">
      <v-col>
        <h1 class="display-2 text-center">Voyage Vault</h1>
        <h3 class="text-center">~ Find inspiration in every journey ~</h3>
      </v-col>
    </v-row>

    <Post ref="postform" @post-created="addNewPostToList" @post-edited="updatePost" :dialog-active.sync="isEditDialogActive"/>

    <v-row class="d-flex justify-end">
    <v-col cols="2">
      <v-select
        v-model="selectedCountry"
        :items="uniqueCountries"
        label="Filter by"
        @change="filterByCountry"
        dense
      ></v-select>
    </v-col>
    <v-col cols="2">
      <v-select
        v-model="sortBy"
        :items="sortOptions"
        label="Sort by"
        dense
      ></v-select>
    </v-col>
    <v-col cols="auto">
      <v-btn rounded="xl" size="x-large" @click="toggleSortDirection">
        <v-icon>{{ sortDesc ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
      </v-btn>
    </v-col>
  </v-row>

  <v-container style="height: 400px;" v-if="loading">
    <v-row
      class="fill-height"
      align-content="center"
      justify="center">
      <v-col
        class="text-subtitle-1 text-center loading"
        cols="12">Loading posts</v-col>
      <v-col cols="6">
        <v-progress-linear
          color="brown"
          :model-value="loadingProgress"
          rounded
          height="6"></v-progress-linear>
      </v-col>
    </v-row>
  </v-container>

  <AuthorProfile v-if="selectedAuthor" :authorName="selectedAuthor" />
        <!-- @clearFilter="clearAuthorFilter" -->

    <v-row class="post-container">
      <v-col v-for="post in filteredPosts" :key="post.id" cols="12" md="6" lg="4">
        <v-card class="post-card">
          <!-- <router-link :to="{ name: 'PostDetails', params: { postTitle: post.title } }"
          @click.native.prevent="checkPostAccess(post)">
            <v-card-title>{{ post.title }}</v-card-title>
          </router-link> -->
          <v-card-title 
            class="clickable" 
            @click="checkPostAccess(post)">
            {{ post.title }}
          </v-card-title>
          
          <v-card-subtitle >{{ post.country }}, {{ post.city }}</v-card-subtitle>
          <v-col md="10" id="author" class="text-right clickable" @click="filterByAuthor(post.author)">
            By: {{ post.author }}
          </v-col>
          <v-card-text class="card-content">{{ extractSummary(post.description) }}</v-card-text>
        
          <v-card-actions>
            <v-spacer></v-spacer>
            <!-- "Buy" button for Premium Posts if user is not the author and has no subscription -->
            <!-- <v-btn
              v-if="post.isPremium && !isUserSubscribed && !isCurrentUserAuthor(post)"
              rounded="xl"
              @click="openBuyDialog(post)">Buy Post</v-btn> -->
              <v-chip v-if="post.isPremium && !isCurrentUserAuthor(post)"
                    color="orange" class="ma-2" label>
                    <v-icon left>mdi-star</v-icon> Premium
              <!-- <v-icon left>mdi-lock</v-icon> Premium -->
            </v-chip>

            <v-btn rounded="xl" v-if="isCurrentUserAuthor(post)" @click="openEditDialog(post)">
              <v-icon right>mdi-square-edit-outline </v-icon></v-btn>

            <v-btn rounded="xl" v-if="isCurrentUserAuthor(post)" @click="deletePost(post.id)">
              <v-icon right>mdi-trash-can</v-icon></v-btn>

            <v-btn :key="post.id" :class="{ 'red--text': post.liked }" v-if="!isCurrentUserAuthor(post)" icon @click="likePost(post.id)">
              <v-icon :color="post.liked ? 'red' : ''">{{ post.liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              <span class="ml-1">{{ post.likes }}</span>
            </v-btn>
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="showLoginNotification" timeout="3000" color="red">
      Login before you interact with a post!
    </v-snackbar>

    <!-- Dialog to ask Buy or Subscribe -->
  <v-dialog v-model="isBuyDialogActive" max-width="400px">
    <v-card>
      <v-card-title class="headline">Premium Content</v-card-title>
      <v-card-text>
        <p>Do you want to buy this post?<br> You can also subscribe to the author to gain full access to his content.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="buyPost">Buy Post</v-btn>
        <!-- <v-btn color="secondary" @click="subscribeToAuthor">Subscribe</v-btn> -->
        <v-btn @click="isBuyDialogActive = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


    <v-dialog v-model="showDeleteConfirmation" max-width="400">
    <v-card>
      <v-card-title class="headline">
        Confirm delete
      </v-card-title>
      <v-card-text>
        Are you sure you want to delete the post "{{ postToDelete ? postToDelete.title : '' }}"?
      </v-card-text>
      <v-card-actions>
        <v-btn @click="cancelDelete">Cancel</v-btn>
        <v-btn color="error" @click="confirmDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-row>
      <v-col class="text-center" cols="12">
        <v-pagination
          v-model="currentPage"
          :length="numberOfPages"
          @input="changePage"
        ></v-pagination>
      </v-col>
    </v-row>
  </v-container>

  </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'
import Post from '../components/Post.vue'
import AuthorProfile from "../components/AuthorProfile.vue";

export default {
components:{
  Post,
  AuthorProfile
},
data() {
  return {
    posts: [],
    userName: "", 
    userEmail: "",
    token: "",
    loading: true,
    loadingProgress: 0,
    itemsPerPage: 6,
    currentPage: 1,
    selectedCountry: null,
    selectedAuthor: null,
    sortBy: "", 
    sortDesc: false,
    sortOptions: ['Date', 'Likes', 'Rating'], 
    showLoginNotification: false,
    showDeleteConfirmation: false,
    postToDelete: null,
    isEditDialogActive: false,
    isBuyDialogActive: false, // Control the Buy dialog visibility
    //isUserSubscribed: false,
    buyPostId: null,
    buyPostTitle: null,
    buyPostPrice: null,
    buyPostAuthor: null,
  }
},
computed: { // computed propr derived from data phase (automatically reevaluated when propr changes - reactive)
  isCurrentUserAuthor() {
    return (post) => {
      //const userName = localStorage.getItem('userName')
      return post.author === this.userName
    }
  },
  numberOfPages() {
    return Math.ceil(this.posts.length / this.itemsPerPage)
  },
  displayedPosts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.posts.slice(startIndex, endIndex)
  },
  uniqueCountries() {
  const allCountries = this.posts.map(post => post.country)
  const uniqueCountries = [...new Set(allCountries)] // no duplicates
  return ['All destinations', ...uniqueCountries]
},
filteredPosts() {
  if (this.selectedAuthor) {
      return this.posts.filter((post) => post.author === this.selectedAuthor)  // only selected author's posts
  }
  // console.log(this.sortBy)

  const sortedPosts = [...this.posts]

  sortedPosts.sort((a, b) => {
    if (this.sortBy === 'Date') {
      const dateA = this.extractDateFromTimestamp(a.date)
      const dateB = this.extractDateFromTimestamp(b.date)
      return this.sortDesc ? dateB - dateA : dateA - dateB   // sort by date
    } else if (this.sortBy === 'Likes') {
      const likesA = a.likes ?? 0;
      const likesB = b.likes ?? 0;
      return this.sortDesc ? likesB - likesA : likesA - likesB;
      // return this.sortDesc ? b.likes - a.likes : a.likes - b.likes  // sort by likes
    }else if (this.sortBy === 'Rating') {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return this.sortDesc ? ratingB - ratingA : ratingA - ratingB;
      // return this.sortDesc ? b.rating - a.rating : a.rating - b.rating; // sort by rating
    }
    return 0
  })

  // select posts with specified destination
  return this.selectedCountry && this.selectedCountry !== 'All destinations'
    ? sortedPosts.filter(post => post.country === this.selectedCountry)
    : sortedPosts.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage)
},

},
mounted() {
  window.addEventListener('popstate', this.handlePopstate) // triggered: forward/back - change browser history state
  this.userName = localStorage.getItem('userName');
  this.userEmail = localStorage.getItem('userEmail');
  this.token = localStorage.getItem('token');
  this.startLoadingProgress()  // progress bar
  this.getAllPosts()           // get all posts
  //this.favoritePosts()         // like user's favorite posts
},
methods: {
  handlePopstate(event) {
    if (event.state) {
      this.selectedAuthor = event.state.selectedAuthor || null // no author selected 
      this.currentPage = event.state.currentPage || 1 // back 
      this.filterByAuthor()
    }
  },

  async checkPostAccess(post) {
    try {
      const hasAccess = await this.verifyPostAccess(post);
      console.log(post)
      console.log(hasAccess)
      //const hasAccess = true;
      //console.log("HI")
      if (hasAccess) {
        this.$router.push({ name: 'PostDetails', params: { postTitle: post.title } });
      } else {
        this.openBuyDialog(post);
        //this.$toast.error("You don't have access to this premium post!");
      }
    } catch (error) {
      console.error("Error verifying post access:", error);
    }
  },

  async verifyPostAccess(post){
    if(!post.isPremium || (post.author === this.userName)){
      return true
    }
    //console.log(post.boughtBy) //asa arata boughtBy: Array [ "titi" ] dar nu iese verificarea in if
    if (post.boughtBy && post.boughtBy.includes(this.userName)) { 
      console.log("DA")
        return true;
    }
    {
      const response = await axios.get(
          `http://localhost:3001/user/${post.author}/following`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          }
        );

        const { isSubscribed } = response.data;
        console.log(isSubscribed)
      return isSubscribed
    }
  },

  openBuyDialog(post) {
    console.log(post)

    //const token = localStorage.getItem('token')
    
    if (!this.token) {   // warn user to login before interacting with posts
      console.error('User is not authenticated. Unable to buy post.') 
      this.showLoginNotification = true
      setTimeout(() => {
        this.showLoginNotification = false
      }, 3000)
      return
    }

    this.buyPostId = post.id; // Store the post ID
    this.buyPostTitle = post.title;
    this.buyPostPrice = post.price; // Store the post price
    this.buyPostAuthor = post.author;
    this.isBuyDialogActive = true;
    },
    closeBuyDialog() {
      this.isBuyDialogActive = false;
    },
    async buyPost() {
      try {

        // Make a request to the backend to create a Stripe session
        const response = await axios.post(
          "http://localhost:3001/stripe/create-post-checkout-session", // Backend endpoint
          {
            postId: this.buyPostId,
            postTitle: this.buyPostTitle,
            price: this.buyPostPrice,
            authorName: this.buyPostAuthor,
          },
          {
            headers: {
              Authorization: `Bearer ${this.token}`, // Include the token from localStorage
            },
          }
        );

        // Close the dialog
        this.isBuyDialogActive = false;

      
        // Redirect to Stripe's checkout page
       window.location.href = response.data.url;

       console.log()
      localStorage.setItem("userEmail", this.userEmail);
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("token", this.token);
      } catch (error) {
        console.error("Error during payment:", error);
        this.$toast.error("Something went wrong. Please try again.");
      }
    },

    async payPost() {
  try {
    // Send request to the backend to create a Stripe checkout session for the post payment
    const response = await axios.post(
      "http://localhost:3001/stripe/create-post-checkout-session",
      {
        postId: this.postId,  // Send the post's ID (can be from the post you're buying)
        price: this.postPrice, // The price for the post (stored in your post data)
        authorName: this.postAuthor, // The author's name (for reference)
      },
      {
        headers: { Authorization: `Bearer ${this.token}` }, // Add Authorization header if needed
      }
    );

    // Close the dialog for payment
    this.showPaymentModal = false;

    // Redirect to the Stripe checkout page
    window.location.href = response.data.url;

    // Optionally, save user details in localStorage after successful payment
    localStorage.setItem("userEmail", this.userEmail);
    localStorage.setItem("userName", this.userName);
    localStorage.setItem("token", this.token);
  } catch (error) {
    console.error("Error creating Stripe session for post:", error);
  }
},

  filterByAuthor(author) {
    this.selectedAuthor = author
    this.currentPage = 1

    const currentState = {
      selectedAuthor: this.selectedAuthor,
      currentPage: this.currentPage,
    } // before filtering posts, save current state to get back to it
    window.history.pushState(currentState, null, null) // state, + pageName, URL (same as before)
  },
  // clearAuthorFilter() {
  //     this.selectedAuthor = null; // Resetare filtrare
  //   },
  startLoadingProgress() {   // progress bar start loading - wait for posts to be retrieved
    this.loadingInterval = setInterval(() => {
      if (this.loadingProgress === 100) {
        this.stopLoadingProgress()
      } else {
        this.loadingProgress += 10
      }
    }, 350)
  },
  stopLoadingProgress() {
    clearInterval(this.loadingInterval)
    this.loadingProgress = 100
    this.loading = false
  },

  async getAllPosts() {
    try {
      const response = await axios.get('http://localhost:3001/posts')
      this.posts = response.data
      if(this.token){
       await this.favoritePosts()     // color like button after loading posts 
      }
      this.stopLoadingProgress()     // stop progress bar when all posts are loaded
      console.log(response)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  },
  async favoritePosts() {
    try {
      const response = await axios.get('http://localhost:3001/user/favorites', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })   // get user favorite destinations
      
        const favoriteList = response.data.travelList || []
        console.log(favoriteList)
        this.posts.forEach(post => {
          post.liked = favoriteList.some(favorite => favorite.postId === post.id)  // color like button red for favorite posts
          console.log(post.liked)
        })

      } catch (error) {
        console.error('Error fetching favoriteList ', error)
      }
  },

  openEditDialog(post) {
    this.$refs.postform.openEditForm(post)  // activate dialog window for editing post
    this.isEditDialogActive = true
  },

  async likePost(postId) {
  try {
    // const token = localStorage.getItem('token')
    // const userName = localStorage.getItem('userName')
    
    if (!this.token) {   // warn user to login before interacting with posts
      console.error('User is not authenticated. Unable to like post.') 
      this.showLoginNotification = true
      setTimeout(() => {
        this.showLoginNotification = false
      }, 3000)
      return
    }
    //console.log(token, userName)

    const config = {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    }
    const response = await axios.put(`http://localhost:3001/post/${postId}/like`, null, config)  // update post in db

    const postIndex = this.posts.findIndex(post => post.id === postId)  // update like btn in frontend
    if (postIndex !== -1) {
      this.posts[postIndex].likes++
      this.posts[postIndex].liked=true
    }
  } catch (error) {
    console.error('Error liking post:', error)
  }
},

async deletePost(postId) {  // require user confirmation to delete post
  this.postToDelete = this.posts.find(post => post.id === postId)   // find post to be deleted
  this.showDeleteConfirmation = true
},
cancelDelete() {
  this.showDeleteConfirmation = false  // no post to be deleted
  this.postToDelete = null
},
async confirmDelete() {
  this.showDeleteConfirmation = false
  const postId = this.postToDelete.id   
    try {
      //const token = localStorage.getItem('token')
      const config = {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
      await axios.delete(`http://localhost:3001/post/${postId}`, config)  // delete post from db

      this.posts = this.posts.filter(post => post.id !== postId)    // delete post from list
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  },

  addNewPostToList(newPost) {
    this.posts.unshift(newPost)  // add new post at the beginning of the list
  },
  updatePost(updatedPost) {
    const index = this.posts.findIndex(post => post.id === updatedPost.id)  // find edited post
    if (index !== -1) {
      this.posts[index] = updatedPost   // update post in list
    }
  },

  changePage(page) {
    this.currentPage = page
  },
  filterByCountry() {
    if (this.selectedCountry && this.selectedCountry !== 'Toate postările') {
    this.currentPage = 1 // reset page number after applying filter
    }
  },
  toggleSortDirection() {
    this.sortDesc = !this.sortDesc
  },
  extractSummary(description) {  // first 3 sentences
    const sentences = description.split(/[.!?;]/)
    const firstTwoSentences = sentences.slice(0, 2).join('.') +"..." 
    return firstTwoSentences
  },
  extractDateFromTimestamp(timestamp) {   // timestamp format db - post date
    const seconds = timestamp._seconds || 0
    const nanoseconds = timestamp._nanoseconds || 0
    return new Date(seconds * 1000 + nanoseconds / 1000000)
  },
},
}
</script>

<style scoped>

#postlist{
  background: linear-gradient(to bottom, #8f5b3a, #b79866);
}

h1 {
  font-family: 'Dancing Script', cursive;
  font-size: 3em;
  color: #c8b29a;
  text-shadow: 0 2px 3px #af9b8f;
}

h3 {
  font-family: 'Quicksand', sans-serif;
  font-style: italic;
  font-size: 2em;
  color: #dfc7bb;
  text-shadow: 0 2px 3px #ab8953 ;
}

.loading{
  font-family: 'Quicksand', sans-serif;
  font-style: italic;
  font-size: 2.2em;
  color: #dfc7bb;
}

.sort-controls v-icon {
font-size: 24px;
}
.post-card {
min-height: 20em;
display: flex;
flex-direction: column;
align-self: stretch;
background-color: #fff; 
border-radius: 10px; 
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
margin: 10px; 
transition: background-color 0.3s, transform 0.3s;
background: linear-gradient(to bottom, rgb(255, 255, 222), rgb(165, 73, 42));
}

.post-card:hover {
background-color: #f8f8f8; 
transform: scale(1.02); 
}
.clickable {
  cursor: pointer;
  color: #66381b; /* Culoare link */
  text-decoration: underline;
}
.clickable:hover {
  text-decoration: none;
}

#author{
font-family: 'Dancing Script', cursive;
font-style: italic;
text-decoration-line:underline;
}
.card-content {
flex-grow: 1;
overflow: hidden;
color: #333;
}
.post-card a {
  color: rgb(134, 42, 42);
  font-family: 'Quicksand', sans-serif;
}
.post-card a:hover {
  color: #b79866;
}
.v-select {
height: 1em; 
max-width: 10em; 
background-color: #b58e57; 
color: #fff; 
border: none;
margin: 2px;
transition: background-color 0.3s;
}

.v-select:hover, .v-select:focus {
background-color: #8f6e3a; 
}

.v-select-item:hover {
background-color: #8f6e3a; 
color: #fff; 
}
.v-btn {
background-color: #b58e57; 
color: #fff; 
border: none;
margin: 2px;
transition: background-color 0.3s;
}

.v-btn:hover {
background-color: #8f6e3a; 
}
.sort-controls v-icon {
font-size: 24px; 
}

</style>