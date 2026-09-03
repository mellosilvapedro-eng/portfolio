"use client";

import type { AnimationProps } from "@/lib/animations";
import { PER_SEAT, SeatCard, brl } from "./seat-card";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

/* 0 out · 1 in at eight · 2 plus tapped · 3 nine seats · 4 plus tapped
   · 5 ten seats · 6 held · 7 out, still at ten.
 *
 * The taps are steps of their own rather than a timer inside a longer one,
 * because this hook's unit is the step and the two things want different
 * lengths: a press has to read as a press (~160ms) while the number it
 * produces has to hold long enough to be read.
 *
 * Step 7 is the one that isn't obvious. Without it the count would reset from
 * ten back to eight at step 0, and step 0 is where the card fades — so you'd
 * watch the figures snap backwards through the fade, which reads as a glitch
 * rather than as a loop. Resetting a frame later, with the card already gone,
 * costs 600ms and hides the seam. */
const STEPS = [400, 2000, 160, 900, 160, 900, 1800, 600];

/**
 * Self-service access — the seat-purchase card a customer reaches at the
 * device limit, instead of a dead end. A faithful rebuild in the product's own
 * colours (green #007a5f, slate ink #15171b, the same saved-card row the
 * upgrade modal uses), so the two Jusbrasil cases read as one product.
 *
 * Seats are added twice and the monthly total follows them up. Only the count
 * and the total move: the per-seat price and the −16% volume badge are the
 * design's stated tier and hold at every count, so the total is the one figure
 * being derived — eight, nine, then ten times R$ 49,48 — and the card never
 * shows a price this figure had to invent.
 */
export function SeatPurchase({ immediate }: AnimationProps) {
  const reduce = usePrefersReducedMotion();
  // Step 1 is the card at the design's own eight seats; step 0 is the loop's
  // out-frame, which is the wrong frame to resolve to when motion is off.
  const step = useLoopStep(STEPS, !reduce, reduce ? 1 : 0, immediate ? 1 : 0);

  // `>= 5` carries step 7 as well, which is what keeps ten on screen while the
  // card leaves. Step 0 falls through to eight, unseen.
  const seats = step >= 5 ? 10 : step >= 3 ? 9 : 8;

  return (
    <div
      role="img"
      aria-label={`Jusbrasil seat purchase: seats added to the Básico plan at R$ ${brl(
        PER_SEAT,
      )} each, the monthly total rising to R$ ${brl(10 * PER_SEAT)}, paid with a saved card.`}
      className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
    >
      <SeatCard
        seats={seats}
        shown={step >= 1 && step <= 6}
        pressing={step === 2 || step === 4}
      />
    </div>
  );
}
