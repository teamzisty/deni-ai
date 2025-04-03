"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Check, X } from "lucide-react";

export default function Compare() {
  return (
    <div className="container mx-auto py-10">
      <Table>
        <TableCaption>AI Assistant Comparison</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/5">機能</TableHead>
            <TableHead className="w-1/5">Deni AI</TableHead>
            <TableHead className="w-1/5">ChatGPT</TableHead>
            <TableHead className="w-1/5">Claude</TableHead>
            <TableHead className="w-1/5">Felo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">モデル</TableCell>
            <TableCell>OpenAI / Anthropic / Google / x.ai</TableCell>
            <TableCell>GPT-4o / GPT-4o mini</TableCell>
            <TableCell>Claude 3.5 Haiku</TableCell>
            <TableCell>GPT-4o</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">有料モデル</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" /> すべて無料
              </div>
            </TableCell>
            <TableCell>
              <span className="text-yellow-400">o1 </span> /{" "}
              <span className="text-yellow-400">o1 mini </span> /{" "}
              <span className="text-yellow-400">o1 pro</span>
            </TableCell>
            <TableCell>
              <span className="text-yellow-400">3.5 Sonnet</span> /{" "}
              <span className="text-yellow-400">3 Opus</span>
            </TableCell>
            <TableCell>
              <span className="text-yellow-400">o1-mini</span> /{" "}
              <span className="text-yellow-400">DeepSeek</span> <br />
              <span className="text-yellow-400">Anthropic</span> /{" "}
              <span className="text-yellow-400">Gemini</span> <br />
              <span className="text-yellow-400">Llama (Meta)</span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">ウェブ検索</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" />
              </div>
            </TableCell>
            <TableCell>
              <Check className="text-green-400" />
            </TableCell>
            <TableCell>
              <X className="text-red-400" />
            </TableCell>
            <TableCell>
              <Check className="text-green-400" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">ファイル分析 / 作成</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <X className="text-red-400" />
                実装予定
              </div>
            </TableCell>
            <TableCell>
              <Check className="text-green-400" />
            </TableCell>
            <TableCell>
              <Check className="text-green-400" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" />
                作成機能付き
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">価格</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" /> すべて無料
              </div>
            </TableCell>
            <TableCell>
              ¥3,100 / 月 <small>¥30,000/月</small>
            </TableCell>
            <TableCell>¥3,100 / 月 (Plus)</TableCell>
            <TableCell>
              ¥2,100 / 月 <small>¥21,000/年</small>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
