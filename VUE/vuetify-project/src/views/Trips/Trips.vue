<template>
  <v-container id="app" fluid>

    <v-row>
      <v-col cols="3">

        <v-card class="pa-4 journey-card">
  <v-card-title class="text-h6">📅 Journey Dates</v-card-title>

  <v-date-picker
    v-model="selectedDate"
    range
    color="primary"
    locale="ro-RO"
    class="compact-picker"
    @update:modelValue="updateHighlightedDates"
    
  ></v-date-picker>

  <v-row class="mt-1">
    <v-col>
      <v-text-field
        v-model="arrivalDate"
        label="Arrival Date"
        readonly
        dense
      ></v-text-field>
    </v-col>
    <v-col>
      <v-text-field
        v-model="departureDate"
        label="Departure Date"
        readonly
        dense
      ></v-text-field>
    </v-col>
  </v-row>
</v-card>


       
      </v-col>

      <v-col cols="6">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-card class="card-locations">
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
                <v-card class="card-locations">
                <v-card-title class="text-h6">🗺️ Points of interest</v-card-title>
                <v-card-text>
                  <ul>
                    <li v-for="(touristSpot, index) in touristSpots" :key="touristSpot" class="poi-item" >
                      <span>{{ touristSpot }}</span>
                      <v-icon 
                        color="red" 
                        small 
                        @click="removeTouristSpot(index)" 
                         class="cursor-pointer"
                      >
                        mdi-close
                      </v-icon>
                    </li>
                  </ul>
                </v-card-text>
                <v-btn @click="confirmTrip" class="d-flex flex-column justify-center ml-4"  color="primary">Confirm Trip</v-btn>
              </v-card>
              </v-col>
            </v-row>
            <div id="map-container">
              <div id="map"></div>

              <div
                v-if="loadingMap"
                id="map-loading">
                <v-progress-circular
                  :size="70"
                  :width="7"
                  color="primary"
                  indeterminate
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="3">
        <v-card 
        >
          <v-card-title
            class="text-h6 font-weight-bold d-flex align-center mb-2 trip-header"
          >
            📌 Your Planned Trips
          </v-card-title>

          <v-card-text>
            <div v-for="trip in trips" :key="trip.id" class="mb-4 trip-box" >
              <v-list-item  > 
                <v-list-item-content>
                 
                  <v-list-item-title class="trip-title">
                    ✈️ {{ trip.city }}, {{ trip.country }}
                  </v-list-item-title>

               
                  <v-list-item-subtitle class="mt-1 trip-dates">
                    🗓️ {{ formatDate(trip.arrivalDate) }} → {{ formatDate(trip.departureDate) }}
                  </v-list-item-subtitle>

                  <v-list-item-subtitle
                    class="mt-2 text-body-2 trip-details">
                    🏛️ <strong>Points of interest:</strong>
                    <br>
                    {{ trip.touristSpots.join(', ') }}
                  </v-list-item-subtitle>

                  <div v-if="hasTripPassed(trip.arrivalDate)" class="mt-2 text-grey font-italic">
                    🌟 How was your journey? Hope you made some beautiful memories! 📸
                  </div>
                  <div v-else-if="daysUntil(trip.departureDate) < 10" class="mt-2 text-pink font-italic">
                    🔜 Only {{ daysUntil(trip.departureDate) }} day<span v-if="daysUntil(trip.departureDate) !== 1">s</span> left! Get ready! 🎒
                  </div>

                </v-list-item-content>

                <v-list-item-action  v-if="!hasTripPassed(trip.departureDate)" class="d-flex flex-column justify-center ml-4">
                  <v-btn small color="primary" @click="editTrip(trip)" class="mb-2">✏️ Edit</v-btn>
                  <v-btn small color="error" @click="deleteTrip(trip)">🗑️ Delete</v-btn>
                </v-list-item-action>
              </v-list-item>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
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
      loadingMap: false,
      token:'',
      markers: null,
      selectedCity: '', 
      selectedCountry:'',
       countries:[],
      cities: [],
      touristSpots: [],
      spots: [],
      arrivalDate: null, 
      selectedDate:null, 
      departureDate: null,
      highlightedDates: [],
      selectingArrival: false,
      trips: [],
      trip:{},
      isEditing: true,
    };
  },
  mounted() {
    this.token = localStorage.getItem('token');
    this.getFavoriteDestinations();
    this.initializeMap();
    this.getTrips();
  },
  methods: {
      formatDate(date) {
      const d = new Date(date);
      return d.toLocaleDateString('en-EN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    isTripOlderThan15Days(date) {
    const today = new Date();
    console.log(date)
    const departure = new Date(date);
    const diffInTime = today - departure;
    const diffInDays = Math.max(0, Math.ceil(diffInTime / (1000 * 60 * 60 * 24))) 
    console.log(diffInTime)
    return diffInDays > 15;
  },
    daysUntil(date) {
      const today = new Date();
      const departure = new Date(date);
      const diffTime = departure - today;
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    },
    hasTripPassed(date) {
      const today = new Date();
      const departure = new Date(date);
      return departure.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);
    },

    editTrip(trip) {
      this.isEditing = true;
      this.trip = { ...trip };
      this.selectedCity = trip.city;
      this.selectedCountry = trip.country;
      this.arrivalDate = trip.arrivalDate;
      this.departureDate = trip.departureDate;
      this.selectedDate = this.getDatesInRange(new Date(trip.arrivalDate),
      new Date(trip.departureDate));

      this.touristSpots = [...trip.touristSpots];

      this.updateMap();
    },
    
    async deleteTrip(trip) {
      if (!confirm("Are you sure you want to delete this trip?")) return;

      try {
        const response = await axios.delete(`http://localhost:5000/trips/${trip.id}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (response.status === 200) {
          
          this.trips = this.trips.filter(t => t.id !== trip.id);
          alert("Trip deleted successfully.");
        }
      } catch (error) {
        console.error("Error deleting trip:", error);
        alert("Failed to delete the trip. Please try again.");
      }
    },

    async getTrips(){
      const response = await axios.get('http://localhost:5000/trips', {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      });
      console.log(response.data.trips);

      const futureTrips = response.data.trips.filter(trip => new Date(trip.departureDate) > new Date());
  const pastTrips = response.data.trips.filter(trip => new Date(trip.departureDate) <= new Date());

  const sortedFutureTrips = futureTrips.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  const sortedPastTrips = pastTrips.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

  this.trips = [...sortedFutureTrips, ...sortedPastTrips];
    },

    async confirmTrip() {
      if (
        !this.arrivalDate ||
        !this.departureDate ||
        !this.selectedCity ||
        !this.selectedCountry ||
        this.touristSpots.length === 0
      ) {
        alert('Please fill in all required fields.');
        return;
      }

      const tripData = {
        arrivalDate: this.arrivalDate,
        departureDate: this.departureDate,
        city: this.selectedCity,
        country: this.selectedCountry,
        touristSpots: this.touristSpots,
      };

      try {
        let response;

        if (this.isEditing && this.trip?.id) {
          console.log(this.trip)
          response = await axios.put(
            `http://localhost:5000/trips/${this.trip.id}`,
            tripData,
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
              },
            }
          );

          if (response.status === 200) {
            alert('Trip updated successfully!');
            const index = this.trips.findIndex((t) => t.id === this.trip.id);
            if (index !== -1) {
              this.trips[index] = { ...tripData, id: this.trip.id };
            }

            this.isEditing = false;
          }
        } else {
          response = await axios.post(
            `http://localhost:5000/trips`,
            tripData,
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
              },
            }
          );

          if (response.status === 201 && response.data.tripId) {
            alert('Trip confirmed successfully! Bon voyage!');

            tripData.id = response.data.tripId;
            this.trips.push(tripData);
          }
        }

        this.arrivalDate = null;
        this.departureDate = null;
        this.selectedDate = null;
        this.selectedCity = '';
        this.selectedCountry = '';
        this.touristSpots = [];
        this.markers.clearLayers();
        this.trip = {};
      } catch (error) {
        console.error('There was an error!', error);
      }
    },


    updateHighlightedDates(newDate) {
    if (!this.arrivalDate) {
      this.arrivalDate = newDate; 
      this.selectingArrival = true; 
    } else {
      if (this.selectingArrival) {
        this.departureDate = newDate; 
        this.selectingArrival = false;
      } else {
      
        this.arrivalDate = newDate; 
        this.departureDate = null; 
        this.selectingArrival = true; 
      }
    }

    this.highlightedDates = this.getDatesInRange(this.arrivalDate, this.departureDate);
    if(this.highlightedDates.length >0 ){
     this.selectedDate = this.highlightedDates
    }
    
    
  },
  getDatesInRange(startDate, endDate) {
    console.log(startDate, endDate)
    let dates = [];
    let currentDate = new Date(startDate);
    if (startDate && endDate) {
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        
      }
    }
    return dates;

  },
    async getFavoriteDestinations() {
    try {
      const response = await axios.get('http://localhost:5000/user/favorites', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })  

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
          const touristSpotName = button.getAttribute('data-name');
          if (!this.touristSpots.includes(touristSpotName)) {
            this.touristSpots.push(touristSpotName); 
          }
          console.log("Selected touristSpots:", this.touristSpots); 
        });
      }
});
    },
    async updateMap() {
  console.log("Selected City:", this.selectedCity);
  const country = this.countries.find(countryObj => 
      countryObj.cities.includes(this.selectedCity)
    )?.name; 
    this.selectedCountry = country || '';
    console.log(this.selectedCountry)
  this.markers.clearLayers();

  if (this.selectedCity) {
    try {
      this.loadingMap = true; 

      const { lat, lon } = await this.getCoordinates(this.selectedCity);
      this.map.setView([lat, lon], 12);

      const spots = await this.fetchTouristSpots(lat, lon);

      const markerPromises = spots.map(async (spot) => {
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

        const popupContent = `
          <div>
            <strong>${name}</strong>
            <br>
            <button class="add-to-list" data-name="${name}">+</button>
          </div>
        `;
        marker.bindPopup(popupContent);

        this.markers.addLayer(marker);
      });

      await Promise.all(markerPromises);
      
    } catch (error) {
      console.error("Error updating map:", error);
    } finally {
      this.loadingMap = false;
    }
  }
},
 removeTouristSpot(index) {
  this.touristSpots.splice(index, 1)
}
  }
};
</script>

