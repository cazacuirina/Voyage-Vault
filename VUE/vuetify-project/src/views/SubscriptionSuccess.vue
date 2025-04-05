<template>
    <v-container class="text-center mt-10">
      <v-card class="pa-6" elevation="5">
        <v-icon size="50" color="green">mdi-check-circle</v-icon>
        <h1 class="mt-4">Subscription Successful!</h1>
        <p class="mt-2 text-h5">Thank you, {{ userEmail }}, for subscribing to {{ authorName }}.</p>
        <p class="mt-2">You now have full access to premium content.</p>
        <v-btn class="mt-4" color="primary" @click="$router.push('/posts')">Go to Posts</v-btn>
      </v-card>
    </v-container>
  </template>
  
  <script>
  import axios from "axios";

  export default {
    //name: "SubscriptionSuccess",
    name: "SubscriptionSuccess",
    data() {
    return {
        userName: "", 
        userEmail:"",
        token:"",
      }
    },
    async created() {
    this.userName = localStorage.getItem('userName');
    this.userEmail = localStorage.getItem('userEmail');
    this.token = localStorage.getItem('token');

    if (this.userEmail && this.token && this.authorName) {
      await this.saveSubscription();
      await this.savePayment();
    }
    },
    computed: {
      // authorName() {
      //   return this.$route.query.authorName || "the author";
      // },
      // userEmail() {
      //   return this.$route.query.userEmail || "your account";
      // }
      authorName() {
        return decodeURIComponent(this.$route.query.authorName || "the author");
      },
      userEmail() {
        return decodeURIComponent(this.$route.query.userEmail || "your account");
      },
      price() {
        return parseFloat(decodeURIComponent(this.$route.query.price)) || 0;
      }
    },
    methods: {
      async saveSubscription() {
      try {
        console.log(this.authorName, this.userName)
        const response = await axios.put(
          `http://localhost:3001/users/${this.authorName}/subscribe`,
          {
            //authorName: this.authorName,

            //userEmail: this.userEmail,
           // userName: this.userName,
            //price: this.$route.query.price || 0, // Opțional, dacă vrei să salvezi prețul
            //type: "subscription",
          },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );

        console.log("Subscription saved:", response.data);
      } catch (error) {
        console.error("Error saving subscription:", error);
      }
    },
    async savePayment() {
    try {
      const paymentData = {
        //userName: this.userName,
        //userEmail: this.userEmail,
        authorName: this.authorName,
        amount: this.$route.query.price || 0, 
        isSubscription: true,
        //date: this.generateCustomTimestamp(),
      };

      await axios.post("http://localhost:3001/subscriber/payment", paymentData, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      console.log("Payment data saved successfully");
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  },
//   generateCustomTimestamp() {
//     const customDate = new Date();  // Data curentă
//     const seconds = Math.floor(customDate.getTime() / 1000);  // Secunde
//     const nanoseconds = (customDate.getMilliseconds() * 1000000);  // Nanosecunde

//     return {
//       _seconds: seconds,
//       _nanoseconds: nanoseconds,
//     };
// }

    }
  };
  </script>
  
  <style scoped>
  .text-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh;
  }
  </style>