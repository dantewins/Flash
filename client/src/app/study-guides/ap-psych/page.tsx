import { promises as fs } from "fs"
import path from "path"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FileText, BookOpen } from "lucide-react"

export const revalidate = false

export default async function Page() {
  const dir = path.join(process.cwd(), "public", "study-guides-ap-psych")
  const pdfs = (await fs.readdir(dir)).filter((f) => f.endsWith(".pdf"))

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-3xl">
        {/* Header with title and flashcards button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">AP Psychology Study Guides</h1>
          </div>

          <Button variant="default" size="sm" className="bg-gray-900 hover:bg-gray-800 rounded-md" asChild>
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Flashcards
            </Link>
          </Button>
        </div>

        {/* List of PDF items as horizontal bars */}
        <div className="grid grid-cols-1 gap-4">
          {pdfs.map((file) => {
            const slug = encodeURIComponent(file.replace(/\.pdf$/, ""))
            const pretty = slug.replace(/[-_]/g, " ")

            return (
              <Link key={file} href={`/study-guides/ap-psych/${slug}`} className="block">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="font-medium text-base">{pretty}</h2>
                      <p className="text-xs text-gray-500 mt-1">PDF • Click to view</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
