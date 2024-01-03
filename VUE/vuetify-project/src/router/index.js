// Composables
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
        path:'/posts',
        name:'AllPosts',
        component:()=>import('@/views/PostList.vue')
      },
      {
        path: '/posts/:postTitle',
        name: 'PostDetails',
        component: () => import('@/views/PostDetails.vue'),
        props: route => ({ post: JSON.parse(route.query.post) }),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
