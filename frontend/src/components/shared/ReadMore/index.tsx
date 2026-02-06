import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReadMoreProps {
  items: ReactNode[];
  initialCount?: number;
  className?: string;
}

export function ReadMore({ items, initialCount = 3, className = "" }: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const showAll = expanded || items.length <= initialCount;
  const displayItems = showAll ? items : items.slice(0, initialCount);

  return (
    <div className={`relative ${className}`}>
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <div
            key={index}
            className={`${
              !expanded && index === initialCount - 1 && items.length > initialCount
                ? "relative mb-12"
                : ""
            }`}
          >
            {item}
            {!expanded && index === initialCount - 1 && items.length > initialCount && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none rounded-lg" />
            )}
          </div>
        ))}
      </div>

      {items.length > initialCount && (
        <div className={`flex justify-center ${!expanded ? "-mt-8 relative z-10" : "mt-2"}`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Read Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Read More ({items.length - initialCount} more)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
