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
      },
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
  },
  mounted() {},
  methods: {
    openEditForm(post) {
      this.post = { ...post }
      this.isActive = true
      this.isEditing = true
    },
    async submit() {
      try {
        await this.$refs.form.validate()
        if (this.valid) {
          if(this.isEditing){
            const response = await axios.put(`http://localhost:3001/post/${this.post.id}`, this.post, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            console.log('Post edited successfully', response.data)

            this.$emit('post-edited', this.post)
            console.log(this.post)

          }else{
            this.post.likes=0
            this.post.author=localStorage.getItem('userName')
            this.post.date=this.generateCustomTimestamp()
            console.log(this.post.date)

            const response = await axios.post('http://localhost:3001/post', this.post, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            console.log('Post sent successfully', response.data)
            
            const postId = response.data._path.segments[1]
            this.post.id=postId

            this.$emit('post-created', this.post)
            console.log(this.post)
          }
        
          this.post = {
            title: '',
            country: '',
            city: '',
            description: '',
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
</style>
