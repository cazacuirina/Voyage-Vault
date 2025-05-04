<template> 
  <v-app class="app">
    <div>
      <v-row class="d-flex justify-center mb-4">
        <v-col>
          <h1 class="text-center main-title">Discover. Document. Inspire.</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-img v-if="!isAuthenticated" src="../assets/blogcover.jpg" class="cover-image" contain></v-img>
        </v-col>
      </v-row>


      <div v-if="isAuthenticated" class="d-flex justify-center mt-4 card-container">
        <v-card v-for="btn in buttons" :key="btn.text" class="menu-card" @click="btn.action">
          <v-img :src="btn.icon" class="card-icon"></v-img>
          <h3>{{ btn.text }}</h3>
        </v-card>
      </div>

      <v-container v-if="showFavorites" id="containerFavs" class="d-flex flex-column align-center">
        <FavoriteList />
      </v-container>
      <v-container v-if="showNewContent" id="containerContent" class="d-flex flex-column align-center">
        <NewContent />
      </v-container>
    </div>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
import FavoriteList from '../components/FavoriteList.vue';
import NewContent from '../components/NewContent.vue';
import axios from 'axios';

export default {
  components: { FavoriteList, NewContent },
  data() {
    return {
      showFavorites: false,
      showNewContent: false,
      userName: null,
      userEmail: null,
      token: null,
      buttons: [
        { text: 'Favorite Posts', icon: 'https://img.icons8.com/?size=100&id=duv8QA21E0FA&format=png&color=000000', action: () => this.toggleFavorites() },
        { text: 'Planned Trips', icon: 'https://img.icons8.com/?size=100&id=tRqKljzS2Fww&format=png&color=000000', action: () => this.navigateToTrips() },
        { text: 'New Content', icon: 'https://img.icons8.com/?size=100&id=55004&format=png&color=000000', action: () => this.toggleNewContent() }
      ]
    }
  },
  mounted() {
    if(localStorage.getItem('userEmail')) {
      this.userEmail = localStorage.getItem('userEmail');
      this.userName = localStorage.getItem('userName');
      this.token = localStorage.getItem('token');
    }
  },
  computed: {
    isAuthenticated() {
      return !!this.token;
    },
  },
  methods: {
   expandButtons(containerName, shouldExpand){
    const cardContainer = document.querySelector('.card-container');
    const favContainer = document.querySelector(containerName);
    
    if (shouldExpand) {
      cardContainer.classList.add('shrink');
      favContainer.classList.add('expanded');
    } else {
      cardContainer.classList.remove('shrink');
    }
    console.log('containerName:', containerName, 'element:', favContainer, 'has class expanded?', favContainer?.classList.contains('expanded'));

   },

    toggleFavorites() {
      this.showFavorites = !this.showFavorites;
      if(this.showNewContent){
        this.showNewContent=false
      }
      this.$nextTick(() => {
        this.expandButtons("#containerFavs", this.showFavorites);
      });
    
    },

    toggleNewContent() {
      this.showNewContent = !this.showNewContent;
      if(this.showFavorites){
        this.showFavorites=false
      }
      this.$nextTick(() => {
        this.expandButtons("#containerContent", this.showNewContent);
      });
    
    },

    navigateToTrips() {
      this.$router.push('/trips');
    }
  }
}
</script>

<style scoped>

.app {
  background: linear-gradient(to bottom, #f0dabc , #8f5b3a);
  min-height: 100%; 
  display: flex;
  flex-direction: column;
  justify-content: space-between; 
  overflow: hidden;
}
.card-container {
  display: flex;
  justify-content: center;
  padding-top: 3em;
  transition: all 0.3s ease; 
}

.card-container.shrink {
  transform: translateY(-5em);
  gap: 1em; 
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 1em;
  padding: 2em;
  text-align: center;
  width: 250px;
  height: 250px;
  border: dashed 4px #b79866;
  background-color: #f5f1eb;
  font-family: 'Quicksand', sans-serif;
  font-weight: bold;
  color: #683312;
  border: #683312 dashed 5px;
  transition: all 0.3s ease; 
}

.menu-card.shrink {
  width: 75px;
  height: 75px;
}


.card-icon {
  width: 100px; 
  height: 100px;
  margin-bottom: 0.5em;
}
#containerFavs,  #containerContent{
  height: 20em; 
  width: 60em;
  margin-top: -3em; 
  transition: all 0.3s ease; 
}

#containerFavs.expanded , #containerContent.expanded{
  height: auto; 
  width: 100%; 
  margin-top: -5em; 
}

.main-title {
  margin-top: 1em;
  font-family: 'Quicksand', sans-serif;
  font-style: italic;
  font-size: 32px;
  color: #b79866;
  text-shadow: 0 2px 3px #af9b8f;
}
.cover-image {
  display: block; 
  margin: 1em auto; 
  box-shadow: 0px 0px 20px 16px rgba(17, 17, 26, 0.18);
  border: #683312 dashed 5px;
  width: 50%;
  height: auto; 
}

</style>