"use client";

import { JusbrasilLogo } from "./brand-logo";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

// two states, the selection slides between them
const STEPS = [2000, 2000];
const OPTIONS = ["Consultar Processo", "Pesquisa Jurídica"];

/**
 * Segmented homepage — a faithful rebuild of the hero segmented control that
 * splits the two audiences ("Consultar Processo" / "Pesquisa Jurídica"). The
 * dark selection slides between them on a loop. Exact colours sampled from the
 * Lottie (ink #0f172a). Replaces the 5 MB Lottie.
 */
export function SegmentedToggle() {
  const reduce = usePrefersReducedMotion();
  const step = useLoopStep(STEPS, !reduce, 0);
  const active = step === 1 ? 1 : 0;

  return (
    <div
      role="img"
      aria-label="Segmented homepage hero: a control slides between Consultar Processo and Pesquisa Jurídica."
      className="relative flex h-full w-full items-center justify-center overflow-hidden p-6 sm:p-8"
    >
      <div
        className="relative w-full max-w-[520px] rounded-2xl border border-[#edf0f4] bg-white p-4 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] sm:p-5"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between">
          <JusbrasilLogo />
          <span className="flex items-center gap-2">
            <span className="rounded-md border border-[#e6ebf1] px-2.5 py-1 text-[11px] font-medium text-[#007a5f]">
              Cadastre-se
            </span>
            <span className="rounded-md border border-[#e6ebf1] px-2.5 py-1 text-[11px] font-medium text-[#455468]">
              Entrar
            </span>
          </span>
        </div>

        <div className="flex items-center justify-center px-1 pb-6 pt-14">
          <div className="relative flex w-full max-w-[420px] rounded-full border border-[#e6ebf1] bg-white p-1 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)]">
            <span
              className="absolute bottom-1 top-1 rounded-full bg-[#0f172a] transition-all duration-500 ease-out-strong"
              style={{
                left: active ? "50%" : "0.25rem",
                right: active ? "0.25rem" : "50%",
              }}
            />
            {OPTIONS.map((option, i) => (
              <span
                key={option}
                className="relative z-10 flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold transition-colors duration-300"
                style={{ color: active === i ? "#ffffff" : "#0f172a" }}
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
