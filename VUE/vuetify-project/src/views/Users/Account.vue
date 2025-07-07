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
                            v-if="!resetMode"
                            v-model="password"
                            id="password"
                            :type="showPassword ? 'text' : 'password'"
                            label="Password"
                            append-icon="mdi-eye"
                            @click:append="toggleShowPassword"
                            name="password"
                            :rules="passwordRules"
                            prepend-icon="lock"
                            color="brown lighten-2"
                          />

                          <v-text-field
                            v-if="resetMode"
                            v-model="newPassword"
                            label="New Password"
                            :type="showPassword ? 'text' : 'password'"
                            :rules="passwordRules"
                            prepend-icon="lock"
                            color="brown lighten-2"
                          />

                          <v-text-field
                            v-if="resetMode"
                            v-model="confirmPassword"
                            label="Confirm Password"
                            :type="showPassword ? 'text' : 'password'"
                            :rules="confirmPasswordRules"
                            prepend-icon="lock"
                            color="brown lighten-2"
                          />
                            <div v-if="error" class="error-message">{{ errorMessage }}</div>
                          </v-form>
                        </v-card-text>
                        <div class="text-center mt-0">
                          <v-btn @click="resetMode ? resetPassword() : login()" rounded color="brown lighten-2" dark>
                          {{ resetMode ? 'RESET' : 'SIGN IN' }}
                        </v-btn>
                        </div>
                        
                        <div class="text-center mt-3 mb-6 d-flex justify-center align-center">
                        <a @click.prevent="loginWithGoogle" class="google-signin-link mr-2">
                          Sign in with Google
                        </a>
                        <span class="mx-2">|</span>
                        <a @click.prevent="toggleResetMode" class="google-signin-link ml-2">
                          Reset Password
                        </a>
                      </div>
                     
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
        newPassword: "",
        confirmPassword: "",
        resetMode: false,
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
      return !!localStorage.getItem('token'); 
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
      toggleResetMode() {
      this.resetMode = !this.resetMode;
      this.password = "";
      this.newPassword = "";
      this.confirmPassword = "";
      this.error = false;
    },
    async resetPassword() {
      
      console.log(this.newPassword, this.confirmPassword)
      if (this.newPassword !== this.confirmPassword) {
        this.error = true;
        this.errorMessage = "Passwords do not match.";
        return;
      }

      try {
        const response = await this.axios.put("http://localhost:5000/auth/reset-password", {
          email: this.email,
          newPassword: this.newPassword,
        });

        this.error = false;
        this.resetMode = false;
        alert("Password reset successful. You can now sign in.");
      } catch (err) {
        this.error = true;
        this.errorMessage = err.response?.data?.error || "Reset failed";
      }
    },
    async resetPassword() {
  try {
    await this.$refs.form.validate();

    if (this.valid) {
      this.error = false;

      if (this.newPassword !== this.confirmPassword) {
        this.error = true;
        this.errorMessage = "Passwords do not match.";
        return;
      }

      const response = await axios.put("http://localhost:5000/auth/reset-password", {
        email: this.email,
        newPassword: this.newPassword
      });

      if (response.status === 200) {
        alert("Password reset successful. You can now sign in.");
        this.resetMode = false;
        this.newPassword = "";
        this.confirmPassword = "";
        this.password = ""; 
        this.error = false;
      } else {
        this.error = true;
        this.errorMessage = "Unexpected error. Try again.";
      }
    } else {
      this.error = true;
      this.errorMessage = "Please enter valid data.";
    }
  } catch (error) {
    console.error("Error during password reset:", error.message, error.response?.data?.error);
    this.error = true;
    this.errorMessage = error.response?.data?.error || "Reset failed. Try again.";
  }
},
    async login() {
      try {
        await this.$refs.form.validate() 
        if (this.valid) {
          this.error = false
        
          const response = await axios.post('http://localhost:5000/auth/login', {
            email: this.email,
            password: this.password,
          })

          if (response.data.token) {   
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('userName', response.data.userName)
            localStorage.setItem('userEmail', response.data.userEmail)

            console.log("Login successful with", this.email, this.password)
            console.log("Token stored:", response.data.token)
            this.$router.push({ name: 'Home' })
          } else {
            console.error("Login failed. No token received.")  
            this.error = true
          }
        } else {
          this.error = true
          this.errorMessage = "Please input valid data"   
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
    window.location.href = 'http://localhost:5000/auth/google';
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


.google-signin-link {
  font-size: 1em;
  color: #683312; 
  cursor: pointer;
  text-decoration: underline; 
  margin-top: 0;
}

.google-signin-link:hover {
  color: #a5492a;
}

  </style>
  