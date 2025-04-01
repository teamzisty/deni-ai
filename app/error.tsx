"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>何かしらの問題が発生しました</CardTitle>
          <CardDescription>
            Deni AI に予期しないエラーが発生しました。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="leading-none font-bold">よくある原因</p>
          <Accordion type="single" collapsible>
            <AccordionItem value="try-again">
              <AccordionTrigger>もう一度試す</AccordionTrigger>
              <AccordionContent>
                まず、「もう一度試す」ボタンを押して、エラーが解決するかをご確認ください。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="chat-session-old">
              <AccordionTrigger>チャットの保存方式が古い</AccordionTrigger>
              <AccordionContent>
                AI Playground
                のときなど古いときに利用している場合、このエラーが発生する可能性があります。これは、よく発生するエラーです。{" "}
                <br /> <br />
                下にあるデバッグメニューから、「セッションを削除」を選択して、チャットを削除することで解決する可能性があります。
                <br />
                <span className="text-muted-foreground text-xs">
                  ※チャットを削除すると、二度と元に戻すことはできません。
                </span>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="old-cache">
              <AccordionTrigger>古いキャッシュの使用</AccordionTrigger>
              <AccordionContent>
                ごく稀に、ブラウザに保存されているキャッシュ
                (JavaScriptファイルなど)
                が最新のものではない場合に、競合してエラーが発生する場合があります。
                <br /> <br />
                これは、ブラウザの設定からキャッシュをクリアすることで解決できます。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="other-errors">
              <AccordionTrigger>その他のエラー</AccordionTrigger>
              <AccordionContent>
                これらに従っても、解決しない場合、これは開発者によるミスなどの可能性があります。{" "}
                <br /> <br />
                <ol className="list-decimal list-inside">
                  <li>デバッグメニューを開き、エラーの確認を選択</li>
                  <li>エラーをコピーする</li>
                  <li>X で @raic_dev か @OneConfig にフォローする</li>
                  <li>DM を送信する</li>
                </ol>
                この方法を行うことで、開発者にエラーを報告することができます。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="gap-3">
          <Button onClick={reset}>もう一度試す</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"secondary"}>デバッグメニュー</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <span className="ml-2 text-muted-foreground text-xs">
                開発者へ報告
              </span>
              <DropdownMenuItem onClick={() => setIsErrorOpen(true)}>
                エラーの確認
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <span className="ml-2 text-muted-foreground text-xs">
                危険なアクション
              </span>
              <DropdownMenuItem onClick={() => window.localStorage.clear()}>セッションを削除 (確認なし)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isErrorOpen}
        onOpenChange={() => setIsErrorOpen(!isErrorOpen)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>エラーの確認</AlertDialogTitle>
            <AlertDialogDescription>
              これは、開発者のデバッグ目的か開発者に報告するための機能です。それ以外の場合は閉じることを推奨します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              value={String(error)}
              readOnly
              onClick={(e) => {
                e.currentTarget.select();
                navigator.clipboard.writeText(
                  String(error) || "Failed to get error"
                );
                toast.success("コピーしました");
              }}
            />
          </div>{" "}
          <AlertDialogFooter>
            <AlertDialogCancel>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
