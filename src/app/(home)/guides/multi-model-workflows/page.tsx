import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FilePenLine, GitCompareArrows, MessageSquareText, Route } from "lucide-react";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("When multi-model AI is actually useful");
  const description = t(
    "Concrete workflows for using multiple AI models to compare answers, improve drafts, reduce risk, and decide when one model is enough.",
  );

  return {
    title,
    description,
    alternates: {
      canonical: "https://deniai.app/guides/multi-model-workflows",
    },
    openGraph: {
      title: `${title} — Deni AI Guides`,
      description,
    },
  };
}

export default function MultiModelWorkflowsGuidePage() {
  const t = useExtracted();
  const headline = t("When multi-model AI is actually useful");
  const description = t(
    "Using more than one AI model is not automatically better. It is useful when the second answer changes what you can see: assumptions, missing context, alternative structure, or risk.",
  );

  const workflows = [
    {
      icon: MessageSquareText,
      title: t("Second-opinion workflow"),
      body: t(
        "Use one model to create the first answer, then ask another model to identify weak claims, missing context, and possible objections. This is useful for decisions, planning, and sensitive communication.",
      ),
    },
    {
      icon: FilePenLine,
      title: t("Draft-and-editor workflow"),
      body: t(
        "Use a fast model for a rough draft, then use a stronger writing or reasoning model as the editor. Ask it to preserve intent while improving structure, clarity, and audience fit.",
      ),
    },
    {
      icon: Route,
      title: t("Router workflow"),
      body: t(
        "Send different parts of the work to different strengths: a coding model for implementation, a reasoning model for tradeoffs, and a writing model for the final explanation.",
      ),
    },
    {
      icon: GitCompareArrows,
      title: t("Disagreement workflow"),
      body: t(
        "When two models disagree, do not average the answers. Identify the exact point of disagreement, gather evidence, and decide which answer is better supported.",
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
    mainEntityOfPage: "https://deniai.app/guides/multi-model-workflows",
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

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {workflows.map((workflow) => (
              <section
                key={workflow.title}
                className="rounded-[1.5rem] border border-border bg-card p-6"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-secondary">
                  <workflow.icon className="size-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{workflow.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{workflow.body}</p>
              </section>
            ))}
          </div>

          <section className="mt-12 space-y-5 text-sm leading-8 text-muted-foreground">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("When one model is enough")}
            </h2>
            <p>
              {t(
                "If the task is low-risk, familiar, and easy to review, one model is usually enough. Examples include rewriting a short message, generating title ideas, or explaining a concept you already understand.",
              )}
            </p>
            <p>
              {t(
                "Adding more models has a cost: more text to read, more contradictions to resolve, and more chances to mistake variety for truth. Use comparison deliberately, not automatically.",
              )}
            </p>
          </section>

          <section className="mt-12 space-y-5 text-sm leading-8 text-muted-foreground">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("When comparison is worth it")}
            </h2>
            <p>
              {t(
                "Comparison is valuable when the answer will guide a decision, represent your organization, affect a customer, change code, or summarize information you have not personally verified.",
              )}
            </p>
            <p>
              {t(
                "The strongest pattern is not asking two models the same vague question. It is asking the second model to perform a specific role: critic, editor, tester, planner, translator, or simplifier.",
              )}
            </p>
            <p>
              {t(
                "When the second model finds a weakness, update the prompt or the requirements and run a focused follow-up. The benefit comes from iteration, not from collecting many unreviewed answers.",
              )}
            </p>
          </section>

          <section className="mt-12 rounded-[1.5rem] border border-border/70 bg-secondary/20 p-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("A useful multi-model prompt pattern")}
            </h2>
            <div className="mt-5 rounded-2xl border border-border bg-background p-5 text-sm leading-7 text-muted-foreground">
              {t(
                "Review the previous answer as a skeptical editor. List the strongest parts, the weakest assumptions, missing evidence, and the one change that would make it more useful. Do not rewrite yet.",
              )}
            </div>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/guides/model-selection"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("Back to model selection")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("Try a workflow")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
