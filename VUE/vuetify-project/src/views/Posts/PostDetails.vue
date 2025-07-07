<template>
  <v-app id="postdetails">
    <v-content>
      <v-container>
          <v-row>
          <v-col cols="12">
            <v-card class="card-container">
              <v-card-title id="title" class="text-center post-title">{{ post.title }}</v-card-title>
              
              <v-card-subtitle id="subtitle" class="ml-4 post-subtitle card-subtitle">
                <v-card-text id="author">Destination: {{ post.country }}, {{ post.city }}</v-card-text>
                <v-card-text id="destination">By: {{ post.author }}</v-card-text>
              </v-card-subtitle>
              <v-card-text class="mt-4 card-text">
                <div id="story" class="italic">{{ post.description }}</div>
                <div id="date" class="text-right">{{ post.date }}</div>
              </v-card-text>
              <v-divider></v-divider>

              <div class="carousel-container">
              <v-carousel v-if="images.length > 0" height="400" show-arrows="hover" cycle hide-delimiter-background>
                <v-carousel-item v-for="(image, i) in images" :key="i">
                    <v-sheet class="carousel-background" :color="colors[i]" height="100%">
                        <div class="d-flex fill-height justify-center align-center">
                            <img :src="image" alt="Post image" class="carousel-image" />
                        </div>
                    </v-sheet>
                </v-carousel-item>
            </v-carousel>
            </div>
          
            
                        <v-card
              class="d-flex flex-column mx-auto py-8 ratingcard"
              elevation="10"
              width="100%" 
            >
              <v-row>
                <v-col cols="12" md="6" class="d-flex flex-column justify-center ">
                  <div class="d-flex justify-center mt-3 mb-2 text-h5">Rating Overview</div>

                  <div class="d-flex align-center flex-column my-auto">
                    <div class="text-h2 mb-3 mt-3">
                      {{ post.rating ? post.rating.toFixed(1) : 'No rating yet' }}
                      <span class="text-h6 ml-n3">/5</span>
                    </div>

                    <v-rating
                    v-model="userRating"
                    :color="isUserAuthenticated ? 'orange' : 'yellow-darken-3'" 
                    :readonly="!isUserAuthenticated"
                    :half-increments="true"
                    length="5"
                    size="75"
                    hover
                    @click="showSendButton = true" 
                  ></v-rating>
                  <div class="px-3 text-center text-subtitle-1 mt-2">
                    {{ totalRatings }} ratings
                  </div>
                  </div>

                  <v-row v-if="isUserAuthenticated && showSendButton" class="d-flex align-center my-4">
                  <v-col class="text-center">
                    <div>Rate this post?</div>
                  </v-col>
                  <v-col class="text-center">
                    <v-btn color="green" @click="submitRating">
                      Send Rating
                    </v-btn>
                  </v-col>
                </v-row>
                </v-col>

                <v-col cols="12" md="6" class="d-flex flex-column justify-center">
                  <v-list bg-color="transparent" class="d-flex flex-column-reverse ratinglist" density="compact">
                    <v-list-item v-for="rating in [1, 2, 3, 4, 5]" :key="rating">
                      <v-progress-linear
                        :model-value="getPercentage(rating)"
                        class="mx-n5"
                        color="yellow-darken-3"
                        height="20"
                        rounded
                      ></v-progress-linear>

                      <template v-slot:prepend>
                        <span>{{ rating }}</span>
                        <v-icon class="mx-3" icon="mdi-star"></v-icon>
                      </template>

                      <template v-slot:append>
                        <div class="rating-values">
                          <span class="d-flex justify-end">{{post.starCounts?.[rating] || 0 }}</span>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </v-card>

              <v-divider></v-divider>
              <div v-if="comments.length === 0" class="my-4 ">No comments added yet.</div>
              <v-list class="comments-container">
                <v-list-item-group>
                  <v-list-item class="comment-container" v-for="comment in displayedComments" :key="comment.id">
                    <template v-slot:default="{ active }">
                      <v-list-item-content >
                        <v-list-item-title class="font-weight-bold comment-username">{{ comment.userName }}</v-list-item-title>
                        <v-list-item-subtitle class="comment-text">{{ comment.comment }}</v-list-item-subtitle>
                        
                          <v-expansion-panels v-if="comment.repliesCount > 0">
            <v-expansion-panel>
              <v-expansion-panel-title @click="getReplies(comment)">
                Show Replies
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list class="replies">
                  <v-list-item-group>
                    <v-list-item v-for="reply in comment.replies" :key="reply.id">
                      <v-list-item-content>
                        <v-list-item-title><b>{{ reply.userName }}:</b> {{ reply.comment }}</v-list-item-title>
                      </v-list-item-content>
                      <v-divider
                      v-if="index !== comment.replies.length - 1"
                      class="my-1"
                      color="black"
                      thickness="2"
                    />
                    </v-list-item>
                    
                    </v-list-item-group>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

                        <v-divider v-if="!active"></v-divider>
                        <v-list-item-action class="comment-actions">
                          <v-btn rounded="xl" v-if="isUserTheAuthor(comment)" class="edit-button" @click="editComment(comment)">
                            <v-icon right>mdi-square-edit-outline</v-icon>
                          </v-btn>
                          <v-btn rounded="xl" v-if="isUserTheAuthor(comment)" class="delete-button" @click="deleteComment(comment.id)">
                            <v-icon right>mdi-trash-can</v-icon>
                          </v-btn>
                          <v-btn rounded="xl" v-if="isUserAuthenticated" class="reply-button" @click="setReply(comment)" >
                            <v-icon>mdi-arrow-right-bold</v-icon> 
                          </v-btn>
                        </v-list-item-action>
                      </v-list-item-content>
                    </template>
                  </v-list-item>
                </v-list-item-group>
              </v-list>

              <v-row v-if="isUserAuthenticated">
                <v-col cols="12" class="mt-4">
                  <v-textarea v-model="newComment" :label="replyTo ? 'Reply to ' + replyTo.userName : 'Add a comment'" >
                  </v-textarea>
                </v-col>
                
                <v-col cols="12" class="text-right">
                  <v-btn class="post-button" @click="postComment">
                    <v-icon>{{replyTo ? 'mdi-reply' :(editing ? 'mdi-arrow-up-bold-outline' : 'mdi-checkbox-marked-outline')}}</v-icon>
                    {{replyTo ? 'Post reply' : (editing ? 'Save changes':'Post comment')}}</v-btn>
                </v-col>
              </v-row>

              <v-row>
                <v-col class="text-center" cols="12">
                  <v-pagination v-model="currentPage" :length="numberOfPages" @input="changePage"></v-pagination>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>


