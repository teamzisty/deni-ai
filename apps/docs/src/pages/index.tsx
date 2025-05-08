import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Translate, { translate } from "@docusaurus/Translate";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner)}>
      <div className="container">
        <Heading
          as="h1"
          className="hero__title animate__animated animate__fadeInDown"
        >
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle animate__animated animate__fadeInUp">
          {siteConfig.tagline}
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg animate__animated animate__pulse animate__infinite"
            to="/docs/intro"
            style={{
              background: "linear-gradient(45deg, #2196F3, #00BCD4)",
              color: "white",
              border: "none",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              borderRadius: "30px",
              padding: "15px 40px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
          >
            <Translate id="homepage.start.button">
              Getting Started
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Docs`}
      description={translate({
        id: "homepage.description",
        message: "Deni AI is a powerful AI assistant that helps you with your daily tasks.",
        description: "The description of the Deni AI homepage"
      })}
    >
      <HomepageHeader />
      <main>
        <div className={styles.features}>
          <div className="container">
            <div className="row">
              <div className={clsx("col col--6")}>
                <div className="text--center">
                  <h3><Translate id="homepage.official.title">Official Instance</Translate></h3>
                  <p>
                    <Translate id="homepage.official.description">
                      Try out the official Deni AI instance at
                    </Translate>{" "}
                    <a
                      href="https://deniai.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      deniai.app
                    </a>
                  </p>
                </div>
              </div>
              <div className={clsx("col col--6")}>
                <div className="text--center">
                  <h3><Translate id="homepage.source.title">Source Code</Translate></h3>
                  <p>
                    <Translate id="homepage.source.description">
                      Check out our source code on
                    </Translate>{" "}
                    <a
                      href="https://github.com/deni-ai/deni"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
