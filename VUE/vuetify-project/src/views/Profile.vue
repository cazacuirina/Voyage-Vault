<template>
    <v-container class="text-center">
      <div class="d-flex align-center justify-center mt-5">
        <v-avatar size="120" class="profile-avatar">
          <v-img :src="userPhoto" v-if="userPhoto" class="circle-image" />
          <v-icon v-else color="#683312" size="80">mdi-account</v-icon>
        </v-avatar>
  
        <div class="ml-4">
          <h1>Welcome back, {{ userName }}!</h1>
          <p>Here you can view and manage your personal information.</p>
          <v-btn
            icon
            @click="uploadPhoto"
            class="camera-button"
          >
          <v-icon color="#683312">
            {{ userPhoto ? 'mdi-pencil' : 'mdi-camera' }} <!-- Conditional icon -->
          </v-icon>
          </v-btn>
          <input
            type="file"
            ref="fileInput"
            @change="onFileChange"
            accept="image/*"
            style="display: none;"
          />
          <v-btn
          v-if="selectedFile" 
          @click="sendPhoto"
          color="green"
          icon
          class="check-button"
        >
          <v-icon>mdi-check</v-icon> 
        </v-btn>
        
        <v-row>
          <v-col>
            <p>Followers: {{ followers }}</p>
            <p>Status: {{ isPremium ? 'Premium Creator' : 'Normal Creator' }}</p>
          </v-col>
        </v-row>

        <v-btn
          color="red"
          @click="logout"
          class="mt-4"
        >
          <v-icon left>mdi-logout</v-icon>
          Logout
        </v-btn>

       
        <v-alert v-if="!isPremium" type="info" outlined class="mt-3">
          Once you get 1000 followers and become premium, you can start making income by charging monthly or per post.
        </v-alert>
   
        <v-card v-if="isPremium" class="mt-4 p-4">
          <h3>Set Your Monthly Subscription Price</h3>
          <v-text-field  v-model="subscriptionPrice"
            type="number" 
            min="1"
            max="10"
            label="Monthly Price ($)"
            outlined></v-text-field>
          <v-btn color="primary" @click="saveSubscriptionPrice">Save Price</v-btn>
        </v-card>
        
        </div>
      </div>
    </v-container>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'Profile',
    data() {
      return {
        userName: "", 
        userEmail:"",
        token:"",
        userPhoto: '',
        selectedFile: null,
        followers: 0,
        isPremium: false,
      }
    },
    created() {
      this.userName = localStorage.getItem('userName');
      this.userEmail = localStorage.getItem('userEmail')
      this.token = localStorage.getItem('token')
      this.getProfilePicture()
      this.getAuthorFollows();
    },
    methods: {
      logout() {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('token');
      this.$router.push('/');
    },
    async getAuthorFollows() {
    try {
      const response = await axios.get(`http://localhost:3001/author/${this.userName}/followers`);
      this.followers = response.data.followers; 
      this.subscriptionPrice = response.data.subscriptionPrice;
      if(this.followers>=1000){
        this.isPremium=true
      }
    } catch (error) {
      console.error("Error fetching followers count:", error);
    }
  },
      async getProfilePicture() {
      try {
        // const response = await axios.get('http://localhost:3001/profile/userPhoto', {
          const response = await axios.get(`http://localhost:3001/author/${this.userName}`, {
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
        const response = await axios.put('http://localhost:3001/user/subscription',  { subscriptionPrice: this.subscriptionPrice }, 
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        console.log(response.data.message)

        this.message = response.data.message;
        //this.messageType = 'success';
      } catch (error) {
        console.error('Error saving subscription price:', error);
        this.message = error.response?.data?.error || 'An error occurred.';
       // this.messageType = 'error';
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
          //photo: base64Image.split(',')[1], // Extract the base64 data after the comma
          photo: this.userPhoto.split(',')[1]
        };
        console.log(profileData)
        const response = await axios.post('http://localhost:3001/profile/picture', profileData, {
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
    h1 {
      color: #683312; 
      font-family: 'Quicksand', sans-serif;
      font-weight: bold;
      margin-top: 20px;
    }
    p {
      color: #8f5b3a;
    }
    .profile-avatar {
      border: 4px solid #683312; 
      padding: 4px;
      border-radius: 50%;
    }
    .circle-image {
        border-radius: 50%;
        object-fit: cover;  
        width: 100%;        
        height: 100%;      
}
  </style>