<script>
import axios from 'axios'

export default {
  props: ['postTitle'],
  data() {
    return {
      post:{
      rating: 0, 
    },
      userName: "", 
      userEmail:"",
      token:"",
      userRating: 0,
      comments: [],
      itemsPerPage: 5,
      currentPage: 1,
      comment:{},
      images: [], 
      newComment:"",
      replyTo:"",
      editing:false,
      showSendButton: false,
      colors: ['#D4B48C',  '#A67C52',  '#C57C56',],
    };
  },
  computed: {
    isUserAuthenticated() {
      return !!localStorage.getItem('token')
    },
    isUserTheAuthor() {
      return (comment) => {  
        const userName = localStorage.getItem('userName')
        return comment.userName === userName
      }
    },
    numberOfPages() {
      return Math.ceil(this.comments.length / this.itemsPerPage)
    },
    displayedComments() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage
      const endIndex = startIndex + this.itemsPerPage
      return this.comments.slice(startIndex, endIndex)
    },
    totalRatings() {
      if (!this.post.starCounts) return 0;
      return Object.values(this.post.starCounts).reduce((sum, count) => sum + count, 0);
    }
  },
  mounted() {
    this.userName = localStorage.getItem('userName');
    this.userEmail = localStorage.getItem('userEmail')
    this.token = localStorage.getItem('token')
    this.getPost()
  },
  
  methods: {
    async getPost() {
    try {
        const postResponse = await axios.get(`http://localhost:5000/post/${this.postTitle}`, {
            headers: {
                'Cache-Control': 'no-cache',
            },
        })

        console.log(postResponse.data)
        this.post = postResponse.data 
        this.post.rating = parseFloat(postResponse.data.rating)
        console.log(this.post.starCounts)
        this.userRating = this.post.rating 
        this.post.date = this.formatDate(this.post.date)  
        
        await this.getComments()  
        await this.getPostImages()
    } catch (error) {
        console.error('Error fetching post and comments:', error)
    }
},
getPercentage(star) {
      const count = this.post.starCounts?.[star] || 0;
      return this.totalRatings > 0 ? (count / this.totalRatings) * 100 : 0;
    },
async submitRating() {
      try {
        const postId = this.post.id
      
        console.log(this.post.rating)
        const response = await axios.put(`http://localhost:5000/post/${postId}/rate`, {
          rating: this.userRating,
        }, {
          headers: {
            Authorization: `Bearer ${this.token}`, 
          },
        });

        console.log('Rating submitted successfully:', response.data)
        const { avgRating, starCounts } = response.data;
        this.post.rating = avgRating;
        this.post.starCounts = starCounts;
        this.showSendButton = false
      } catch (error) {
        console.error('Error submitting rating:', error)
      }
    },
async getComments() {
    try {
        const commentsResponse = await axios.get(`http://localhost:5000/post/${this.post.id}/comments`, {
            headers: {
                'Cache-Control': 'no-cache',
            },
        })

        this.comments = commentsResponse.data  

        this.comments.sort((a, b) => (b.repliesCount || 0) - (a.repliesCount || 0));

        console.log(this.comments)
    } catch (error) {
        console.error('Error fetching comments:', error)
    }
},
async getReplies(comment) {
    try {
      if (!comment.replies) {
       
        const response = await axios.get(`http://localhost:5000/post/${this.post.id}/comments/${comment.id}/replies`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

      
        comment.replies = response.data;
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  },
async getPostImages() {
  try {

    const response = await axios.get(`http://localhost:5000/post/${this.post.id}/images`, {
      headers: {
        'Cache-Control': 'no-cache',  
      },
    });

    if (response.data.images) {
      this.images = response.data.images.map(image => image.base64); 
      console.log('Post images retrieved successfully', this.images);
    }
  } catch (error) {
    console.error('Error fetching post images:', error);
  }
},
  setReply(comment){
    this.replyTo=comment
  },
    async postComment() {
      try {
        this.comment.comment=this.newComment
        this.comment.userName=this.userName 

        if (this.replyTo) {
      const response = await axios.post(
        `http://localhost:5000/post/${this.post.id}/comments/${this.replyTo.id}/replies`,
        this.comment,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      console.log('Reply sent successfully', response.data);
      if(this.comment.repliesCount==null || this.comment.repliesCount==0){
       this.comment.repliesCount=1 
      }
      
      const commentIndex = this.comments.findIndex(c => c.id === this.replyTo.id);
      if (commentIndex !== -1) {
        if (!this.comments[commentIndex].replies) {
          this.comments[commentIndex].replies = []; 
        }
        this.comments[commentIndex].replies.unshift(response.data); 
        if (!this.comments[commentIndex].repliesCount) {
          this.comments[commentIndex].repliesCount = 1;
        } else {
          this.comments[commentIndex].repliesCount += 1;
        }
      }

      this.replyTo = null;
      } else if(this.editing){
          await axios.put(`http://localhost:5000/post/${this.post.id}/comments/${this.comment.id}`,this.comment, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }) 
        
        const editedIndex = this.comments.findIndex(c => c.id === this.comment.id) 
        if (editedIndex !== -1) {
          this.comments[editedIndex].comment = this.newComment  
        }
        
        this.editing = false  

        }else{

          const response = await axios.post(`http://localhost:5000/post/${this.post.id}/comments`, this.comment, {
              headers: {
                Authorization: `Bearer ${this.token}`,
              },
            })  
          console.log('Comment sent successfully', response.data)
          
          this.comments.unshift(response.data) 
          console.log(this.comments)
        }

        this.newComment = ''
      } catch (error) {
        console.error('Error adding comment:', error)
      }
    },

    editComment(comment){
      this.newComment=comment.comment  
      this.comment.id=comment.id
      this.editing=true   
    },

    async deleteComment(commentId){
      try {
        await axios.delete(`http://localhost:5000/post/${this.post.id}/comments/${commentId}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })  

        this.comments = this.comments.filter(comment => comment.id !== commentId)  
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    },

    formatDate(timestamp) {
      const seconds = timestamp._seconds || 0
      const nanoseconds = timestamp._nanoseconds || 0
      const date = new Date(seconds * 1000 + nanoseconds / 1000000)  

      const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
      return date.toLocaleDateString('en-US', options)
    },
    changePage(page) {
      this.currentPage = page
    },
  },
};
</script>

<style scoped>

  #postdetails{
    background: linear-gradient(to bottom, #8f5b3a, #b79866);
  }

  #title{
    font-family: 'Dancing Script', cursive;
    font-size: 3em;
    color: #956f46;
    font-weight: bold;
    text-shadow: 0 2px 3px #a59084;
  }

  #subtitle{
    margin-top:1.5em;
    background-color: #956f46; 
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 1.5em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: fit-content;
  }
  #destination{
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
    font-style: italic;
    color: #f2dbb6;
    font-size: 1.5em;
    margin-bottom: 10px;
    margin-top: 25px;
    text-shadow: 0 2px 3px #af9b8f;
  }
  #author{
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
    font-style: italic;
    color: #e2c79a;
    font-size: 1.5em;
    text-shadow: 0 2px 3px #af9b8f;
  }
  #story{
    color: #f0d7ae;
    font-size: 1.5em;
    font-family: 'Dancing Script', cursive;
    background-color: #956f46; 
    padding: 2em;
    border-radius: 8px;
    margin-bottom: 1.5em;
    margin-top: 1.5em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    line-height: 1.8;
    letter-spacing: 2px;
  }
  #date{
    font-family: 'Quicksand', sans-serif;
    font-style: italic;
    color: #947748;
    font-size: 1.3em;
  }
.card-container {
  background-color: #f0d7ae;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}
.comments-container{
  background-color: #fdecd3;
  margin: 1.5em 2em;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.comment-container {
  background-color: burlywood;
  margin-left: 2em;
  margin-right: 2em;
  margin-bottom: 2em;
  margin-top: 2em;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s; 
}

.comment-container:hover {
  transform: scale(1.05); 
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); 
}

.comment-username {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  color: #4f3621; 
}
.comment-text {
  font-size: 14px;
  margin-top: 5px;
  font-family: 'Quicksand', sans-serif;
  color: #614c33; 
}

.comment-actions {
  margin-top: 10px;
}

.post-button, .edit-button, .delete-button, .reply-button {
  margin-right: 10px;
  background-color: #8B4513;
  color: #fff;
  transition: background-color 0.3s, color 0.3s;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}

.post-button:hover, .edit-button:hover, .delete-button:hover, .reply-button:hover {
  background-color: #D2B48C;
  color: #333;
}

.carousel-container {
  margin-bottom: 2.5em;
  
}

.carousel-background{
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.carousel-image {
  max-height: 380px; 
  width: auto;
  border: dashed 4px #5c3d24; 
  padding: 0.5 em;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.carousel-image:hover {
  transform: scale(1.2);
}

.ratingcard{
  background-color: #d4a373; 
  padding: 1.5em;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: auto;
}
.v-rating {
  padding: 1em;
  background-color: #ecc798 ;
  transition: background-color 0.3s;
  
  border-radius: 8px;
}

.v-rating:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  background-color: #ebcfa5;
}

.text-h2 {
  color: #8b4513;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  text-shadow: 0 1px 2px #a3907c;
}

.text-h5 {
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  color: #5c3d24;
  margin-bottom: 1em;
}

.v-progress-linear {
  background-color: #e7c69f !important;
}

.rating-values span {
  font-family: 'Quicksand', sans-serif;
  font-weight: bold;
  color: #4f3621;
}


.v-expansion-panel {
  background-color: #ebcfa5;
  border-radius: 8px;
  margin-top: 10px;
  font-family: 'Quicksand', sans-serif;
  color: #4b3621;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.v-expansion-panel-title {
  font-weight: bold;
  color: #8b4513;
  font-style: italic;
  font-family: 'Lucida Sans', sans-serif;
}

.v-expansion-panel-text {
  background-color: #fdf1dc;
  padding: 10px;
  border-radius: 0 0 8px 8px;
}

.replies {
  background-color: #fdf1dc !important; 
}

.v-pagination {
  background-color: #f0d7ae;
  padding: 10px;
  border-radius: 8px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
}

.v-pagination .v-btn {
  background-color: #a97c50 !important;
  color: white !important;
  transition: background-color 0.3s ease;
}

.v-pagination .v-btn:hover {
  background-color: #cba57b !important;
}
.ratinglist{
  flex-grow: 1;
}
</style>
