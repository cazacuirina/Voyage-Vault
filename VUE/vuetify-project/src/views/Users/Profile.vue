 <template>
    <v-navigation-drawer
      v-model="drawer"
      :rail="mini"
      permanent
      width="300"
      class="pt-4"
    >

    <div
  class="d-flex justify-center"
  :style="{ width: mini ? '55px' : '100%', transition: 'width 0.3s' }"
>
  <v-avatar
    :size="mini ? 55 : 90"
    class="my-2"
    :class="{ mini: mini }"
    :style="{ transition: 'all 0.3s ease', minWidth: mini ? '55px' : '90px' }"
  >
    <v-img v-if="userPhoto" :src="userPhoto" />
    <v-icon v-else color="#683312" :size="mini ? 36 : 48">mdi-account</v-icon>
  </v-avatar>
</div>
    
      <div class="d-flex flex-column align-center">
        
        <div class="d-flex" >
          <v-btn v-show="!mini" icon @click="uploadPhoto" class="upload-photo">
            <v-icon>{{ userPhoto ? 'mdi-pencil' : 'mdi-camera' }}</v-icon>
          </v-btn>
          <v-btn v-if="selectedFile" icon color="green" @click="sendPhoto">
            <v-icon>mdi-check</v-icon>
          </v-btn>
        </div>
  
        <input
          type="file"
          ref="fileInput"
          @change="onFileChange"
          accept="image/*"
          class="hidden-input"
        />
  
        <v-list-item-title class="mt-2 text-center" v-show="!mini">
          {{ userName }}
        </v-list-item-title>
        <v-btn
          icon
          @click.stop="mini = !mini"
          class="mt-2"
          variant="text"
        >
          <v-icon>{{ mini ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
        </v-btn>
      </div>
  
      <v-divider class="my-3"></v-divider>
  
      <div class="px-4">
        <div class="d-flex align-center mb-2">
          <span class="mr-2">👥</span>
          <span v-show="!mini">Followers: {{ followers }}</span>
        </div>
  
        <div class="d-flex align-center mb-2">
          <span class="mr-2">💼</span>
          <span v-show="!mini">Status: {{ isPremium ? 'Premium' : 'Normal' }}</span>
        </div>
      </div>
  
      <div class="px-4" v-show="!mini">
     
        <v-alert
          v-if="!isPremium"
          type="info"
          density="compact"
          class="mt-2"
          outlined
        >
          Get 1000 followers to unlock premium.
        </v-alert>
  
        <v-card v-if="isPremium" class="subscription-box mt-2 pa-2">
          <v-text-field
            v-model="subscriptionPrice"
            label="Subscription $"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-btn block @click="saveSubscriptionPrice" class="save-btn font-weight-bold">Save</v-btn>
        </v-card>
      </div>
  
      <v-divider class="my-4" v-show="!mini"></v-divider>
  
      <v-list dense>
        <v-list-item @click="$router.push('/trips')" link>
          <v-list-item-icon><v-icon>mdi-map-marker</v-icon></v-list-item-icon>
          <v-list-item-title v-show="!mini">Trips</v-list-item-title>
        </v-list-item>
  
        <v-list-item @click="logout" link>
          <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
          <v-list-item-title v-show="!mini">Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-container v-if="isPremium" class="charts" fluid dense >
  <v-row dense>
    <v-col cols="12" md="6">
      <v-card class="mx-2 my-2 pa-2 chart">
        <v-card-title class="subtitle-2">Follower types distribution</v-card-title>
        <ApexCharts  
          type="pie" 
          :options="pieChartOptions" 
          :series="pieSeries"
          width="100%"
          height="260"
        />
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card class="mx-2 my-2 pa-2 chart">
        <v-card-title class="subtitle-2">Post popularity by Likes and Rating</v-card-title>
        <ApexCharts 
          type="bar"
          :options="barChartOptions"
          :series="barChartSeries"
          width="100%"
          height="260"
        />
      </v-card>
    </v-col>
  </v-row>

  <v-row dense>
    <v-col cols="12">
      <v-card class="mx-2 my-2 pa-2 chart">
        <v-card-title class="subtitle-2">Monthly Income vs Spendings</v-card-title>
        <ApexCharts 
          type="line" 
          :options="lineChartOptions" 
          :series="lineChartSeries"
          width="100%"
          height="260"
        />
      </v-card>
    </v-col>
  </v-row>
</v-container>
<v-container v-else class="pa-0 ma-0 noncharts">
  <v-card class="mx-2 pa-4 text-center premium-info" elevation="1">
    <v-card-text>
      <strong>Premium users</strong> can view detailed charts and statistics about their followers, posts, and income.  
      <br /><br />
      <span class="text-grey">Gain popularity and reach 1000 followers to unlock premium features!</span>
    </v-card-text>
  </v-card>
</v-container>
  </template>
  
  
  <script>
  import axios from 'axios'
  import VueApexCharts from "vue3-apexcharts";
  
  export default {
    components: {
      ApexCharts: VueApexCharts,
    },

    name: 'Profile',
    data() {
  return {
    drawer: true,
    mini: false,
    userName: "", 
    userEmail: "",
    token: "",
    userPhoto: '',
    selectedFile: null,
    followers: 0,
    subscribers: 0,
    isPremium: false,
    payments: [],
    earnings:[],
    buyers: [],

    monthly : {Jan: { earn: 0, pay: 0 },
          Feb: { earn: 0, pay: 0 },
          Mar: { earn: 0, pay: 0 },
          Apr: { earn: 0, pay: 0 },
          May: { earn: 0, pay: 0 },
          Jun: { earn: 0, pay: 0 },
          Jul: { earn: 0, pay: 0 },
          Aug: { earn: 0, pay: 0 },
          Sep: { earn: 0, pay: 0 },
          Oct: { earn: 0, pay: 0 },
          Nov: { earn: 0, pay: 0 },
          Dec: { earn: 0, pay: 0 },},
    months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

    pieSeries: [],
    pieChartOptions: {
      labels: ['Followers', 'Subscribers', 'Pay-Per-Post'],
      colors: ['#42A5F5', '#66BB6A', '#FFA726'],
      chart: {
        type: 'pie',
      },
      legend: {
        position: 'bottom'
      }
    },

    lineChartSeries: [
      {
        name: 'Income',
        data: [],
      },
      {
        name: 'Spendings',
        data: [],
      },
      {
        name: 'Profit',
        data: [],
      }
    ],
    lineChartOptions: {},

    barChartSeries: [
      {
        name: 'Likes',
        data: [],
      },
      {
        name: 'Ratings',
        data: [],
      }
    ],
    barChartOptions: {}
  };

},
    created() {
      this.userName = localStorage.getItem('userName');
      this.userEmail = localStorage.getItem('userEmail')
      this.token = localStorage.getItem('token')
      this.getProfilePicture();
      this.getAuthorFollows();
    },
    methods: {
      async getPayersPerPost() {
        try {
          const response = await axios.get("http://localhost:5000/user/payersperpost", {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          });

         this.buyers= response.data.buyers

          console.log("Buyers:", this.buyers);

          this.processFollowersData(this.buyers)


        } catch (error) {
          console.error("Error fetching financials:", error);
        }
      },
      processFollowersData(){
        this.pieSeries = [
          (this.followers-this.subscribers) || 0,
          this.subscribers || 0,
          this.buyers || 0  
        ];
      },

      async getPostsStats() {
        try {
          const response = await axios.get("http://localhost:5000/post/stats", {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          });
          const stats =response.data
          console.log(stats)
          this.processPostsStats(stats)

        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      },


      processPostsStats(stats){
        const likes = [];
    const ratings = [];
    const postDates = [];
    const averageRatings =[];

    stats.forEach(post => {
      const postDate = new Date(post.date);  
      console.log(postDate)
      const formattedDate = `${postDate.getDate().toString().padStart(2, '0')} ${this.months[postDate.getMonth()]}`; // Formatarea datei în formatul 'dd Mmm'

      likes.push(post.likes || 0);  
      ratings.push(post.totalRatings || 0); 
      postDates.push(formattedDate); 
      averageRatings.push(post.rating || 0); 
    });

        this.barChartSeries = [
      { name: "Likes", data: likes },
      { name: "Ratings", data: ratings }
    ];

        this.barChartOptions = {
      chart: {
        type: 'bar',
        height: 260,
        toolbar: {
        show: true,
        export: {
          csv: {
            headerCategory: 'category',
            filename: 'post_stats',
          },
          svg: {
            filename: 'post_stats_chart',
          },
          png: {
            filename: 'post_stats_image',
          }
        }
      },
      },
      
      plotOptions: {
        bar: {
          horizontal: false,
          endingShape: 'rounded'
        }
      },
      xaxis: {
        categories: postDates,
      },
      yaxis: {
        title: {
          text: 'No. of Likes / Ratings',
        },
      },
      legend: {
        position: 'top'
      },
      tooltip: {
        enabled: true, 
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          const customElement = document.createElement('div');
        customElement.style.padding = '15px';
        customElement.style.background = '#fff';
        customElement.style.borderRadius = '8px';
        customElement.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)';
        customElement.style.color = '#333';
        customElement.style.fontFamily = 'Arial, sans-serif';
        customElement.style.fontSize = '14px';
        customElement.style.width = '250px';

        const likesValue = w.config.series[0].data[dataPointIndex]; 
        const ratingsValue = w.config.series[1] ? w.config.series[1].data[dataPointIndex] : 0; 
        const avgRating = averageRatings[dataPointIndex]; 

        const postDate = w.config.xaxis.categories[dataPointIndex]; 
        customElement.innerHTML = `
          <div style="font-weight: bold; font-size: 16px;">Post on ${postDate}</div>
          <div style="margin-top: 10px;">
            <strong>💙Likes:</strong> ${likesValue} <br>
            <strong>🟢No. Ratings:</strong> ${ratingsValue} <br>
            <strong>⭐Average Rating:</strong> ${avgRating}<br>
          </div>
        `;

        return customElement;
        }
      }
    }
      },

      async getUserFinancials() {
        try {
          const response = await axios.get("http://localhost:5000/user/financials", {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          });

         this.payments= response.data.payments
         this.earnings= response.data.earnings

          this.processFinancialData(this.payments, this.earnings)


        } catch (error) {
          console.error("Error fetching financials:", error);
        }
      },

      processFinancialData(payments, earnings) {
        earnings.forEach((e) => {
          const date = new Date(e.date._seconds * 1000);  
          const month = this.months[date.getMonth()];  
          this.monthly[month].earn += e.amount;  
        });

        payments.forEach((p) => {
          const date = new Date(p.date._seconds * 1000); 
          const month = this.months[date.getMonth()];  
          this.monthly[month].pay += p.amount;  
        });

        const incomeData = [], spendingData = [], profitData = [], labels = [];

        for (const [month, data] of Object.entries(this.monthly)) {
          if (data.earn > 0 || data.pay > 0) {
            labels.push(month); 
            incomeData.push(data.earn);
            spendingData.push(data.pay);
            profitData.push(data.earn - data.pay);  
          }
        }

          console.log("Payments:", this.payments);
          console.log("Earnings:", this.earnings);
        this.lineChartSeries = [
      { name: "Income", data: incomeData },
      { name: "Spendings", data: spendingData },
      { name: "Profit", data: profitData }
    ];

      this.lineChartOptions = {
      chart: {
        height: 260,
        type: 'line',
        toolbar: {
        show: true,
        export: {
          csv: {
            filename: 'financial_stats',
          },
          svg: {
            filename: 'financial_stats_chart',
          },
          png: {
            filename: 'financial_stats_image',
          }
        }
      },
      },
      xaxis: {
        categories: labels, 
      },
      
      legend: {
        position: 'bottom'
      }
    };
      },

      logout() {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('token');
        this.$router.push('/');
      },
    async getAuthorFollows() {
    try {
      const response = await axios.get(`http://localhost:5000/user/${this.userName}/followers`);
      this.followers = response.data.followers; 
      this.subscriptionPrice = response.data.subscriptionPrice;
      this.subscribers = response.data.subscribers;
      if(this.followers>=1000){
        this.isPremium=true
        
          this.getUserFinancials();
          this.getPostsStats();
          this.getPayersPerPost();
        
      }
    } catch (error) {
      console.error("Error fetching followers count:", error);
    }
  },
      async getProfilePicture() {
      try {
          const response = await axios.get(`http://localhost:5000/user/${this.userName}/profilePicture`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
        
        if (response.data.profilePicture) {
          this.userPhoto = `data:image/jpg;base64,${response.data.profilePicture}`;  //image
          console.log('Profile picture retrieved successfully');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    },
    async saveSubscriptionPrice() {
      try {
        console.log(this.subscriptionPrice)
        const response = await axios.put('http://localhost:5000/user/subscription',  { subscriptionPrice: this.subscriptionPrice }, 
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        console.log(response.data.message)

        this.message = response.data.message;
      
      } catch (error) {
        console.error('Error saving subscription price:', error);
        this.message = error.response?.data?.error || 'An error occurred.';
      
      }
    },
      uploadPhoto() {
        this.$refs.fileInput.click(); 
      },
      onFileChange(event) {
      const file = event.target.files[0];
      console.log("File selected:", file.size);

      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const image = new Image();
          image.src = reader.result;

          image.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 200; 
            canvas.height = 200; 
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const resizedImage = canvas.toDataURL('image/jpeg'); 
            this.userPhoto = resizedImage; 
            this.selectedFile = file; 
          };
        };
        reader.readAsDataURL(file);
      }
    },

      async sendPhoto() {
        const reader = new FileReader();
        reader.readAsDataURL(this.selectedFile);
        const promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });

      try {
        const base64Image = await promise
        const profileData = {
          email: this.userEmail,
          photo: this.userPhoto.split(',')[1]
        };
        console.log(profileData)
        const response = await axios.post('http://localhost:5000/user/profilePicture', profileData, {
          headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${this.token}`,
          },
        });
        console.log('Response from backend:', response.data)
        this.selectedFile=null

      } catch (error) {
        console.error('Error sending   photo:', error)
      }
    }
    },
    
  }
  </script>
  
  <style scoped>
  html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
    h1 {
      color: #683312; 
      font-family: 'Quicksand', sans-serif;
      font-weight: bold;
      margin-top: 20px;
    }
    p {
      color: #8f5b3a;
    }
    .v-navigation-drawer {
      
    background-color: #f5e8dd;
    border-right: 4px dashed #a5492a;
    font-family: 'Handlee', cursive;
  }
      .v-avatar {
    border: 4px dashed #a5492a;
    transition: all 0.3s ease;
  }

  .v-avatar.mini {
    border: none !important;
  }
  .v-list-item-title,
  .v-card-title,
  .v-list span {
    font-family: 'Handlee', cursive;
    color: #5c3d24;
  }

  .v-btn {
    font-family: 'Quicksand', sans-serif;
  }

  .subscription-box {
    background-color: #fffaf4;
    border: 2px dashed #c28c68;
    border-radius: 12px;
    padding: 12px;
    font-family: 'Handlee', cursive;
  }

  .subscription-box .v-text-field {
    margin-bottom: 10px;
  }

  .subscription-box .v-input {
    font-size: 14px;
    max-width: 120px;
    margin: auto;
  }

  .subscription-box .v-btn {
    color: white;
    background-color: #b79866;
    font-size: 13px;
    text-transform: none;
    border-radius: 20px;
    width: 100%;
  }

  .v-card-title.subtitle-2 {
    text-align: center;
    font-size: 18px;
    font-family: 'Pacifico', cursive;
    color: #683312;
    margin-bottom: 6px;
  }
  .charts{
    background: linear-gradient(to bottom, #f5e8dd, #a5492a);
    min-height: 100vh;
    min-width: 100%;
  }
  .chart{
    height: 320px; 
  }
  .upload-photo, .save-btn{
    color: white;
    background-color: #b79866;
  }
  .hidden-input{
    display: none;
  }
  .noncharts{
    background: linear-gradient(to bottom, #f5e8dd, #a5492a);
    min-height: 100vh;
    min-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .premium-info {
  background-color: #fffaf4;
  border: 2px dashed #c28c68;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #5c3d24;
  font-family: 'Handlee', cursive;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease-in-out;
}
  </style>