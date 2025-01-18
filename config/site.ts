interface SiteConfig {
  name: string;
  description: string;
  navItems: Array<{
    href: string;
    label: string;
  }>;
}

export const siteConfig: SiteConfig = {
  name: "Sistema Don Javier",
  description: "",
  navItems: [
    {
      href: "/",
      label: "Home",
    },
    // ... otros items
  ],
};
