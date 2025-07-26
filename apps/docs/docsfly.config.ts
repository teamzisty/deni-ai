import { DocsflyConfig } from 'docsfly'

const config: DocsflyConfig = {
  site: {
    name: 'My Docsfly App',
    description: 'A documentation website built with Docsfly',
    url: 'https://my-docsfly-app.vercel.app',
  },
  header: {
    title: 'Deni AI Docs',
    showSearch: true,
  },
  docs: {
    dir: 'docs',
  },
  navigation: {
    logo: {
      text: 'My Docsfly App',
    },
    links: [
      {
        text: 'GitHub',
        href: 'https://github.com/usedocsfly/docsfly',
        external: true,
      },
    ],
  },
}

export default config