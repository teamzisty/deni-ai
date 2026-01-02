import type { Metadata } from "next";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  return {
    title: t("Terms of Service | Deni AI"),
    description: t("The terms and conditions for using Deni AI."),
  };
}

export default function TermsPage() {
  const t = useExtracted();
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("Last updated: 2025-12-31")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("Terms of Service")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t(
              'These Terms of Service (the "Terms") govern your access to and use of Deni AI (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.',
            )}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("1. Eligibility")}</h2>
          <p className="text-muted-foreground">
            {t(
              "You must be at least 13 years old to use the Service. If you are using the Service on behalf of an organization, you represent and warrant that you have authority to bind that organization to these Terms.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("2. Accounts and Security")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "You are responsible for the accuracy of the information you provide and for maintaining the security of your account. You agree not to share your login credentials and to notify us immediately of any unauthorized access or use of your account.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("3. Acceptable Use")}</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              {t(
                "Do not use the Service for unlawful, harmful, or abusive activity.",
              )}
            </li>
            <li>
              {t(
                "Do not attempt to reverse engineer or interfere with the Service.",
              )}
            </li>
            <li>
              {t(
                "Do not upload content that infringes on the rights of others or violates applicable laws.",
              )}
            </li>
            <li>
              {t(
                "Do not attempt to access, probe, or test the vulnerability of the Service without authorization.",
              )}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("4. Your Content")}</h2>
          <p className="text-muted-foreground">
            {t(
              "You retain ownership of the content you submit to the Service. You grant Deni AI a limited license to host, store, and process your content solely to operate, maintain, and improve the Service.",
            )}
          </p>
          <p className="text-muted-foreground">
            {t(
              "You are responsible for your content and the consequences of sharing it through the Service.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("5. AI Output")}</h2>
          <p className="text-muted-foreground">
            {t(
              "The Service may generate responses that are inaccurate, incomplete, or inappropriate. You are responsible for evaluating output before relying on it. Deni AI does not provide professional advice.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("6. Paid Features")}</h2>
          <p className="text-muted-foreground">
            {t(
              "If paid plans are offered, pricing and billing terms will be presented at purchase. You are responsible for applicable taxes and fees. Subscription cancellations take effect at the end of the current billing period unless stated otherwise.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("7. Intellectual Property")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "The Service, including its software and design, is owned by Deni AI and protected by applicable laws. You may not copy, modify, or distribute any part of the Service without prior written consent.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("8. Termination")}</h2>
          <p className="text-muted-foreground">
            {t(
              "We may suspend or terminate your access to the Service at any time if you violate these Terms or if required to protect the Service or other users.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("9. Disclaimers")}</h2>
          <p className="text-muted-foreground">
            {t(
              'The Service is provided on an "as is" and "as available" basis without warranties of any kind. To the maximum extent permitted by law, we disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("10. Limitation of Liability")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "To the maximum extent permitted by law, Deni AI will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("11. Changes to These Terms")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "We may update these Terms from time to time. If we make material changes, we will provide notice by updating the date above or by other reasonable means. Continued use of the Service after changes become effective constitutes acceptance of the updated Terms.",
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("12. Contact")}</h2>
          <p className="text-muted-foreground">
            {t("If you have questions about these Terms, contact us at:")}
          </p>
          <p className="text-muted-foreground">imraicdev@gmail.com</p>
        </section>
      </div>
    </main>
  );
}
