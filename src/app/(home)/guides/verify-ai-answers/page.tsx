import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Binary, Code2, FileSearch, Languages, ListChecks } from "lucide-react";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("How to verify AI answers before you rely on them");
  const description = t(
    "A practical review workflow for checking AI-generated facts, numbers, code, citations, translations, and recommendations.",
  );

  return {
    title,
    description,
    alternates: {
      canonical: "https://deniai.app/guides/verify-ai-answers",
    },
    openGraph: {
      title: `${title} — Deni AI Guides`,
      description,
    },
  };
}

export default function VerifyAiAnswersGuidePage() {
  const t = useExtracted();
  const headline = t("How to verify AI answers before you rely on them");
  const description = t(
    "AI output is useful when it shortens the path to a reviewed result. It becomes risky when a fluent answer is treated as proof. Verification turns AI from a guess into a working draft.",
  );

  const reviewAreas = [
    {
      icon: FileSearch,
      title: t("Facts and sources"),
      body: t(
        "Ask which claims need evidence, then verify those claims against primary or trusted sources. A citation is not enough; the source must actually support the statement.",
      ),
    },
    {
      icon: Binary,
      title: t("Numbers and calculations"),
      body: t(
        "Recalculate totals, dates, rates, and comparisons separately. If the answer includes a table, check both the formula and the interpretation.",
      ),
    },
    {
      icon: Code2,
      title: t("Code and commands"),
      body: t(
        "Run tests, read the changed files, and inspect edge cases. AI can produce plausible code that ignores local conventions or fails under real inputs.",
      ),
    },
    {
      icon: Languages,
      title: t("Translation and tone"),
      body: t(
        "Check whether the result sounds natural for the audience. Literal accuracy is not enough when the final text has to persuade, support, or explain.",
      ),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Organization",
      name: "Deni AI",
    },
    publisher: {
      "@type": "Organization",
      name: "Deni AI",
    },
    mainEntityOfPage: "https://deniai.app/guides/verify-ai-answers",
  };

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article className="px-4 pb-20 pt-32 md:pt-40">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">
            {t("AI Guides")}
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mt-6 text-base leading-8 text-muted-foreground">{description}</p>

          <section className="mt-10 rounded-[1.5rem] border border-border/70 bg-card p-6 md:p-8">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-secondary">
              <ListChecks className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
              {t("The verification pass")}
            </h2>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              {t(
                "Before using an AI answer, separate it into claims, instructions, and judgments. Claims need evidence. Instructions need testing. Judgments need context. This simple split catches many mistakes that are hidden by confident wording.",
              )}
            </p>
          </section>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reviewAreas.map((area) => (
              <section
                key={area.title}
                className="rounded-[1.5rem] border border-border bg-card p-6"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-secondary">
                  <area.icon className="size-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{area.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{area.body}</p>
              </section>
            ))}
          </div>

          <section className="mt-12 space-y-5 text-sm leading-8 text-muted-foreground">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("A five-minute review routine")}
            </h2>
            <p>
              {t(
                "Start by highlighting every sentence that would matter if it were wrong. Dates, prices, names, legal obligations, medical details, and technical commands deserve extra attention.",
              )}
            </p>
            <p>
              {t(
                "Then ask the model to list its assumptions. This is not because the model knows itself perfectly, but because forcing assumptions into the open gives you a checklist for review.",
              )}
            </p>
            <p>
              {t(
                "Next, verify outside the conversation. Use documentation, source records, tests, calculators, or a second expert review. Do not let the AI answer be the only evidence for itself.",
              )}
            </p>
            <p>
              {t(
                "Finally, rewrite the answer in your own words before publishing or sending it. If you cannot explain the result without copying the model, you probably have not reviewed it enough.",
              )}
            </p>
          </section>

          <section className="mt-12 rounded-[1.5rem] border border-border/70 bg-secondary/20 p-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("Questions to ask before trusting an answer")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>{t("Which claims would cause harm or rework if they were wrong?")}</li>
              <li>{t("Can I confirm the important facts outside the AI conversation?")}</li>
              <li>{t("Did the answer skip assumptions, constraints, or edge cases?")}</li>
              <li>{t("Have I tested code, commands, or calculations in a real environment?")}</li>
              <li>{t("Would a reader understand what is known, uncertain, and recommended?")}</li>
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/guides/multi-model-workflows"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("Next: multi-model workflows")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/use-cases"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("See use cases")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
