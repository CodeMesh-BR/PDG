import {
  LayoutDashboard,
  Store,
  SprayCan,
  Users,
  Car,
  FileText,
} from "lucide-react";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        url: "/",
        items: [],
      },
      {
        title: "Companies",
        icon: Store,
        url: "/companies",
        items: [],
      },
      {
        title: "Service Catalog",
        icon: SprayCan,
        url: "/services-catalog",
        items: [],
      },
      {
        title: "Employees",
        icon: Users,
        url: "/employees",
        items: [],
      },
      {
        title: "Start Service",
        icon: Car,
        url: "/start-service",
        items: [],
      },
      {
        title: "Services Report",
        icon: FileText,
        url: "/services-report",
        items: [],
      },
    ],
  },
];
