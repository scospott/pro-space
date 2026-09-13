import type { ReactNode } from "react";

type BottomBarProps = {
  left?: ReactNode;
  children?: ReactNode;
};

export function BottomBar({ left, children }: BottomBarProps) {
  return (
    <div className="flex h-[74px] shrink-0 items-center justify-end gap-3 border-t border-line bg-surface px-6">
      <div className="mr-auto min-w-0 truncate text-muted" aria-live="polite">
        {left}
      </div>
      {children}
    </div>
  );
}
