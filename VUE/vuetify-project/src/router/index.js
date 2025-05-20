import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home/Home.vue'),
      },
      {
        path:'/account',
        name:"Account",
        component:() => import('@/views/Users/Account.vue'),
      },
      {
        path:'/profile',  
        name:"Profile",
        component:() => import('@/views/Users/Profile.vue'),
      },
      {
        path:'/posts',
        name:'AllPosts',
        component:()=>import('@/views/Posts/PostList.vue')
      },
      {
        path: '/post/:postTitle',
        name: 'PostDetails',
        component: () => import('@/views/Posts/PostDetails.vue'),
        props: true,
      },
      {
        path: '/subscription-success',
        name: 'SubscriptionSuccess',
        component: () => import('@/views/Payments/SubscriptionSuccess.vue'),
        props: (route) => ({ authorName: route.query.authorName, userEmail: route.query.userEmail })
      },
      {
        path: '/post-pay-success',
        name: 'PostPaySuccess',
        component: () => import('@/views/Payments/PostPaySuccess.vue'),
        props: (route) => ({ postTitle: route.query.postTitle, authorName: route.query.authorName })
      },
      {
        path: '/trips',
        name: 'Trips',
        component: () => import('@/views/Trips/Trips.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router