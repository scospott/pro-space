"use client";

import Link from "next/link";
import { Fragment } from "react";

export type StepState = {
  numero: 1 | 2 | 3;
  label: string;
  href: string;
  enabled: boolean;
};

type StepperProps = {
  steps: StepState[];
  current: 1 | 2 | 3;
};

export function Stepper({ steps, current }: StepperProps) {
  return (
    <nav aria-label="Étapes du devis" className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const on = step.numero === current;
        const done = step.numero < current;
        const pastille = (
          <i
            className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] text-[12px] not-italic ${
              on ? "border-brand bg-brand text-white" : done ? "border-ok text-ok" : "border-line"
            }`}
            aria-hidden="true"
          >
            {step.numero}
          </i>
        );
        const cls = `flex h-12 items-center gap-2 rounded-full py-1.5 pr-3 pl-2 font-medium whitespace-nowrap ${
          on ? "bg-brand-soft text-brand" : "text-muted"
        }`;
        return (
          <Fragment key={step.numero}>
            {i > 0 ? <span className="h-px w-[18px] bg-line" aria-hidden="true" /> : null}
            {step.enabled && !on ? (
              <Link href={step.href} className={cls}>
                {pastille}
                {step.label}
              </Link>
            ) : (
              <span className={`${cls} ${!step.enabled && !on ? "opacity-50" : ""}`} aria-current={on ? "step" : undefined} aria-disabled={!step.enabled || undefined}>
                {pastille}
                {step.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
