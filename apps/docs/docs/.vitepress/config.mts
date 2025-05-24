import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Deni AI Docs",
  description: "A documentation and blog of Deni AI.",
  locales: {
    root: {
      label: "English",
      lang: "en",
    },
    ja: {
      label: "Japanese",
      lang: "ja",
      link: "/ja/",
      themeConfig: {
        nav: [
          { text: "ホーム", link: "/ja" },
          { text: "ドキュメント", link: "/ja/getting-started" },
          { text: "ブログ", link: "/ja/blog/" },
        ],

        sidebar: {
          "/": [
            {
              text: "ドキュメント",
              items: [
                { text: "はじめに", link: "/ja/intro" },
                { text: "開始する", link: "/ja/getting-started" },
              ],
            },
            {
              text: "セットアップ",
              items: [
                { text: "インスタンスを作成", link: "/ja/setup-guide/create-a-instance" },
                { text: "カスタマイズ", link: "/ja/setup-guide/modification" },
                { text: "公開する", link: "/ja/setup-guide/publish" },
              ]
            },
            {
              text: "貢献",
              items: [
                { text: "レポジトリをセットアップ", link: "/ja/contribution/setup-repository" },
                { text: "翻訳の改善と変更", link: "/ja/contribution/changes-to-translation" },
              ],
            }
          ],
          "/blog/": [
            {
              text: "Blog",
              items: [
                { text: "All Posts", link: "/blog/" },
                { text: "Tags", link: "/blog/tags" },
              ],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/getting-started" },
      { text: "Blog", link: "/blog/" },
    ],

    sidebar: {
          "/": [
            {
              text: "Documentation",
              items: [
                { text: "Intro", link: "/intro" },
                { text: "Getting Started", link: "/getting-started" },
              ],
            },
            {
              text: "Setup",
              items: [
                { text: "Create an Instance", link: "/setup-guide/create-a-instance" },
                { text: "Customization", link: "/setup-guide/modification" },
                { text: "Publishing", link: "/setup-guide/publish" },
              ]
            },
            {
              text: "Contribution",
              items: [
                { text: "Setup Repository", link: "/contribution/setup-repository" },
                { text: "Improve and Modify Translations", link: "/contribution/changes-to-translation" },
              ],
            }
          ],
      "/blog/": [
        {
          text: "Blog",
          items: [
            { text: "All Posts", link: "/blog/" },
            { text: "Tags", link: "/blog/tags" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/raicdev/deni-ai" },
    ],
  },
});
