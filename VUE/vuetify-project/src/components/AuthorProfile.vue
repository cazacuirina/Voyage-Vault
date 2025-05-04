<template>
    <v-card class="author-profile">
      <v-row justify="center">
        <v-col cols="auto">
          <v-avatar size="80">
            <v-img :src="authorPhoto" alt="Profile Picture" v-if="authorPhoto" class="circle-image" />
            <v-icon v-else size="80">mdi-account-circle</v-icon>
          </v-avatar>
        </v-col>
        <v-col>
          <h2 class="author-name">{{ authorName }}</h2>
          <p class="followers">Followers: {{ followers }}</p>
          <p v-if="subscriptionPrice && subscriptionPrice !== 0">
          Subscription Price: ${{ subscriptionPrice }}
        </p>
        </v-col>
        <v-col cols="auto">
          <v-btn v-if="userEmail && userName !== authorName" :color="isFollowing ? 'red' : 'primary'" @click="handleFollow">
            {{ isFollowing ? 'Unfollow' : 'Follow' }}
          </v-btn>
          <v-icon
            v-if="userEmail && isPremium" 
            :color="isSubscribed ? 'green' : 'grey'"
            @click="handleSubscribe"
            class="cursor-pointer">
            {{ isSubscribed ? 'mdi-bell' : 'mdi-bell-off' }}
          </v-icon>

        </v-col>
      </v-row>

    <v-dialog v-model="showSubscriptionModal" max-width="400">
      <v-card>
        <v-card-title class="headline">Subscribe to {{ authorName }}</v-card-title>
        <v-card-text>
          <p><strong>Monthly Subscription:</strong> ${{ subscriptionPrice }}</p>
          <p><strong>Next Billing Date:</strong> {{ billingDate }}</p>
          <p>By subscribing, you will gain access to exclusive content from {{ authorName }}.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue" @click="subscribe">Proceed to Payment</v-btn>
          <v-btn text @click="showSubscriptionModal = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showUnfollowModal" max-width="400">
  <v-card>
    <v-card-title class="headline">Confirm Unfollow & Unsubscribe</v-card-title>
    <v-card-text>
      <p>Are you sure you want to unfollow and unsubscribe from {{ authorName }}?</p>
      <p>If you proceed, you will lose access to premium content and privileges associated with this subscription.</p>
      <p>This action cannot be undone.</p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="red" @click="confirmUnfollowAndUnsubscribe">Yes, Unfollow & Unsubscribe</v-btn>
      <v-btn text @click="showUnfollowModal = false">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    </v-card>

    
  </template>

<script>
import axios from "axios";

export default {
    props: ['authorName'],
  data() {
    return {
        userName: "", 
        userEmail:"",
        token:"",
      authorPhoto: '',
      followers: 0,
      isFollowing: false,
      isSubscribed: false,
      isPremium: false,
      subscriptionPrice: 0,
      showSubscriptionModal: false,
      showUnfollowModal: false,
    };
  },
  async created() {
    this.userName = localStorage.getItem('userName');
    this.userEmail = localStorage.getItem('userEmail');
    this.token = localStorage.getItem('token');
    console.log(this.token)
    await this.getAuthorPicture();
    await this.getAuthorFollows();
    if(this.token){
     await this.getIsFollowing(); 
    }
  },
  methods: {
   async handleFollow() {
  try {
    if (this.isFollowing) {
      this.showUnfollowModal = true;
    } else {
      await this.authorFollowUnfollow();
      
      if (this.subscriptionPrice && this.subscriptionPrice !== 0) {
        this.calculateBillingDate();
        this.showSubscriptionModal = true;
      }
    }
  } catch (error) {
    console.error("Error handling follow:", error);
  }
},

  async handleSubscribe() {
        if (!this.isSubscribed) {
          this.showSubscriptionModal = true;
        } else {
          this.showUnfollowModal = true;
        }
    },
    async subscribe() {
      try {
        const response = await axios.post(
          "http://localhost:3001/stripe/create-checkout-session",
          {
            authorName: this.authorName,
            price: this.subscriptionPrice,
          },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );

        this.showSubscriptionModal = false;

        window.location.href = response.data.url;

         localStorage.setItem("userEmail", this.userEmail);
        localStorage.setItem("userName", this.userName);
        localStorage.setItem("token", this.token);
      } catch (error) {
        console.error("Error creating Stripe session:", error);
      }
    },
    calculateBillingDate() {
      const today = new Date();
      today.setMonth(today.getMonth() + 1); 
      this.billingDate = today.toISOString().split("T")[0];
    },

    async confirmUnfollowAndUnsubscribe() {
      try {
        await Promise.all([this.authorFollowUnfollow(), this.unsubscribe()]);
        this.isSubscribed = false;
        this.showUnfollowModal = false;
        console.log("Unfollowed and unsubscribed successfully");
      } catch (error) {
        console.error("Error during unfollow and unsubscribe:", error);
      }
    },
  async unsubscribe() {
    try {
      await axios.put(
        `http://localhost:3001/user/${this.authorName}/unsubscribe`,
        { 
          
        },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      console.log("Unsubscribed successfully");
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  },

    async getAuthorPicture() {
      try {
        const response = await axios.get(`http://localhost:3001/user/${this.authorName}/profilePicture`); 
        
        if (response.data.profilePicture) {
            this.authorPhoto = `data:image/jpg;base64,${response.data.profilePicture}`;

          console.log('Profile picture retrieved successfully' , this.authorPhoto);
        }

      } catch (error) {
        console.error("Error fetching author details:", error);
      }
    },
    async getIsFollowing() {
      
      try {
        const response = await axios.get(`http://localhost:3001/user/${this.authorName}/following`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        console.log(response.data)
        this.isFollowing = response.data.isFollowing;
        this.isSubscribed = response.data.isSubscribed;
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    },
    async getAuthorFollows() {
    try {
      const response = await axios.get(`http://localhost:3001/user/${this.authorName}/followers`);
      this.followers = response.data.followers;
      if(this.followers>=1000){
        this.isPremium=true
      }
      this.subscriptionPrice = response.data.subscriptionPrice; 
    } catch (error) {
      console.error("Error fetching followers count:", error);
    }
  },
    async authorFollowUnfollow() {
      try {
        const response = await axios.put(`http://localhost:3001/user/${this.authorName}/follow`, 
      {}, 
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        }
      }
    ); 
        this.isFollowing = response.data.isFollowing;
        this.followers += this.isFollowing ? 1 : -1;
        
      } catch (error) {
        console.error("Error following/unfollowing user:", error);
      }
    },
  },
};
</script>

<style scoped>
.author-profile {
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
  background-color: #fbe3c4; /* Beige */
  border-radius: 12px;
}
.author-name {
  font-size: 22px;
  font-weight: bold;
}
.followers {
  font-size: 16px;
  color: #6d4c41; 
}
</style>