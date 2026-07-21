"use client";

import { JusbrasilLogo, JusbrasilMark } from "./brand-logo";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

const STEPS = [700, 4200];

/**
 * Device control — the "last switch this month" warning shown before a device
 * change, softening enforcement into a clear, conversion-oriented message.
 * Faithful to the real screen (exact colours). Pops in and loops.
 */
export function DeviceLastSwitch() {
  const reduce = usePrefersReducedMotion();
  const step = useLoopStep(STEPS, !reduce, reduce ? 1 : 0);
  const shown = step === 1;

  return (
    <div
      role="img"
      aria-label="Device control warning: this is your last device switch this month."
      className="relative flex h-full w-full items-center justify-center overflow-hidden p-6 sm:p-8"
    >
      <div
        className={`relative w-full max-w-[360px] rounded-2xl border border-[#edf0f4] bg-white p-5 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out-strong sm:p-6 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
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

        <button
          type="button"
          tabIndex={-1}
          className="mt-6 w-full rounded-lg bg-[#007a5f] py-2.5 text-[12px] font-semibold text-white"
        >
          Estou ciente e quero continuar
        </button>
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
