"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, ArrowLeft, ArrowRight, Shuffle, BookOpen } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

function sortNumeric(a: string, b: string): number {
  const ax = a.match(/(\d+)/);
  const bx = b.match(/(\d+)/);
  const na = ax ? parseInt(ax[1], 10) : 0;
  const nb = bx ? parseInt(bx[1], 10) : 0;
  return na - nb;
}

const dataCtx = (require as any).context("../data", true, /\.json$/);

type DeckMap = Record<string, Flashcard[]>;
type FolderMap = Record<string, DeckMap>;
type LabelMap = Record<string, string>;

const FOLDERS: FolderMap = {};
const ORIGINAL_DECKS: DeckMap = {};
const LABELS: LabelMap = {};

(dataCtx.keys() as string[]).forEach((p) => {
  const [folder, file] = p.replace("./", "").split("/");
  const raw = (dataCtx(p)?.default ?? dataCtx(p)) as any[];
  if (!file || !raw.length) return;
  const title = raw[0].set ?? file.replace(".json", "");
  const deck = raw.slice(1) as Flashcard[];
  (FOLDERS[folder] ||= {})[file] = deck;
  ORIGINAL_DECKS[`${folder}/${file}`] = deck;
  LABELS[`${folder}/${file}`] = title;
});

const SHIFT = 80;
const ANGLE = 18;
const EASE = [0.45, 0, 0.55, 1] as const;

