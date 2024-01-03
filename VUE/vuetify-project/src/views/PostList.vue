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

      <v-row class="post-container">
        <v-col v-for="post in filteredPosts" :key="post.id" cols="12" md="6" lg="4">
          <v-card class="post-card">
            <router-link :to="{ name: 'PostDetails', params: { postTitle: post.title }, query: { post: JSON.stringify(post) } }">
              <v-card-title>{{ post.title }}</v-card-title>
            </router-link>
            <v-card-subtitle >{{ post.country }}, {{ post.city }}</v-card-subtitle>
            <v-col md="10" id="author" class="text-right" @click="filterByAuthor(post.author)">
              By: {{ post.author }}
            </v-col>
            <v-card-text class="card-content">{{ extractSummary(post.description) }}</v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              

              <v-btn rounded="xl" v-if="isCurrentUserAuthor(post)" @click="openEditDialog(post)">
                <v-icon right>mdi-square-edit-outline </v-icon></v-btn>

              <v-btn rounded="xl" v-if="isCurrentUserAuthor(post)" @click="deletePost(post.id)">
                <v-icon right>mdi-trash-can</v-icon></v-btn>

              <v-btn :class="{ 'red--text': post.liked }" v-if="!isCurrentUserAuthor(post)" icon @click="likePost(post.id)">
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
//import { globalRequestParams, baseURL } from './Utils/requests.js'
//const { globalRequestParams, baseURL } = require('../Utils/requests.js')
import Post from '../components/Post.vue'

export default {
  components:{
    Post
  },
  data() {
    return {
      posts: [],
      loading: true,
      loadingProgress: 0,
      itemsPerPage: 6,
      currentPage: 1,
      selectedCountry: null,
      selectedAuthor: null,
      sortBy: "", 
      sortDesc: false,
      sortOptions: ['date', 'likes'], 
      showLoginNotification: false,
      showDeleteConfirmation: false,
      postToDelete: null,
      isEditDialogActive: false,
    }
  },
  computed: { // computed propr derived from data phase (automatically reevaluated when propr changes)
    isCurrentUserAuthor() {
      return (post) => {
        const userName = localStorage.getItem('userName')
        return post.author === userName
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
        return this.posts.filter((post) => post.author === this.selectedAuthor)
    }

    const sortedPosts = [...this.posts]

    sortedPosts.sort((a, b) => {
      if (this.sortBy === 'date') {
        const dateA = this.extractDateFromTimestamp(a.date)
        const dateB = this.extractDateFromTimestamp(b.date)
        return this.sortDesc ? dateB - dateA : dateA - dateB
      } else if (this.sortBy === 'likes') {
        return this.sortDesc ? b.likes - a.likes : a.likes - b.likes
      }
      return 0
    })

    return this.selectedCountry && this.selectedCountry !== 'All destinations'
      ? sortedPosts.filter(post => post.country === this.selectedCountry)
      : sortedPosts.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage)
  },

},
  mounted() {
    window.addEventListener('popstate', this.handlePopstate) // triggered: forward/back - change browser history state

    this.startLoadingProgress()
    this.getAllPosts()
  },
  methods: {
    handlePopstate(event) {
      // AI NEVOIE DE PREVIOUS STATE SAU DIRECT RESET?
      if (event.state) {
        this.selectedAuthor = event.state.selectedAuthor || null // no author selected 
        this.currentPage = event.state.currentPage || 1 // back 
        this.filterPostsByAuthor()
      }
    },
    filterByAuthor(author) {
      this.selectedAuthor = author
      this.currentPage = 1

      const currentState = {
        selectedAuthor: this.selectedAuthor,
        currentPage: this.currentPage,
      } // save current state to get back to it
      window.history.pushState(currentState, null, null) // state, pageName, URL (same as before)
    },
    startLoadingProgress() {
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
        const response = await axios.get('http://localhost:3001/posts') // baseurl si headerparams
        this.posts = response.data
        this.stopLoadingProgress()
        console.log(response)
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    },

    openEditDialog(post) {
      this.$refs.postform.openEditForm(post)
      this.isEditDialogActive = true
    },

    async likePost(postId) {
    try {
      const token = localStorage.getItem('token')
      const userName = localStorage.getItem('userName')
      
      if (!token) {
        console.error('User is not authenticated. Unable to like post.') 
        this.showLoginNotification = true
        setTimeout(() => {
          this.showLoginNotification = false
        }, 3000)
        return
      }
      console.log(token, userName)

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.put(`http://localhost:3001/post/${postId}/like`, null, config)

      const postIndex = this.posts.findIndex(post => post.id === postId)
      if (postIndex !== -1) {
        this.posts[postIndex].likes++
        this.posts[postIndex].liked=true
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  },

  async deletePost(postId) {
    this.postToDelete = this.posts.find(post => post.id === postId)
    this.showDeleteConfirmation = true
  },
  cancelDelete() {
    this.showDeleteConfirmation = false
    this.postToDelete = null
  },
  async confirmDelete() {
    this.showDeleteConfirmation = false
    const postId = this.postToDelete.id
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
        await axios.delete(`http://localhost:3001/post/${postId}`, config)

        this.posts = this.posts.filter(post => post.id !== postId)
      } catch (error) {
        console.error('Error deleting post:', error)
      }
    },

    addNewPostToList(newPost) {
      this.posts.unshift(newPost)
    },
    updatePost(updatedPost) {
      const index = this.posts.findIndex(post => post.id === updatedPost.id)
      if (index !== -1) {
        this.posts[index] = updatedPost
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
    extractSummary(description) {
      const sentences = description.split(/[.!?;]/)
      const firstTwoSentences = sentences.slice(0, 2).join('.') +"..." 
      return firstTwoSentences
    },
    extractDateFromTimestamp(timestamp) {
      console.log("aici")
      const seconds = timestamp._seconds || 0;
      const nanoseconds = timestamp._nanoseconds || 0;
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
  