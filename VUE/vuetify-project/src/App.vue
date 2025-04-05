<template>
  <v-app class="app">
    <v-app-bar app class="appBar">
      <v-toolbar-title class="title">Voyage Vault</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/" class="navBtn">
        <v-icon right>mdi-home</v-icon>Home
      </v-btn>
      <v-btn text to="/account" class="navBtn">
        <v-icon right>mdi-login</v-icon>Login
      </v-btn>
      <v-btn text to="/posts" class="navBtn">
        <v-icon right>mdi-file-image-marker</v-icon>Posts
      </v-btn>
      <v-btn text @click="goToProfileOrLogin" class="navBtn">
        <v-icon right>mdi-account-circle</v-icon>Profile
      </v-btn>
      
      <!-- Profile Button with Dropdown for Profile and Trips -->
      <!-- <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn text v-bind="props" class="navBtn">
            <v-icon right>mdi-account-circle</v-icon>Profile
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-for="(item, index) in profileItems" :key="index" @click="navigateTo(item.route)">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu> -->
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <!-- Footer -->
    <v-footer class="text-center d-flex flex-column ga-2 py-4 myfooter" color="rgb(134, 42, 42)">
      <p class="footer-text">
        Discover the joy of sharing your experiences! <br>
        Explore this vast and wonderful world and keep your stories locked in this vault.
      </p>

      <v-divider class="my-2" thickness="2" width="20"></v-divider>

      <!-- Linkuri principale -->
      <div class="footer-links">
        <router-link to="/" class="footer-link">Home</router-link>
        <span class="separator">|</span>
        <router-link to="/account" class="footer-link">Login</router-link>
        <span class="separator">|</span>
        <router-link to="/posts" class="footer-link">Posts</router-link>
        <!-- <span class="separator">|</span>
        <router-link to="/faq" class="footer-link">FAQ</router-link> -->
      </div>
      <!-- <div class="d-flex ga-3">
        <v-btn text to="/" class="footer-link">Home</v-btn>
        <v-btn text to="/account" class="footer-link">Login</v-btn>
        <v-btn text to="/posts" class="footer-link">Posts</v-btn>
        <v-btn text to="/faq" class="footer-link">FAQ</v-btn>
      </div> -->

      <v-divider></v-divider>

      <div>
        2025 &copy; <strong>Voyage Vault</strong>
      </div>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      userEmail: null,
      // profileItems: [
      //   { title: "Profile", route: "/profile" }, 
      //   { title: "Trips", route: "/trips" },
      // ],
    };
  },
  methods: {
    // navigateTo(route) {
    //   const token=localStorage.getItem("token")
    //   if(!token){
    //     this.$router.push("/account");
    //   }else{
    //     this.$router.push(route);
    //   }
      
    // },
    goToProfileOrLogin() {
      this.userEmail = localStorage.getItem("userEmail");
      if (this.userEmail) {
        this.$router.push("/profile");
      } else {
        this.$router.push("/account");
      }
    },
  },
};
</script>

<style scoped>
/* html, body {
  height: 100%; 
  margin: 0;
  padding: 0;
  overflow-x: hidden;
} */
.app {
  background: linear-gradient(to bottom, #f0dabc, #8f5b3a);
  /* min-height: 100%; 
  display: flex;
  flex-direction: column;
  justify-content: space-between;  */
 
}
/* v-main {
  margin: 0;
  padding: 0;
} */
.appBar {
  background-color: #b79866 !important;
}
.title {
  font-family: "Dancing Script", cursive;
  color: #fff;
  font-size: 22px;
}
.navBtn {
  color: #fff;
  font-family: "Quicksand", sans-serif;
  font-weight: bold;
}
.myfooter {
  position: relative;
  bottom: 0;
  width: 100%;
  background-color: #8f5b3a;
  color: #fff;
  text-align: center;
  padding: 1em 0;
}
.footer-text {
  color: #fff;
  font-size: 14px;
  font-family: "Quicksand", sans-serif;
}
.footer-link {
  color: #ece3e3;
  font-size: 14px;
  text-transform: none;
  font-family: "Quicksand", sans-serif;
}
</style>
