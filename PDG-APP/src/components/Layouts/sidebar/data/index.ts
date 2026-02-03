import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import {
  LayoutDashboard,
  Store,
  SprayCan,
  Users,
  Car,
  FileText,
} from "lucide-react";

type NavItem = {
  title: string;
  icon: ComponentType<LucideProps>;
  url: string;
  items: { title: string; url: string }[]; // hoje fica sempre []
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
      {
        title: "Service Catalog",
        icon: SprayCan,
        url: "/services-catalog",
        items: [],
      },
      { title: "Employees", icon: Users, url: "/employees", items: [] },
      { title: "Start Service", icon: Car, url: "/start-service", items: [] },
      {
        title: "Services Report",
        icon: FileText,
        url: "/services-report",
        items: [],
      },
    ],
  },
];
