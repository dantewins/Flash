"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
import { Search, ArrowLeft, ArrowRight, Shuffle } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
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
  if (!file) return;
  const raw = (dataCtx(p)?.default ?? dataCtx(p)) as any[];
  if (!raw.length) return;
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

export default function FlashcardPage() {
  const folderNames = Object.keys(FOLDERS);
  const defaultKey = `${folderNames[0]}/${Object.keys(FOLDERS[folderNames[0]])[0]}`;

  const [deckKey, setDeckKey] = useState(defaultKey);
  const [cards, setCards] = useState<Flashcard[]>([...ORIGINAL_DECKS[defaultKey]]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlip] = useState(false);
  const [dir, setDir] = useState<0 | 1 | -1>(0);

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
    setCards(a);
    setIdx(0);
    setDir(0);
    setFlip(false);
  };

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
                {Object.keys(FOLDERS[folder]).map((name) => {
                  const v = `${folder}/${name}`;
                  return (
                    <SelectItem key={v} value={v}>
                      {LABELS[v]}
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
          <Button variant="outline" size="lg" className="cursor-pointer" onClick={() => {}}>
            <Search className="h-7 w-7" strokeWidth="3px" />
          </Button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl font-bold leading-none">
              {idx + 1} / {cards.length}
            </span>
          </div>
          <Button variant="outline" size="lg" className="cursor-pointer" onClick={shuffle}>
            <Shuffle className="h-7 w-7" strokeWidth="3px" />
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
              onClick={() => {
                if (nowOk()) setFlip(!flipped);
              }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ rotateX: flipped ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">
                  <CardContent className="h-full w-full flex items-center justify-center text-2xl text-center px-6 py-8 overflow-y-auto">
                    {card.front}
                  </CardContent>
                </Card>
                <Card
                  className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]"
                  style={{ transform: "rotateX(180deg)" }}
                >
                  <CardContent className="h-full w-full flex items-center justify-center text-xl text-center px-10 py-8 overflow-y-auto">
                    {card.back}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button size="lg" className="cursor-pointer w-15" disabled={idx === 0} onClick={() => paginate(-1)}>
            <ArrowLeft className="h-7 w-7" strokeWidth="3px" />
          </Button>
          <Button
            size="lg"
            className="cursor-pointer w-15"
            disabled={idx === cards.length - 1}
            onClick={() => paginate(1)}
          >
            <ArrowRight className="h-7 w-7" strokeWidth="3px" />
          </Button>
        </div>
      </div>
    </div>
  );
}
