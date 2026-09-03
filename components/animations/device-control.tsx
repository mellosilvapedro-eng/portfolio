"use client";

import type { AnimationProps } from "@/lib/animations";
import { JusbrasilLogo } from "./brand-logo";
import { VerificationCard } from "./code-verification";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

/* Two modals, one frame — the order the customer meets them in.
   Act one: 0 out · 1 list in · 2 device selected (button enabled) · 3
   disconnected · 4 modal out. Act two: 5 code screen in · 6 digits type · 7
   code accepted (Confirmar enabled) · 8 out.

   Step 4 is 600 rather than the 500 the loop closes on, and that hundred
   milliseconds is the whole distinction being drawn: a beat between two screens
   of the same flow, against the longer dead frame between one cycle and the
   next. Any shorter and the second modal starts arriving while the first is
   still fading, which reads as two things overlapping instead of one replacing
   the other. */
const STEPS = [400, 1600, 1500, 1700, 600, 500, 1500, 1500, 500];
const SELECTED = 1;

type DeviceType = "laptop" | "phone";
const DEVICES: { os: string; sub: string; icon: DeviceType }[] = [
  { os: "macOS · Safari", sub: "Último acesso em 23/01 às 15:32", icon: "laptop" },
  { os: "Windows · Chrome", sub: "Último acesso em 22/01 às 09:14", icon: "laptop" },
  { os: "iOS · Chrome", sub: "Último acesso em 20/01 às 21:03", icon: "phone" },
];

/**
 * Device control — a faithful rebuild of the real "you exceeded the access
 * limit" screen, in the product's exact colours sampled from the Lottie
 * (Jusbrasil mark, green #007a5f, slate ink). Pick a session, Disconnect
 * enables, the device drops off — and then the screen that actually follows it
 * in the product, the six-digit verification, takes the same frame. Loops.
 * Replaces the 2.96 MB Lottie.
 *
 * One tile rather than two because the two screens are one flow: the case
 * calls this "progressive warnings", and a warning that ends at the disconnect
 * only shows half of what the customer is asked to do.
 */
export function DeviceControl({ immediate }: AnimationProps) {
  const reduce = usePrefersReducedMotion();
  // Step 1 is where the first card is on screen; step 0 is the loop's
  // out-frame.
  const step = useLoopStep(STEPS, !reduce, reduce ? 2 : 0, immediate ? 1 : 0);

  const shown = step >= 1 && step <= 3;
  const buttonEnabled = step === 2;
  const codeShown = step >= 5 && step <= 7;

  return (
    <div
      role="img"
      aria-label="Jusbrasil access-limit screen: a device is selected from the session list and disconnected, then a six-digit code is entered to verify the account."
      className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
    >
      {/* Fixed artboard, and it holds both acts. Height first: the selected row
          collapses out mid-loop, so the disconnect card's own height drops
          ~58px every cycle — enough to shove the page below it up and down.
          Reserving the tallest state holds the stage still and pins that card's
          top edge, so only the list compacts.

          Width is the verification card's 440, from the Figma, which is the
          wider of the two — the disconnect modal keeps its own 360 and sits
          centred in it. A box that changed size between acts would make the
          swap a resize as well as a swap, and the whole point of playing them
          here is that the frame stays put while the screen inside it changes. */}
      <div className="relative h-[360px] w-full max-w-[440px]">
        {/* Act one, pinned to the top of the artboard — see above. */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div
            className={`relative w-full max-w-[360px] rounded-2xl border border-[#edf0f4] bg-white p-4 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out-strong sm:p-5 ${
              shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
            }`}
            aria-hidden="true"
          >
            <JusbrasilLogo />

            <h3 className="mt-3.5 text-[13px] font-semibold leading-snug tracking-tight text-[#0f172a] sm:text-sm">
              Você ultrapassou o limite de acessos com a sua conta
            </h3>
            <p className="mt-1 text-[11px] text-[#7c8aa0]">
              Desconecte um dispositivo para continuar
            </p>

            <ul className="mt-3.5">
              {DEVICES.map((device, i) => {
                const selected = i === SELECTED && step === 2;
                const collapsed = i === SELECTED && step >= 3;
                return (
                  <li
                    key={device.os}
                    className="overflow-hidden transition-all duration-500 ease-out-strong"
                    style={{
                      maxHeight: collapsed ? 0 : 72,
                      marginBottom: collapsed ? 0 : 8,
                      opacity: collapsed ? 0 : shown ? 1 : 0,
                      transform: shown ? "translateY(0)" : "translateY(8px)",
                      transitionDelay: shown ? `${i * 70}ms` : "0ms",
                    }}
                  >
                    <div
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300"
                      style={{
                        borderColor: selected ? "#007a5f" : "#e6ebf1",
                        backgroundColor: selected ? "#f1fbf7" : "#ffffff",
                      }}
                    >
                      <DeviceIcon type={device.icon} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[12px] text-[#0f172a]">
                          {device.os}
                        </span>
                        <span className="block truncate text-[10px] text-[#7c8aa0]">
                          {device.sub}
                        </span>
                      </span>
                      <Radio filled={selected} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              tabIndex={-1}
              disabled={!buttonEnabled}
              className="w-full rounded-lg py-2.5 text-[12px] font-semibold transition-colors duration-300"
              style={
                buttonEnabled
                  ? { backgroundColor: "#007a5f", color: "#ffffff" }
                  : { backgroundColor: "#f1f5f9", color: "#9aa7b8" }
              }
            >
              Desconectar
            </button>
          </div>
        </div>

        {/* Act two. Centred, not pinned: this card's height never changes, so
            there's nothing to hold still, and centring it stops the shorter
            screen from hanging off the top of a box drawn for the taller one.
            The cards never overlap at any opacity, so the two anchors are
            never on screen together. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <VerificationCard
            typed={step >= 6}
            buttonEnabled={step >= 7}
            className={`transition-all duration-500 ease-out-strong ${
              codeShown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function Radio({ filled }: { filled: boolean }) {
  return (
    <span
      className="grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors duration-300"
      style={{ borderColor: filled ? "#007a5f" : "#cbd5e1" }}
      aria-hidden="true"
    >
      <span
        className={`h-2 w-2 rounded-full bg-[#007a5f] transition-transform duration-300 ${
          filled ? "scale-100" : "scale-0"
        }`}
      />
    </span>
  );
}

function DeviceIcon({ type }: { type: DeviceType }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#788ca6"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      {type === "laptop" ? (
        <>
          <rect x="4" y="5" width="16" height="11" rx="1.5" />
          <path d="M2.5 19.5h19" />
        </>
      ) : (
        <>
          <rect x="7.5" y="3.5" width="9" height="17" rx="2" />
          <path d="M11 17.5h2" />
        </>
      )}
    </svg>
  );
}
