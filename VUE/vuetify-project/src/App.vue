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
    
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-footer class="text-center d-flex flex-column ga-2 py-4 myfooter" color="rgb(134, 42, 42)">
      <p class="footer-text">
        Discover the joy of sharing your experiences! <br>
        Explore this vast and wonderful world and keep your stories locked in this vault.
      </p>

      <v-divider class="my-2" thickness="2" width="20"></v-divider>

    
      <div class="footer-links">
        <router-link to="/" class="footer-link">Home</router-link>
        <span class="separator">|</span>
        <router-link to="/account" class="footer-link">Login</router-link>
        <span class="separator">|</span>
        <router-link to="/posts" class="footer-link">Posts</router-link>
      
      </div>
     

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
      token: null,
    };
  },
  methods: {
    
    goToProfileOrLogin() {
      this.token = localStorage.getItem("token");
      if (this.token) {
        this.$router.push("/profile");
      } else {
        this.$router.push("/account");
      }
    },
  },
};
</script>

<style scoped>

.app {
  background: linear-gradient(to bottom, #f0dabc, #8f5b3a);
}

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
