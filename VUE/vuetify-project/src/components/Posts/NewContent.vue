<template>
    <v-card class="pa-4 my-4 container-card">
      <v-card-title id="newcontent" class="text-h6">🆕 New Content</v-card-title>
  
      <h2 class="text-center favHeading" v-if="!loadingPosts && newPosts.length === 0">
        No new content from followed authors yet. Check back later!
      </h2>
  
      <v-row v-if="!loadingPosts" dense>
        <v-col
          v-for="(post, index) in newPosts"
          :key="index"
          :cols="12" :md="3" 
        >
          <v-card class="card-beige">
            <v-card-text>
                <v-card-title >
                <router-link
                    :to="{ name: 'PostDetails', params: { postTitle: post.title } }"
                    class="font-weight-bold text-subtitle-1 text-decoration-none posts"
                >
                    {{ post.title }}
                </router-link>
                </v-card-title>
              
              <div class="grey--text text--darken-1">
                {{ post.city }}, {{ post.country }}
              </div>
              <div class="mt-1 text--secondary">👍 {{ post.likes }} likes</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-btn
        color="primary"
        @click="loadMore"
        :disabled="loading || noMoreData"
        block
        class="mt-3"
      >
        <span v-if="!loading && !noMoreData">Load More</span>
        <span v-else-if="loading">Loading...</span>
        <span v-else>No more posts</span>
      </v-btn>
  
      <v-row>
        <v-col>
          <v-alert type="info" variant="tonal" v-if="loadingPosts" class="loadingAlert">
            Loading new content...
          </v-alert>
        </v-col>
      </v-row>
    </v-card>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'NewContent',
    data() {
      return {
        newPosts: [],
        loadingPosts: true,
        loading: false,
        noMoreData: false,
        token: '',
        lastVisibleDate: null,
      };
    },
    mounted() {
      this.token = localStorage.getItem('token');
      if (this.token) {
        this.getNewContent();
      }
    },
    methods: {
        async getNewContent() {
      this.loadingPosts = true;
      try {
        const response = await axios.get("http://localhost:5000/user/newContent", {
          headers: {
            Authorization: `Bearer ${this.token}`
          },
          params: {
            lastVisibleDate: this.lastVisibleDate
          }
        });
     
        const { posts, lastVisibleDate } = response.data;
        if (posts.length === 0) {
          this.noMoreData = true;
        } else {
          this.newPosts = [...this.newPosts, ...posts];
          this.lastVisibleDate = lastVisibleDate;
       
        }
      } catch (error) {
        console.error("Error fetching new content:", error);
      } finally {
        this.loadingPosts = false;
      }
    },

    loadMore() {
      if (!this.noMoreData) {
        this.getNewContent();
      }
    }
    }
  };
  </script>
  
  <style scoped>
  #newcontent{
    color:wheat;
    font-family: 'Quicksand', sans-serif; 
    font-style: italic;
    font-size: 1em;
  }
  .container-card{
    background-color: #683312;
  }
  .favHeading {
    font-size: 20px;
    font-weight: 500;
    margin: 20px 0;
  }
  
.card-beige {
  background: linear-gradient(to bottom, #b79866 , #f0eae1);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.loadingAlert {
  margin-top: 20px;
}

.posts {
  font-family: "Dancing Script", cursive !important;
}

.v-card-text {
  font-family: 'Quicksand', sans-serif; 
  color: #4b3b2a; 
}

.v-btn {
  font-family: 'Quicksand', sans-serif; 
}
  </style>
  