const slide: Variants = {
  skew: (d: number) => ({
    x: d === 0 ? 0 : d > 0 ? SHIFT : -SHIFT,
    rotateY: d === 0 ? 0 : d > 0 ? -ANGLE : ANGLE,
    originX: d === 0 ? 0.5 : d > 0 ? 0 : 1,
    opacity: 1,
    transition: { duration: 0 },
  }),
  center: {
    x: 0,
    rotateY: 0,
    originX: 0.5,
    opacity: 1,
    transition: { duration: 0.15, ease: EASE },
  },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export default function Page() {
  const folderNames = Object.keys(FOLDERS).sort(sortNumeric);
  const firstFolder = folderNames[0];
  const filesInFirst = Object.keys(FOLDERS[firstFolder]).sort(sortNumeric);
  const defaultKey = `${firstFolder}/${filesInFirst[0]}`;

  const [deckKey, setDeckKey] = useState(defaultKey);
  const [cards, setCards] = useState<Flashcard[]>([...ORIGINAL_DECKS[defaultKey]]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlip] = useState(false);
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [corner, setCorner] = useState<"tl" | "tr" | "bl" | "br">("br");
  const [dragging, setDragging] = useState(false);

  const posClasses: Record<typeof corner, string> = {
    tl: "top-3 left-3 sm:top-6 sm:left-6",
    tr: "top-3 right-3 sm:top-6 sm:right-6",
    bl: "bottom-3 left-3 sm:bottom-6 sm:left-6",
    br: "bottom-3 right-3 sm:bottom-6 sm:right-6",
  };

  const lastRef = useRef(0);
  const nowOk = () => {
    const n = Date.now();
    if (n - lastRef.current < 100) return false;
    lastRef.current = n;
    return true;
  };

  const paginate = useCallback(
    (d: 1 | -1) => {
      if (!nowOk()) return;
      const next = idx + d;
      if (next < 0 || next >= cards.length) return;
      setFlip(false);
      setDir(d);
      setIdx(next);
    },
    [idx, cards.length]
  );

  const shuffle = () => {
    if (!nowOk()) return;
    const a = [...cards];
    for (let i = a.length - 1; i; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setSpinning(true);
    setCards(a);
    setIdx(0);
    setDir(0);
    setFlip(false);

    setTimeout(() => {
      setSpinning(false);
    }, 300);
  };

  useEffect(() => {
    if (!searchOpen) return;
    const term = cards[idx].front.toLowerCase().replace(/\s+/g, "-");
    setLoading(true);
    fetch(
      `https://4hb3d9itb2.execute-api.us-east-1.amazonaws.com/prod/getdopdefinitions?q=${term}`
    )
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.terms || []);
        setLoading(false);
      });
  }, [searchOpen, idx, cards]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") paginate(-1);
      else if (e.code === "ArrowRight") paginate(1);
      else if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) setFlip((f) => !f);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [paginate]);

  const card = cards[idx];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="absolute top-4 inset-x-0 flex justify-center">
        <Select
          value={deckKey}
          onValueChange={(v) => {
            setDeckKey(v);
            setCards([...ORIGINAL_DECKS[v]]);
            setIdx(0);
            setFlip(false);
            setDir(0);
          }}
        >
          <SelectTrigger className="w-60 bg-white cursor-pointer">
            <SelectValue placeholder="Choose deck" />
          </SelectTrigger>
          <SelectContent>
            {folderNames.map((folder) => (
              <SelectGroup key={folder}>
                <SelectLabel>{folder}</SelectLabel>
                {Object.keys(FOLDERS[folder])
                  .sort(sortNumeric)
                  .map((fileName) => {
                    const value = `${folder}/${fileName}`;
                    return (
                      <SelectItem key={value} value={value}>
                        {LABELS[value]}
                      </SelectItem>
                    );
                  })}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[90vw] sm:w-full max-w-[48rem] flex flex-col">
        <div className="flex items-center justify-between mb-4 h-12">
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="cursor-pointer hover:scale-105">
                <Search className="h-7 w-7" strokeWidth="3px" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
              <DialogHeader className="flex flex-col space-y-0.5 text-left">
                <DialogTitle>Definition</DialogTitle>
                <DialogDescription>
                  Definition for <strong>{card.front}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                {loading && <p>Loading...</p>}

                {!loading && entries.length === 0 && (
                  <p>No definition found for “{card.front}.”</p>
                )}
                {!loading &&
                  entries.map((e, i) => (
                    <div key={i} className="mb-4">
                      <div
                        className="text-lg font-semibold"
                        dangerouslySetInnerHTML={{ __html: e.term }}
                      />
                      <div
                        className="prose"
                        dangerouslySetInnerHTML={{ __html: e.definition }}
                      />
                    </div>
                  ))}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setSearchOpen(false)}
                  className="hover:cursor-pointer"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl font-bold leading-none">{idx + 1} / {cards.length}</span>
          </div>
          <Button variant="outline" size="lg" onClick={shuffle} className="cursor-pointer hover:scale-105">
            <Shuffle className={`h-7 w-7 transition-transform ${spinning ? "animate-[spin_0.3s_ease-in-out]" : ""}`} strokeWidth="3px" />
          </Button>
        </div>
        <div className="relative w-full aspect-video" style={{ perspective: 1200 }}>
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              variants={slide}
              initial="skew"
              animate="center"
              exit="exit"
              className="absolute inset-0 cursor-pointer select-none"
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => nowOk() && setFlip(!flipped)}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ rotateX: flipped ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card className="absolute inset-0 grid place-items-center overflow-y-auto [backface-visibility:hidden]">
                  <CardContent
                    className="w-full px-6 py-8 text-2xl text-center whitespace-pre-wrap"
                  >
                    {card.front}
                  </CardContent>
                </Card>
                <Card
                  className="absolute inset-0 grid place-items-center overflow-y-auto [backface-visibility:hidden] py-4"
                  style={{ transform: "rotateX(180deg)" }}
                >
                  <CardContent
                    className="w-full px-10 text-lg sm:text-xl text-center whitespace-pre-wrap"
                  >
                    {card.back}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between mt-8">
          <Button size="lg" className="cursor-pointer w-15 hover:scale-105" disabled={idx === 0} onClick={() => paginate(-1)}>
            <ArrowLeft className="h-7 w-7" strokeWidth="3px" />
          </Button>
          <Button size="lg" className="cursor-pointer w-15 hover:scale-105" disabled={idx === cards.length - 1} onClick={() => paginate(1)}>
            <ArrowRight className="h-7 w-7" strokeWidth="3px" />
          </Button>
        </div>
      </div>
      <TooltipProvider delayDuration={150}>
        <motion.div
          key={corner}
          drag
          dragMomentum={false}
          animate={{ x: 0, y: 0 }}
          transition={{ duration: 0 }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false);
            const { innerWidth: w, innerHeight: h } = window;
            const { x, y } = info.point;
            const newCorner =
              x < w / 2 ? (y < h / 2 ? "tl" : "bl") : y < h / 2 ? "tr" : "br";
            setCorner(newCorner);
          }}
          className={`fixed z-50 ${posClasses[corner]}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/study-guides/ap-psych"
                draggable={false}
                onClick={(e) => {
                  if (dragging) e.preventDefault();
                }}
              >
                <Button
                  variant="default"
                  className="w-17 h-17 rounded-full hover:scale-102 cursor-pointer transition-transform"
                >
                  <BookOpen className="!w-6 !h-6" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">Open Library</TooltipContent>
          </Tooltip>
        </motion.div>
      </TooltipProvider>
    </div>
  );
}
