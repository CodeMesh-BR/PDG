import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.DashboardIcon,
        url:"/",
        items: [],
      },
      {
        title: "Companies",
        icon: Icons.Store,
        url:"/companies",
        items: [],
      },
      {
        title: "Service Catalog",
        url: "/services-catalog",
        icon: Icons.SprayBottleIcon,
        items: [],
      },
       {
        title: "Employees",
        url: "/employees",
        icon: Icons.UserListIcon,
        items: [],
      },
      {
        title: "Start Service",
        url: "/start-service",
        icon: Icons.CarIcon,
        items: [],
      },
      {
        title: "Services Report",
        url: "/services-report",
        icon: Icons.ServicesReport,
        items: [],
      },
    ],
  },
];
