'use client';

import { Button } from './ui/button';

interface FilterButtonsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CATEGORIES = ['Todos', 'Res', 'Cerdo'];

export default function FilterButtons({
  activeCategory,
  setActiveCategory,
}: FilterButtonsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat}
          variant={activeCategory === cat ? 'default' : 'outline'}
          onClick={() => setActiveCategory(cat)}
          className="px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
        >
          {cat}
        </Button>
      ))}
    </div>
  );
}
