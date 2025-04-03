"use client";

import { Header } from "@/components/header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import React from "react";
import Image from "next/image";

const WhatsNewV2 = () => {
  return (
    <main>
      <Header />

      {/* Hero Section */}
      <div className="mx-16">
        <section className="hero py-8">
          <h1 className="text-4xl font-bold text-center">
            バージョン 2.0 の新機能
          </h1>
          <p className="text-lg text-center mt-4">
            バージョン 2.0 の最新アップデート、機能、改善点をご覧ください！
          </p>
          {/* Alternating Highlights */}
          <div className="mt-10 space-y-10">
            {/* Highlight 1 */}
            <div className="flex flex-col md:flex-row bg-secondary rounded-xl p-4 py-8 items-center h-[200px]">
              <div className="md:w-1/2 text-center md:text-left px-6">
                <h2 className="text-2xl font-semibold">検索と詳細検索</h2>
                <p className="mt-2">
                  新しい検索機能と詳細検索機能で、お探しのものをすばやく見つけることができます。
                </p>
              </div>
              <div className="md:w-1/2 px-6">
                <Image
                  src="/images/search-feature.png"
                  alt="検索機能"
                  className="rounded-lg shadow-md"
                  width={400}
                  height={250}
                />
              </div>
            </div>

            {/* Highlight 2 */}
            <div className="flex flex-col md:flex-row-reverse bg-secondary rounded-xl p-4 py-8 items-center h-[200px]">
              <div className="md:w-1/2 text-center md:text-left px-6">
                <h2 className="text-2xl font-semibold">
                  ダイナミックアイランドインジケーター
                </h2>
                <p className="mt-2">
                  使いやすさを向上させるダイナミックアイランドインジケーターで、スタイリッシュな新デザインを体験してください。
                </p>
              </div>
              <div className="md:w-1/2 px-6">
                <Image
                  src="/images/dynamic-island.png"
                  alt="ダイナミックアイランドインジケーター"
                  className="rounded-lg shadow-md"
                  width={400}
                  height={250}
                />
              </div>
            </div>

            {/* Highlight 3 */}
            <div className="flex flex-col md:flex-row bg-secondary rounded-xl p-4 py-8 items-center h-[200px]">
              <div className="md:w-1/2 text-center md:text-left px-6">
                <h2 className="text-2xl font-semibold">セッショングループ化</h2>
                <p className="mt-2">
                  今日、昨日、今週などの期間でセッションを整理できます。
                </p>
              </div>
              <div className="md:w-1/2 px-6">
                <Image
                  src="/images/session-grouping.png"
                  alt="セッショングループ化"
                  className="rounded-lg shadow-md"
                  width={250}
                  height={250}
                />
              </div>
            </div>
          </div>{" "}
        </section>
        <div className="text-center flex flex-col gap-4 mt-5">
          <h1 className="text-4xl font-bold text-center">すべての変更点</h1>
          <span className="text-xl text-center">
            数えられないほどの新機能！
          </span>
        </div>
        {/* Feature Changes */}
        {/* Bug Fixes & System Changes */}
        <section className="mt-10 px-6 mx-auto mb-10">
          <Accordion className="w-1/3 mx-auto" type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <h2 className="font-semibold">バグ修正</h2>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside mt-4 w-full text-left">
                  <li>ログアウト/ログインボタンの間隔を修正</li>
                  <li>一部のモデルの認証バイパスを修正</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                <h2 className="font-semibold">機能の変更</h2>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside mt-4 w-full text-left">
                  <li className="text-left">検索、詳細検索を追加</li>
                  <li className="text-left">思考努力セレクターを削除</li>
                  <li className="text-left">
                    セッショングループ（今日、昨日、今週...）
                  </li>
                  <li className="text-left">
                    ダイナミックアイランド（スタイル）インジケーターを追加
                  </li>
                  <li className="text-left">カラーをスレートに変更</li>
                  <li className="text-left">
                    サイドバーにアカウントメニューを追加
                  </li>
                  <li className="text-left">ビュートランジションを追加</li>
                  <li className="text-left">
                    マークダウンにリンクプロパティを追加
                  </li>
                  <li className="text-left">
                    新ツール用にシステムプロンプトを変更
                  </li>
                  <li className="text-left">
                    GPT-4o（New）モデルを削除（不安定のため）
                  </li>{" "}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                <h2 className="font-semibold">システムの変更</h2>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside mt-4 w-full text-left">
                  <li>
                    画像アップロードプロバイダーをUploadThingに変更（thx）
                  </li>
                  <li>サイドバーのアカウントメニュー用にAuthProviderを追加</li>
                  <li>not-found.tsx、error.tsx、loading.tsxを追加</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
};

export default WhatsNewV2;
