<template>
    <v-app id="inspire">
      <v-content>
        <v-container class="fill-height" fluid>
          <v-row justify="center">
            <v-col cols="12" sm="8" md="8">
              <v-card id="myCard" class="elevation-12">
                <v-window v-model="step">
                  <v-window-item :value="1">
                    <v-row>
                      <v-col cols="12" md="8">
                        <v-card-text class="mt-12">
                          <h1 class="text-center display-2">
                            Get back to your blog
                          </h1>
                          <v-form ref="form" v-model="valid" lazy-validation>
                            <v-text-field
                              v-model="email"
                              label="Email"
                              name="Email"
                              :rules="emailRules"
                              prepend-icon="email"
                              type="text"
                              color="brown lighten-2"
                            />
  
                            <v-text-field
                              v-model="password"
                              id="password"
                              :type="showPassword ? 'text' : 'password'"
                              label="Password"
                              append-icon="mdi-eye"
                              @click:append="toggleShowPassword"
                              name="password"
                              :rules="passwordRules"
                              prepend-icon="lock"
                              type="password"
                              color="brown lighten-2"
                            />
                            <div v-if="error" class="error-message">{{ errorMessage }}</div>
                          </v-form>
                        </v-card-text>
                        <div class="text-center mt-0">
                          <v-btn @click="login" rounded color="brown lighten-2" dark>
                            SIGN IN
                          </v-btn>
                        </div>
                        <div class="text-center mt-3 mb-6">
  <a @click.prevent="loginWithGoogle" class="google-signin-link">
    Sign in with Google
  </a>
