import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/overview' },
  {
    path: '/overview',
    name: 'overview',
    component: () => import('../views/OverviewView.vue'),
    meta: { title: 'Overview' },
  },
  {
    path: '/leaderboard/:scenarioId?/:taskId?',
    name: 'leaderboard',
    component: () => import('../views/LeaderboardView.vue'),
    meta: { title: 'Leaderboard' },
  },
  {
    path: '/attempts/:scenarioId?/:taskId?',
    name: 'attempts',
    component: () => import('../views/AttemptsView.vue'),
    meta: { title: '응시 상세' },
  },
  {
    path: '/data',
    name: 'data',
    component: () => import('../views/DataView.vue'),
    meta: { title: 'Data' },
  },
  {
    path: '/submit',
    name: 'submit',
    component: () => import('../views/SubmitView.vue'),
    meta: { title: 'Submit' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/overview' },
]

const router = createRouter({ history: createWebHashHistory(), routes })

export default router
