"use client";

import type { AnimationProps } from "@/lib/animations";
import { JusbrasilLogo, JusbrasilMark } from "./brand-logo";
import { SeatCard } from "./seat-card";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

/* 0 out · 1 warning in · 2 acknowledged, the button working · 3 the seat card. */
const STEPS = [700, 2300, 1100, 3000];

/**
 * How long the seat card waits before entering.
 *
 * The two cards share one position, so a straight crossfade would put two
 * white cards and two shadows on top of each other for a quarter of a second.
 * `ease-out-strong` is ~85% resolved in the first third of its 500ms, so by
 * 180ms the outgoing card is all but gone — long enough that the hand-off
 * reads as one card replacing another, short enough that it doesn't read as a
 * gap.
 */
const HANDOFF = 180;

/**
 * Device control — the "last switch this month" warning, and where
 * acknowledging it goes.
 *
 * Two cards in one frame, because the warning is only half the argument. On
 * its own it's a restriction; followed by the seat card it's the case's actual
 * claim — that the limit was built as a path to paid access rather than as a
 * wall. So the button is pressed, it works for a moment, and the purchase card
 * takes the warning's place.
 *
 * The seat card is the same component the case's last figure animates (see
 * ./seat-card), rendered here at the design's eight seats and left alone: this
 * figure is about arriving at it, the one below is about using it.
 */
export function DeviceLastSwitch({ immediate }: AnimationProps) {
  const reduce = usePrefersReducedMotion();
  // Step 1 is the warning on screen, which is the frame this figure is
  // captioned for; step 0 is the loop's out-frame.
  const step = useLoopStep(STEPS, !reduce, reduce ? 1 : 0, immediate ? 1 : 0);
  const warning = step === 1 || step === 2;
  const working = step === 2;

  return (
    <div
      role="img"
      aria-label="Jusbrasil device control: the last-switch warning is acknowledged, and the seat-purchase card takes its place."
      className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
    >
      {/* Fixed artboard, for the reason device-control states at the same
          number: two cards of different heights share this position, and left
          to itself the stage would grow and shrink by ~60px every cycle and
          shove the page under it. Reserving the taller card's height pins both
          cards' top edge so only their contents change.

          It's also the box the lightbox measures (measureArtboard in
          components/media-zoom takes the root's first element child), so it has
          to be the size worth enlarging rather than whichever card is up. */}
      <div className="relative h-[360px] w-full max-w-[360px]">
        <div
          className={`absolute inset-x-0 top-0 rounded-2xl border border-[#edf0f4] bg-white p-5 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out-strong sm:p-6 ${
            warning
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-2 scale-[0.97] opacity-0"
          }`}
          aria-hidden="true"
        >
          <JusbrasilLogo />

          <div className="mt-6 flex justify-center">
            <Illustration />
          </div>

          <h3 className="mt-5 text-center text-[15px] font-semibold leading-snug tracking-tight text-[#0f172a]">
            Esta é a sua última troca de dispositivos
          </h3>
          <p className="mx-auto mt-1.5 max-w-[260px] text-center text-[11px] leading-snug text-[#7c8aa0]">
            Só é possível{" "}
            <span className="font-semibold text-[#455468]">
              realizar apenas uma troca de dispositivos por mês.
            </span>
          </p>

          {/* The label stays in flow and the spinner is laid over it, so the
              button keeps the exact box it has at rest — a working button that
              changes height would take the card's own height with it. */}
          <button
            type="button"
            tabIndex={-1}
            className={`relative mt-6 w-full rounded-lg py-2.5 text-[12px] font-semibold text-white transition-colors duration-150 ease-out-strong ${
              working ? "bg-[#00694f]" : "bg-[#007a5f]"
            }`}
          >
            <span
              className={`transition-opacity duration-150 ease-out-strong ${
                working ? "opacity-0" : "opacity-100"
              }`}
            >
              Estou ciente e quero continuar
            </span>
            <span
              className={`absolute inset-0 grid place-items-center transition-opacity duration-200 ease-out-strong ${
                working ? "opacity-100" : "opacity-0"
              }`}
            >
              <Spinner />
            </span>
          </button>
        </div>

        {/* Wrapped rather than positioned through a prop — the card owns its
            own `relative` for the badge that hangs off its top edge. */}
        <div className="absolute inset-x-0 top-0">
          <SeatCard seats={8} shown={step === 3} delay={HANDOFF} />
        </div>
      </div>
    </div>
  );
}

/** Stacked device windows, echoing the real screen's spot illustration. */
function Illustration() {
  return (
    <div className="relative h-14 w-20">
      <span className="absolute left-0 top-2 h-10 w-14 -rotate-6 rounded-md border border-[#cdd8e3] bg-[#f5f8fb]" />
      <span className="absolute right-0 top-1 h-10 w-14 rotate-6 rounded-md border border-[#cdd8e3] bg-[#f5f8fb]" />
      <span className="absolute left-1/2 top-0 grid h-11 w-16 -translate-x-1/2 place-items-center rounded-md border border-[#c9d4df] bg-white shadow-[0_6px_16px_-8px_rgba(15,23,42,0.25)]">
        <JusbrasilMark />
      </span>
    </div>
  );
}

/** The button working. `motion-reduce:animate-none` is belt and braces — with
 *  motion off the loop resolves to the warning step, where this is already at
 *  zero opacity and never shown. */
function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.75"
      />
      <path
        d="M12.5 7A5.5 5.5 0 0 0 7 1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