</div>
                      <!-- <div class="text-center mt-0">
                        <span class="sign-in-text">Sign in with Google</span>
                        <v-btn 
                          @click="loginWithGoogle" 
                          class="google-icon-btn" 
                          icon 
                          style="margin-top: 0;"
                          color="brown lighten-2">
                          <v-icon>mdi-google</v-icon>
                        </v-btn>
                      </div> -->


                      </v-col>
                      <v-col cols="12" md="4" class="brown-background">
                        <v-card-text class="white--text mt-12">
                          <h1 class="text-center display-1">Hello, fellow adventurer!</h1>
                          <h5 class="text-center">
                            Enter your personal details and start the journey with us
                          </h5>
                        </v-card-text>
                        <div class="text-center">
                          <v-btn rounded outlined dark @click="step++">SIGN UP</v-btn>
                        </div>
                      </v-col>
                    </v-row>
                  </v-window-item>
                  <v-window-item :value="2">
                    <v-row class="fill-height">
                      <v-col cols="12" md="4" class="brown-background">
                        <v-card-text class="white--text mt-12">
                          <h1 class="text-center display-1">Welcome back!</h1>
                          <h5 class="text-center">
                            Get back on track with us by logging in with your personal info
                          </h5>
                        </v-card-text>
                        <div class="text-center">
                          <v-btn rounded outlined dark @click="step--">Sign in</v-btn>
                        </div>
                      </v-col>
  
                      <v-col cols="12" md="8">
                        <v-card-text class="mt-12">
                          <h1 class="text-center display-2">
                            Create Account
                          </h1>
                          <v-form ref="form" v-model="valid" enctype="multipart/form-data" lazy-validation>
                            <v-text-field
                              v-model="name"
                              label="Name"
                              name="Name"
                              :rules="nameRules"
                              prepend-icon="person"
                              type="text"
                              color="brown lighten-2"
                            />
                            <v-text-field
                              v-model="email"
                              label="Email"
                              name="Email"
                              :rules="emailRules"
                              prepend-icon="email"
                              type="text"
                              color="brown lighten-2"
                            />
  
                            <v-text-field
                              v-model="password"
                              :type="showPassword ? 'text' : 'password'"
                              label="Password"
                              append-icon="mdi-eye"
                              @click:append="toggleShowPassword"
                              name="password"
                              :rules="passwordRules"
                              prepend-icon="lock"
                              type="password"
                              color="brown lighten-2"
                            />
                            <div v-if="error" class="error-message">{{ errorMessage }}</div>
                          </v-form>
                        </v-card-text>
                        <div class="text-center mt-n5">
                          <v-btn @click="register" rounded color="brown lighten-2" dark>
                            SIGN UP
                          </v-btn>
                        </div>
                      </v-col>
                    </v-row>
                  </v-window-item>
                </v-window>
              </v-card>
            </v-col>
          </v-row>
         
        </v-container>
      </v-content>
    </v-app>
  </template>
  
  <script>
  import axios from 'axios';

  export default {
    data: () => ({
      step: 1,
      valid: false,
        error:false,
        errorMessage:"",
        name:"",
        email: "",
        password: "",
        showPassword: false,
        nameRules: [
        v => !!v || "Name is required",
        v => /^[a-zA-Z\s]*$/.test(v) || "Name must contain only letters and spaces",
        ],
        emailRules: [
          v => !!v || "Email is required",
          v => /.+@.+\..+/.test(v) || "Email must be valid",
        ],
        passwordRules: [
          v => !!v || "Password is required",
          v => v.length >= 8 || "Password must be at least 8 characters",
        ],
    }),
    computed: {
    isAuthenticated() {
      return !!localStorage.getItem('token'); // Verifică dacă utilizatorul este autentificat
    }
  },
    methods: {
      logout() {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('token');
        this.$router.push('/'); 
        console.log("User logged out");
    },
      toggleShowPassword() {
        this.showPassword = !this.showPassword
      },
      async register() {
      try {
        await this.$refs.form.validate()  
        // console.log(this.valid)

        if (this.valid) {
          this.error = false
          
          const formData = new FormData();
          formData.append('name', this.name)
          formData.append('email', this.email)
          formData.append('password', this.password)
        
          
          const response = await axios.post('http://localhost:3001/register', {
            name: this.name,
            email: this.email,
            password: this.password
          })

          if (response.data.token) {   // if successfull registration - sign user in (token)
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('userName', response.data.userName)
            localStorage.setItem('userEmail', response.data.userEmail)

            console.log(response.data)
            
            console.log("Registration successful with", this.email, this.password)
            console.log("Token stored:", response.data.token)
            this.$router.push({ name: 'Home' })
          } else {
            console.error("Registration failed. No token received.")
            this.error = true  // backend post error
          }

        } else {
          this.error = true
          this.errorMessage = "Please input valid data"  // frontend invalid form 
          console.log("Please input valid data")
        }
      } catch (error) {
        console.error("Error during registration:", error.message, error.response.data.error)
        this.error = true
        this.errorMessage = error.response.data.error
      }
    },
    async login() {
      try {
        await this.$refs.form.validate()  // check valid form fields
        if (this.valid) {
          this.error = false
        
          const response = await axios.post('http://localhost:3001/login', {
            email: this.email,
            password: this.password,
          })

          if (response.data.token) {   // if successfull login - save token
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('userName', response.data.userName)
            localStorage.setItem('userEmail', response.data.userEmail)

            console.log("Login successful with", this.email, this.password)
            console.log("Token stored:", response.data.token)
            this.$router.push({ name: 'Home' })
          } else {
            console.error("Login failed. No token received.")  // backend post error
            this.error = true
          }
        } else {
          this.error = true
          this.errorMessage = "Please input valid data"    // frontend invalid form 
          console.log("Please input valid data")
        }
      } catch (error) {
        console.error("Error during login:", error.message, error.response.data.error)
        this.error = true
        this.errorMessage = error.response.data.error
      }
    },

    async loginWithGoogle() {
  try {
    window.location.href = 'http://localhost:3001/auth/google';
  } catch (error) {
    console.error("Error during Google login:", error);
  }
}

    },
  };
  </script>
  
  <style scoped>
  h1 {
    margin-bottom: 15%;
    font-family: 'Dancing Script', cursive;
  }
  
  h5 {
    font-family: 'Quicksand', sans-serif;
  }
  
  .v-form {
    max-width: 400px;
    margin: auto;
  }
  
  .v-form .v-text-field {
    margin-bottom: 16px;
  }
  
  .v-btn {
    margin-top: 5%;
    margin-bottom: 5%;
  }
  
  .v-btn:hover {
    background-color: rgb(165, 73, 42);
  }

  .brown-background {
    background: linear-gradient(to bottom, rgb(165, 73, 42), rgb(241, 241, 197));
  }

  .error-message {
    font-style: italic;
    color: rgb(165, 73, 42);
    margin-top: 2%;
    font-family: 'Quicksand', sans-serif;
  }

  #inspire{
    background: linear-gradient(to bottom, #f0dabc , #8f5b3a);
  }
  #myCard{
    margin-top: 1.5em;
  }

  .sign-in-text {
  font-size: 1.2em;
  margin-right: 0.5em;
  color: #683312; 
}


/* .google-icon-btn {
  border-radius: 50%; 
  background-color: white; 
  width: 1em; 
  height:1em;
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.15);
} */

.google-signin-link {
  font-size: 1em;
  color: #683312; /* Culoarea folosită pentru text */
  cursor: pointer;
  text-decoration: underline; /* Sublinează linkul pentru claritate */
  margin-top: 0; /* Elimină orice spațiu suplimentar de sus */
}

.google-signin-link:hover {
  color: #a5492a; /* Culoare mai închisă la hover */
}

  </style>
  