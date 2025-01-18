interface SiteConfig {
  name: string;
  description: string;
  navItems: Array<{
    href: string;
    label: string;
  }>;
}

export const siteConfig: SiteConfig = {
  name: "Your Site Name",
  description: "Your Site Description",
  navItems: [
    {
      href: "/",
      label: "Home",
    },
    // ... otros items
  ],
};
