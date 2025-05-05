import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";

export const revalidate = false;

export default async function Page() {
  const dir  = path.join(process.cwd(), "public", "study-guides-ap-psych");
  const pdfs = (await fs.readdir(dir)).filter((f) => f.endsWith(".pdf"));

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gray-100 p-8 sm:p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="w-full flex flex-col gap-4 flex-row items-center justify-between">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">Study guides</h1>
          <Button variant="outline" className="flex gap-2 items-center self-start self-auto shrink-0 hover:scale-105" asChild>
            <Link href="/">
              <BookOpen className="w-5 h-5" />
              Flashcards
            </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {pdfs.map((file, i) => {
            const slug   = encodeURIComponent(file.replace(/\.pdf$/, ""));
            const pretty = slug.replace(/[-_]/g, " ");
            return (
              <Link key={file} href={`/study-guides/ap-psych/${slug}`} className="focus:outline-none group">
                <Card className="h-full cursor-pointer hover:scale-103 transition-transform">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="p-3 rounded-full bg-gray-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-snug capitalize">
                        {pretty}
                      </CardTitle>
                      <CardDescription className="pt-1">PDF • click to open</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
