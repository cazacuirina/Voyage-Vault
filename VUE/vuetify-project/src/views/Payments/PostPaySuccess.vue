<template>
    <v-container class="text-center mt-10">
      <v-card class="pa-6" elevation="5">
        <v-icon size="50" color="green">mdi-check-circle</v-icon>
        <h1 class="mt-4">Post Purchase Successful!</h1>
        <p class="mt-2 text-h5">Thank you, {{ userEmail }}, for purchasing the post titled "{{ postTitle }}" by {{ authorName }}.</p>
        <p class="mt-2">You have successfully gained access to this premium content.</p>
        <p class="mt-2">Price: ${{ price.toFixed(2) }}</p>
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
    };
  },
  async created() {
    this.userName = localStorage.getItem('userName');
    this.userEmail = localStorage.getItem('userEmail');
    this.token = localStorage.getItem('token');

    if (this.userEmail && this.token && this.postTitle && this.authorName) {
      await this.savePostAccess(); 
      await this.savePostPayment();
    }
  },
  computed: {
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
      this.$router.push({ name: 'PostDetails', params: { postTitle: this.postTitle } });
    },
    async savePostPayment() {
      try {
        const response = await axios.post(
          "http://localhost:3001/payments/post", 
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
          console.log('Post payment saved successfully');
        }
      } catch (error) {
        console.error("Error saving post payment:", error);
      }
    },
    async savePostAccess() {
    try {
      const response = await axios.put(
        `http://localhost:3001/post/${this.postTitle}/access`, 
        {},
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

<style scoped>
.v-container {
  background: linear-gradient(to bottom right, #fff3e0, #ffe0b2);
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.v-card {
  background-color: #ffffff;
  border-radius: 16px;
  color: #4e342e; 
  max-width: 600px;
  margin: auto;
}

h1 {
  color: #388e3c; 
  font-size: 28px;
  font-weight: bold;
}

.text-h5 {
  font-size: 18px;
  color: #5d4037;
}

.v-btn {
  font-weight: 600;
  border-radius: 24px;
}
</style>
  