<template>
    <v-container class="text-center mt-10">
      <v-card class="pa-6" elevation="5">
        <v-icon size="50" color="green">mdi-check-circle</v-icon>
        <h1 class="mt-4">Post Purchase Successful!</h1>
        <p class="mt-2 text-h5">Thank you, {{ userEmail }}, for purchasing the post titled "{{ postTitle }}" by {{ authorName }}.</p>
        <p class="mt-2">You have successfully gained access to this premium content.</p>
        <p class="mt-2">Price: ${{ price.toFixed(2) }}</p>
        <!-- <v-btn class="mt-4" color="primary" @click="$router.push('/posts')">Go to Posts</v-btn> -->
        <v-btn class="mt-4" color="primary" @click="goToPostDetails">Go to Post Details</v-btn>
      </v-card>
    </v-container>
  </template>

<script>
import axios from "axios";

export default {
  name: "PostPaymentSuccess",
  data() {
    return {
      userName: "", 
      userEmail: "",
      token: "",
      // postTitle: "",
      // authorName: "",
      // price: 0,
    };
  },
  async created() {
    this.userName = localStorage.getItem('userName');
    this.userEmail = localStorage.getItem('userEmail');
    this.token = localStorage.getItem('token');

    // this.postTitle = this.$route.query.postTitle || "Unknown Post Title";
    // this.authorName = this.$route.query.authorName || "Unknown Author";
    // this.price = parseFloat(this.$route.query.price) || 0;

    // console.log(this.userEmail , this.token , this.postTitle , this.authorName)
    // Optionally, you can make an API call here to update the user's access to the post.
    if (this.userEmail && this.token && this.postTitle && this.authorName) {
      // You can call the backend to update the purchase status or send any additional data.
      //await this.savePostPayment();
      await this.savePostAccess(); //la postare camp BoughtBy sa adaug userName
    }
  },
  computed: {
    // You can access these values directly via $route.query
    postTitle() {
      return decodeURIComponent(this.$route.query.postTitle || "Unknown Post Title");
    },
    authorName() {
      return decodeURIComponent(this.$route.query.authorName || "Unknown Author");
    },
    price() {
      return parseFloat(decodeURIComponent(this.$route.query.price)) || 0;
    },
  },
  methods: {
    goToPostDetails() {
      // Navighează către pagina detaliată a postării după ce plata este completă
      this.$router.push({ name: 'PostDetails', params: { postTitle: this.postTitle } });
    },
    async savePostPayment() {
      try {
        console.log("AICI")
        // Example of an API request to save the purchase information to the backend
        const response = await axios.post(
          "http://localhost:3001/post/payment",  // Replace with the appropriate API endpoint
          {
            postTitle: this.postTitle,
            price: this.price,
            authorName: this.authorName,
          },
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          }
        );

        if (response.data.success) {
          // Payment info saved successfully (optional)
          console.log('Post payment saved successfully');
        }
      } catch (error) {
        console.error("Error saving post payment:", error);
      }
    },
    async savePostAccess() {
    try {
      const response = await axios.put(
        `http://localhost:3001/post/${this.postTitle}/access`,  // Backend endpoint
        {
          // postTitle: this.postTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (response.data.success) {
        console.log("Access to post saved successfully.");
      }
    } catch (error) {
      console.error("Error saving post access:", error);
    }
  },
  },
  
};
</script>
  