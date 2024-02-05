<template>
  <v-app id="favContainer">
    <v-container>
      <v-row>
        <h2 class="text-center favHeading" v-if="!loadingFavorites && favoriteList.length === 0">
          No favorites saved yet. Go explore our posts!
        </h2>

        <v-col>
          <v-virtual-scroll :items="favoriteList" v-slot="{ item: favorite, index }" height="270">
            <v-stepper vertical>
              <v-stepper-step :complete="index < currentStep">
                <v-stepper-content>
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title class="destinationCardTitle" @click="fetchDetails(index)">
                        {{ favorite.city }} - {{ favorite.country }}
                      </v-expansion-panel-title>

                      <v-expansion-panel-text class="destinationCardText">
                        <v-card class="destinationCard">
                          <v-card-text>
                            <div v-if="favorite.details">
                              <div class="favTitle"><b>Title:</b> {{ favorite.details.title }}</div>
                              <div class="favStory"><b>Description:</b> {{ favorite.details.description }}</div>
                              <div class="favLikes"> <v-icon>mdi-heart</v-icon>{{ favorite.details.likes }}</div>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-stepper-content>
              </v-stepper-step>
            </v-stepper>
          </v-virtual-scroll>

          <v-row>
            <v-col>
              <v-alert type="info" variant="tonal" v-if="loadingFavorites" class="loadingAlert">
                Loading favorites...
              </v-alert>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      favoriteList: [],
      currentStep: 0,
      loadingFavorites: true,
    };
  },
  mounted() {
    this.getFavoriteList()
  },
  methods: {
    async getFavoriteList() {
      try {
        const response = await axios.get('http://localhost:3001/user/favorites', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })  // get user favorite destinations

        this.favoriteList = response.data.travelList.sort((a, b) => {
        const compareCountry = a.country.localeCompare(b.country)  //sort alphabetically by country
        if (compareCountry !== 0) {
          return compareCountry
        }
        return a.city.localeCompare(b.city) //same country -> sort by city
      })

      } catch (error) {
        console.error('Error fetching favoriteList ', error)
      } finally {
        setTimeout(() => {
          this.loadingFavorites = false  // wait for user favorites to be retrieved
        }, 1000)
      }
    },
    async fetchDetails(index) {
      const favorite = this.favoriteList[index]  // select psot
      console.log(favorite)
      try {
        const response = await axios.get(`http://localhost:3001/post/${favorite.postId}/details`)  // get details
        this.favoriteList[index].details = response.data   // update favorite list

      } catch (error) {
        console.error('Error fetching details:', error)
      }
    },
  },
};
</script>
  
  <style scoped>
  #favContainer{
    height: 18em;
    background-color: #683312;
  }
  
  .favHeading {
    color: beige;
    font-family: 'Quicksand', sans-serif;
    font-size: 25px; 
    text-align: center; 
    display: flex;
    align-items: center; 
    justify-content: center; 
    height: 11em;
    width: 23em;
    margin: 0;
  }
 
  .destinationCard {
    background: linear-gradient(to bottom, #b79866 , #f0eae1);
    padding: 10px;
  }

  .loadingAlert {
  background-color: brown;
  margin-top: 15px;
  padding: 10px;
  border: 1px solid brown;
}

.destinationCardTitle {
  color: #683312;
    font-family: 'Quicksand', sans-serif;
    background: linear-gradient(to bottom, #e2ceae , #f0eae1);
    font-weight: bold;
    font-size: 20px;
  }

  .destinationCardText {
    padding: 10px;
    color: #683312;
    font-family: 'Arial', sans-serif;
    font-size: 16px;
  }

  .favTitle {
    font-family: 'Dancing Script', cursive;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .favStory{
    font-size: 14px;
    margin-bottom: 5px;
  }

  .favLikes {
    font-size: 14px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  </style>
  