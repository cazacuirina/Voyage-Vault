<template>
  <v-app class="app">
    <v-app-bar app class="appBar">
      <v-toolbar-title class="title">Voyage Vault</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/posts" class="navBtn">
        <v-icon right>mdi-file-image-marker</v-icon>See Posts
      </v-btn>
      <v-btn text to="/account" class="navBtn">
        <v-icon right>mdi-account</v-icon>Get into account
      </v-btn>
    </v-app-bar>

    <v-row class="d-flex justify-center mb-4">
      <v-col>
        <h1 class="text-center main-title">Discover. Document. Inspire. </h1>
      </v-col>
    </v-row>
    <v-img src="../assets/blogcover.jpg" class="cover-image" contain></v-img>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
</script>

<style scoped>

.app{
  background: linear-gradient(to bottom, #f0dabc , #8f5b3a);
}
.appBar {
  background-color: #b79866 !important;
}

.title {
  font-family: 'Dancing Script', cursive;
  color: #fff;
  font-size: 22px;
}
.navBtn {
  color: #fff; 
  font-family: 'Quicksand', sans-serif;
  font-weight: bold;
}

.main-title {
  margin-top: 3em;
  font-family: 'Quicksand', sans-serif;
  font-style: italic;
  font-size: 32px;
  color: #b79866; 
  text-shadow: 0 2px 3px #af9b8f;
}
.cover-image {
  margin-top: 0.5em;
  box-shadow: 0px 0px 20px 16px rgba(17, 17, 26, 0.18);
}

</style>