<style scoped>
#app{
  background-color: #eef7ff;
}
#map {
  width: 100%;
  height: 100%;
  margin-top: 1em;
}
.v-card-title,
.v-subheader,
.v-list-item-title {
  font-family: 'Handlee', cursive;
  color: #5e3c00;
}

.v-list-item-subtitle {
  font-family: 'Handlee', cursive;
  color: #6b4c1e;
}

.v-card {
  color: #4b3b2a;
  background: linear-gradient(to bottom, #f0dabc , #8f5b3a);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-locations{
  background: linear-gradient(to right, #eef7ff, #f0e3d2);
  padding: 0.5em;
}

.v-btn {
  font-family: 'Handlee', cursive;
}

.v-card-title.font-weight-bold {
  color: #4e342e;
}

.trip-box {
  background-color: #f0e3d2;
  padding: 16px;
  border: 2px dotted #90caf9;
  border-radius: 12px;
}

.text-grey {
  color: #7d6e6e !important;
  font-family: 'Pacifico', cursive;
}

.text-pink {
  color: #d81b60 !important;
  font-family: 'Pacifico', cursive;
} 

.journey-card {
  max-width: 400px;
}

.poi-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#map-container {
  position: relative;
  height: 60vh;
}

#map-loading {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.trip-title {
  font-family: 'Pacifico', cursive;
  font-size: 20px;
  color: #1976D2;
}

.trip-dates {
  font-size: 16px;
}

.trip-details {
  font-size: 15px;
  line-height: 1.6;
}

.trip-header {
  font-size: 20px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>