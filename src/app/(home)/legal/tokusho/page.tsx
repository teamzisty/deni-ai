import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  return {
    title: t("特定商取引法に基づく表記 | Deni AI"),
    description: t("特定商取引法に基づく表記です。"),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default function TokushoPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            最終更新日: 2025-12-31
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            特定商取引法に基づく表記
          </h1>
        </div>

        <dl className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">事業者名</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              実名については、請求があった場合は遅滞なく開示します。
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">運営責任者</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              桃木 悠汰
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">所在地</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              請求があった場合には速やかに開示いたします
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">電話番号</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              請求があった場合には速やかに開示いたします
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">メールアドレス</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              imraicdev@gmail.com
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">利用可能な決済手段</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              クレジットカード
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">決済期間</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              クレジットカード決済はただちに処理されます。
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">配達時間</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              決済完了後、直ちに利用可能
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">価格</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              各商品ページに記載の金額
            </dd>
          </div>
          <div className="grid gap-2 border-border p-4 sm:grid-cols-3 sm:gap-6 sm:border-b">
            <dt className="text-sm font-medium">返品・キャンセル</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              デジタルサービスのため原則不可
            </dd>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-3 sm:gap-6">
            <dt className="text-sm font-medium">追加手数料</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">
              なし
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
