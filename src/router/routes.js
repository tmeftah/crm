const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "/new", component: () => import("pages/IndexPage.vue") },
      {
        path: "/customers/:id",
        component: () => import("pages/IndexPage.vue"),
      },
      { path: "/", component: () => import("pages/CustomersList.vue") },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
