import { DocsflyConfig } from "docsfly";

const config: DocsflyConfig = {
  site: {
    name: "Deni AI Docs",
    description: "A documentation website built with Docsfly",
    url: "https://docs.deniai.app",
  },
  header: {
    title: "Deni AI Docs",
    navigation: [
      {
        label: "Home",
        href: "/",
      },
      {
        label: "Blog",
        href: "/blog",
      },
      {
        label: "Docs",
        href: "/docs",
      },
      {
        label: "GitHub",
        href: "https://github.com/usedocsfly/docsfly",
      },
    ],
    showSearch: true,
  },
  docs: {
    dir: "docs",
  },
  blog: {
    enabled: true,
    dir: "blog",
    authors: {
      rai: {
        name: "Rai",
        title: "Developer",
        image_url: "https://github.com/raicdev.png",
      },
      "deni-ai-team": {
        name: "Deni AI Team",
        title: "Developer",
        image_url: "https://github.com/deniaiapp.png",
      },
    },
  },
  navigation: {
    logo: {
      text: "Deni AI Docs",
    },
    links: [],
  },
};

export default config;
