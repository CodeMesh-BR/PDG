import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import {
  LayoutDashboard,
  Store,
  Building2,
  SprayCan,
  Users,
  Car,
  FileText,
} from "lucide-react";

type NavItem = {
  title: string;
  icon: ComponentType<LucideProps>;
  url: string;
  items: { title: string; url: string }[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/", items: [] },
      { title: "Companies", icon: Store, url: "/companies", items: [] },
      { title: "Departments", icon: Building2, url: "/departments", items: [] },
      {
        title: "Service Catalog",
        icon: SprayCan,
        url: "/services-catalog",
        items: [],
      },
      {
        title: "Users",
        icon: Users,
        url: "/employees",
        items: [
          { title: "Employees", url: "/employees" },
          { title: "Clients", url: "/clients" },
          { title: "Admin Checkpoint", url: "/admin-checkpoints" },
        ],
      },
      { title: "Start Service", icon: Car, url: "/start-service", items: [] },
      {
        title: "Reports",
        icon: FileText,
        url: "/services-report",
        items: [
          { title: "Services Report", url: "/services-report" },
          { title: "Client Report", url: "/client-report" },
        ],
      },
    ],
  },
];
