import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
    params: { slug: string };
}

export default function Page({ params }: Props) {
    const { slug } = params;
    const src = `/study-guides-ap-psych/${encodeURIComponent(slug)}.pdf`;

    if (/[/\\]/.test(slug)) notFound();

    return (
        <main className="flex flex-col h-screen">
            <header className="flex items-center px-4 py-2 border-b bg-background/60 backdrop-blur">
                <Button asChild variant="ghost" size="icon" className="mr-2">
                    <a href="/study-guides/ap-psych">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back</span>
                    </a>
                </Button>
                <h2 className="text-sm font-medium truncate">
                    {slug.replace(/[-_]/g, " ")}
                </h2>
            </header>

            <iframe
                src={src}
                className="flex-1 w-full"
                title={slug}
                loading="lazy"
            />
        </main>
    );
}
