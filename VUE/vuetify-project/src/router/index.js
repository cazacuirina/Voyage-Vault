import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
      },
      {
        path:'/account',
        name:"Account",
        component:() => import('@/views/Account.vue'),
      },
      {
        path:'/profile',  
        name:"Profile",
        component:() => import('@/views/Profile.vue'),
      },
      {
        path:'/posts',
        name:'AllPosts',
        component:()=>import('@/views/PostList.vue')
      },
      {
        path: '/post/:postTitle',
        name: 'PostDetails',
        component: () => import('@/views/PostDetails.vue'),
        props: true,
      },
      {
        path: '/subscription-success',
        name: 'SubscriptionSuccess',
        component: () => import('@/views/SubscriptionSuccess.vue'),
        props: (route) => ({ authorName: route.query.authorName, userEmail: route.query.userEmail })
      },
      {
        path: '/post-pay-success',
        name: 'PostPaySuccess',
        component: () => import('@/views/PostPaySuccess.vue'),
        props: (route) => ({ postTitle: route.query.postTitle, authorName: route.query.authorName })
      },
      {
        path: '/trips',
        name: 'Trips',
        component: () => import('@/views/Trips.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router