<template>
  <v-container fluid>

    <v-row>
      <!-- Favorite Destinations (Left Sidebar) -->
      <v-col cols="3">

        <v-card class="pa-4" style="max-width: 400px;">
  <v-card-title class="text-h6">📅 Journey Dates</v-card-title>

  <!-- Date Picker -->
  <v-date-picker
    v-model="dates"
    range
    color="primary"
    locale="ro-RO"
    class="compact-picker"
  ></v-date-picker>

  <!-- Date Fields -->
  <v-row class="mt-1">
    <v-col>
      <v-text-field
        v-model="dates[0]"
        label="Data Plecare"
        readonly
        dense
      ></v-text-field>
    </v-col>
    <v-col>
      <v-text-field
        v-model="dates[1]"
        label="Data Sosire"
        readonly
        dense
      ></v-text-field>
    </v-col>
  </v-row>
</v-card>


       
      </v-col>

      <!-- Main Content Area -->
      <v-col cols="6">
        <v-card>
          <!-- <v-card-title class="text-h5 center">Interactive Map</v-card-title> -->
          <v-card-text>
            <!-- Calendar and Selected Objectives -->
            <v-row>
              <v-col cols="6">
                <v-card>
        <v-card-title class="text-h6">🌍 Your Favorite Destinations</v-card-title>
        <v-card-text>
          <div v-for="country in countries" :key="country.name">
            <v-subheader>{{ country.name }}</v-subheader>
            <v-radio-group v-model="selectedCity" @change="updateMap">
              <v-radio
                v-for="city in country.cities"
                :key="city"
                :label="city"
                :value="city"
                hide-details
              ></v-radio>
            </v-radio-group>
          </div>
        </v-card-text>
      </v-card>
              </v-col>
              <v-col cols="6">
                <v-card-title class="text-h6">🗺️ Points of interest</v-card-title>
                <v-card-text>
                  <ul>
                    <li v-for="objective in selectedObjectives" :key="objective">{{ objective }}</li>
                  </ul>
                </v-card-text>
                <v-btn @click="confirmTrip" color="primary">Confirm Trip</v-btn>
              </v-col>
            </v-row>
            <!-- Map -->
            <div id="map" style="height:60vh;"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Planned Trips (Right Sidebar) -->
      <v-col cols="3">
        <v-card>
          <v-card-title class="text-h6">📌 Your Planned Trips</v-card-title>
          <v-card-text>
            <div v-for="trip in plannedTrips" :key="trip.name">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{ trip.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ trip.date }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-btn small @click="editTrip(trip)">Edit</v-btn>
                <v-btn small color="error" @click="deleteTrip(trip)">Delete</v-btn>
              </v-list-item>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
import { ref } from 'vue';
import axios from 'axios';
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import "leaflet.markercluster";
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default {
  data() {
    return {
      map: null,
      token:'',
      markers: null,
      selectedCity: '', // Checkbox-ul cu orașele
       //loadedCities: {} ,
       countries:[],
      cities: [],
      selectedObjectives: [],
      spots: [],
      dates: [new Date('2025-06-01'), new Date('2025-06-10')], 
    };
  },
  mounted() {
    this.token = localStorage.getItem('token');
    this.getFavoriteDestinations();
    this.initializeMap();
  },
  methods: {
    async getFavoriteDestinations() {
    try {
      const response = await axios.get('http://localhost:3001/user/favorites', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })  // get user favorite destinations

        console.log(response.data.travelList)
        const favorites=response.data.travelList

        const countryMap = {};
        favorites.forEach(({ city, country }) => {
          if (!countryMap[country]) {
            countryMap[country] = [];
          }
          countryMap[country].push(city);
        });
        console.log(countryMap)
        
        // Transformăm într-un format ușor de utilizat
        this.countries = Object.keys(countryMap).map(name => ({
          name,
          cities: countryMap[name]
        }));
      
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  },
    async getCoordinates(cityName) {
      const apiKey = import.meta.env.VITE_TRAVEL_API_KEY;
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(cityName)}&apiKey=${apiKey}`;
      console.log(url)

      try {
        const response = await axios.get(url);
        const data = response.data;
        if (data.features && data.features.length > 0) {
          const { lat, lon } = data.features[0].properties;
          return { lat, lon };
        } else {
          throw new Error("Locația nu a fost găsită");
        }
      } catch (error) {
        console.error("Eroare la obținerea coordonatelor:", error);
      }
    },
    async fetchTouristSpots(lat, lon) {
      const apiKey = import.meta.env.VITE_TRAVEL_API_KEY;
      const url = `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lon},${lat},5000&limit=15&apiKey=${apiKey}`;

      try {
        const response = await axios.get(url);
        return response.data.features;
      } catch (error) {
        console.error("Eroare la obținerea obiectivelor turistice:", error);
        return [];
      }
    },
    initializeMap() {
      this.map = L.map('map').setView([44.4268, 26.1025], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      this.markers = L.markerClusterGroup();
      this.map.addLayer(this.markers);

      this.map.on('popupopen', (event) => {
      const button = event.popup.getElement().querySelector('.add-to-list');
      if (button) {
        button.addEventListener('click', () => {
          const objectiveName = button.getAttribute('data-name');
          if (!this.selectedObjectives.includes(objectiveName)) {
            this.selectedObjectives.push(objectiveName); // Add the name to the list
          }
          console.log("Selected objectives:", this.selectedObjectives); // Debugging log
        });
      }
});
    },
    async updateMap() {
  console.log("Selected City:", this.selectedCity);

  // Clear existing markers before adding new ones
  this.markers.clearLayers();

  if (this.selectedCity) {
    try {
      // Get coordinates for the selected city
      const { lat, lon } = await this.getCoordinates(this.selectedCity);
      this.map.setView([lat, lon], 12); 

      // Fetch tourist spots near the city
      const spots = await this.fetchTouristSpots(lat, lon);

      // Add markers for each spot
      spots.forEach(spot => {
        const [longitude, latitude] = spot.geometry.coordinates;
        const name = spot.properties.name || 'Unknown';
        const marker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        });

        // Set up popup with the tourist spot name and a button to add it to the list
        const popupContent = `
          <div>
            <strong>${name}</strong>
            <br>
            <button class="add-to-list" data-name="${name}">+</button>
          </div>
        `;
        marker.bindPopup(popupContent);

        // Add marker to the cluster group
        this.markers.addLayer(marker);
      });
    } catch (error) {
      console.error("Error updating map:", error);
    }
  }
},
  }
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}


</style>