<template>
  <v-dialog min-height="30em" width="25em" v-model="isActive" transition="dialog-bottom-transition" scrollable>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" v-if="isUserAuthenticated" rounded="xl" size="x-large">
        <v-icon right>mdi-draw</v-icon>Share a story
      </v-btn>
    </template>

    <template v-slot:default>
      <v-card>
        <v-card-title class="text-center">Your story</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="post.title"
              label="Title"
              :rules="titleRules"
            />
            <v-row class="destination">
              <v-text-field
                v-model="post.country"
                label="Country"
                :rules="countryRules"
              />
              <v-text-field
                v-model="post.city"
                label="City"
                :rules="cityRules"
              />
            </v-row>
            <v-textarea
              v-model="post.description"
              label="Describe your journey"
              :rules="descriptionRules"
            />

            <div class="premium-section d-flex align-center">

              <v-switch
                v-if="isPremiumUser"
                v-model="post.isPremium"
                label="Premium"
                inset
                color="blue"
              />

              <v-text-field
                v-if="post.isPremium"
                v-model="post.price"
                label="Price ($)"
                type="number"
                min="1"
                max="5"
                class="price-input ml-3"
              />
            </div>

              <v-file-input
                label="Uploaded Images"
                multiple
                accept="image/*"
                :rules="[imageUploadRules]"
                class="hidden-input"
                ref="fileInput"
                @change="handleImageUpload"
              />

              <v-btn
                icon
                class="add-image-button mr-2"
                @click="triggerFileInput"
                v-if="post.images.length < 3"
              >
                <v-icon color="white">mdi-camera</v-icon>
              </v-btn>

            <div v-if="post.images && post.images.filter(img => !!img && img.trim() !== '').length">
              <p>Images:</p>
              <v-row>
                <v-col v-for="(image, index) in post.images" :key="index">
                  <v-img :src="image" class="image-preview" />
                  <v-btn icon small color="red" @click="removeImage(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn id="submit" @click="submit">Send</v-btn>
          <v-btn id="close" @click="isActive = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      post: {
        title: '',
        country: '',
        city: '',
        description: '',
        isPremium: false,
        price: 0,
        images: [],
      },
      userName: "",
      isPremiumUser: false, 
      valid:false,
      isActive: false,
      isEditing: false,
    };
  },
  computed: {
    isUserAuthenticated() {
      return !!localStorage.getItem('token')
    },
    titleRules() {
      return [
        (v) => !!v || 'Title is required',
        (v) => (v && v.length >= 5) || 'Title must be at least 5 characters',
      ]
    },
    countryRules() {
      return [
        (v) => !!v || 'Country is required',
        (v) => /^[a-zA-Z\s]*$/.test(v) || 'Country must contain only letters and spaces',
      ]
    },
    cityRules() {
      return [
        (v) => !!v || 'City is required',
        (v) => /^[a-zA-Z\s]*$/.test(v) || 'City must contain only letters and spaces',
      ]
    },
    descriptionRules() {
      return [
        (v) => !!v || 'Description is required',
        (v) => {
            const sentences = v.split(/[.!?;]/)
            return (sentences.length >= 3) || 'Description must contain at least 3 sentences'
        },
      ]
    },
    imageUploadRules() {
      return [
    (v) => {
      if (v && v.length <= 3) {
        return true;  
      }
      return 'Upload max 3 images';  
    }
  ]
    },
  },
  mounted() {
    console.log("HI")
    this.userName = localStorage.getItem('userName');
    if (this.userName) {
      this.getIsPremium(this.userName);
  }
  },
  methods: {
    async getIsPremium() {
    try {
      const response = await axios.get(`http://localhost:3001/user/${this.userName}/followers`);
      if(response.data.followers>=1000) {
        this.isPremiumUser=true
      }
    } catch (error) {
      console.error("Error fetching followers count:", error);
    }
  },

  setImages(images) {
  this.post.images = images;
},

  removeImage(index) {
    this.post.images.splice(index, 1);
  },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const currentImageCount = this.post.images.length; 
  const newImageCount = files.length;
  
  if (currentImageCount + newImageCount <= 3) {
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const image = new Image();
          image.src = e.target.result;

          image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let width = image.width;
            let height = image.height;

            const maxWidth = 300;
            const maxHeight = 300;
            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);

           
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7); 
            resolve(resizedBase64); 
          };

          image.onerror = (error) => reject(new Error("Eroare la încărcarea imaginii: " + error.message));
        };
        reader.onerror = reject;  
        reader.readAsDataURL(file); 
      });
    });

    Promise.all(promises)
      .then(base64Images => {
        this.post.images.push(...base64Images); 
      })
      .catch(error => {
        console.error("Eroare la procesarea fișierelor:", error);
      });
  } else {
    alert('You can only upload up to 3 images in total.');
  }

  event.target.value = '';  
},

    openEditForm(post) {
      this.post = { ...post }  
      console.log(post)
      this.isActive = true
      this.isEditing = true
    },

    async submit() {
      try {
        await this.$refs.form.validate()  
        if (this.valid) {
          const postData = {
          title: this.post.title,
          country: this.post.country,
          city: this.post.city,
          description: this.post.description,
          author: localStorage.getItem("userName"),
          date: this.generateCustomTimestamp(),
          images: [], 
        };
        if (this.isPremiumUser) {
          postData.isPremium = this.post.isPremium;
          postData.price = this.post.price;
        }

        if (this.post.images.length > 0) {
        postData.images = this.post.images.map(image => 
        image.replace(/^data:image\/\w+;base64,/, "")); 
        console.log("LUNG", postData.images.length)    
        console.log(postData.images) //am luat ce e aici si am bagat in base64 decoder online si e ok!
      } else {
        console.warn("No images to send.");
      }
      
          if(this.isEditing){   
            const response = await axios.put(`http://localhost:3001/post/${this.post.id}`, postData, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })  
            console.log('Post edited successfully', response.data)

            this.$emit('post-edited', this.post)  
            console.log(this.post)

          }else{  
            const response = await axios.post('http://localhost:3001/post', postData, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
            })  
            console.log('Post sent successfully', response.data)
         
            this.$emit('post-created', this.post)   
          }
        
          this.post = {
            title: '',
            country: '',
            city: '',
            description: '',
            images:[]
          }  

          this.isActive = false   
        }
      } catch (error) {
        console.error('Error sending post', error)
      }
    },
    isValidString(value) {
        const regex = /^[A-Za-z]+$/
        return regex.test(value)
    },
    generateCustomTimestamp() {
      const customDate = new Date()  
      const seconds = Math.floor(customDate.getTime() / 1000)
      const nanoseconds = customDate.getMilliseconds() * 1000000
      return {
        _seconds: seconds,
        _nanoseconds: nanoseconds,
      }
  },
},
}
</script>

<style scoped>

  .v-card {
    background-color: #f5f5f5; 
    color: #333; 
  }

  .v-card-title {
    background-color: #ab8953; 
    font-family: 'Dancing Script', cursive;
    color: #fff;
    font-size: 1.75em;
  }

  .v-form {
    padding: 16px; 
  }

  .v-text-field,
  .v-textarea {
    margin-bottom: 16px; 
  }

  .v-btn {
    background-color: #ab8953; 
    color: #fff; 
  }

  #submit{
    color: beige;
  }
  #close{
    color:brown;
  }

  .destination{
    margin-left: 0.2em;
    margin-right: 0.2em;
  }
  .v-text-field{
    margin-inline-start: 0.5em;
  }
  .v-btn:hover {
    background-color: rgb(171, 114, 83); 
  }

  .v-btn mdi-draw {
    margin-right: 8px; 
  }

  .v-btn mdi-draw,
  .v-btn mdi-draw:hover {
    color: #fff; 
  }
  .add-image-button {
  border-radius: 50%;
  width: 56px;
  height: 56px; 
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-preview {
  max-width: 100px; 
  max-height: 100px; 
  margin-right: 8px;
}
.hidden-input {
  display: none;
}
.price-input {
  max-width: 100px;
}
</style>
