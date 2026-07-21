"use client";

import { JusIaLogo } from "./brand-logo";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

// step 0 = modal out, step 1 = modal in + held. Loops.
const STEPS = [700, 4200];

const BENEFITS = [
  "Busca confiável com IA, amparada na maior base jurídica do país",
  "Criação de peças jurídicas precisas de forma automatizada",
  "Análise segura e detalhada de referências jurídicas",
  "Mais todo o acervo de jurisprudência, modelos, peças e Doutrina",
];

/**
 * Jus AI — a faithful rebuild of the real output-based paywall modal, in the
 * product's exact colours sampled from the Lottie (green #007a5f, mint badge
 * #dafff7, slate ink #0f172a). Pops in at the moment of value, holds, and
 * loops. Replaces the 1.75 MB Lottie of the same modal.
 */
export function JusiaPaywall() {
  const reduce = usePrefersReducedMotion();
  const step = useLoopStep(STEPS, !reduce, reduce ? 1 : 0);
  const shown = step === 1;

  return (
    <div
      role="img"
      aria-label="Jus AI upgrade modal: an exclusive offer with a discounted plan, benefit list, and saved card."
      className="relative flex h-full w-full items-center justify-center overflow-hidden p-6 sm:p-8"
    >
      <div
        className={`relative w-full max-w-[440px] rounded-2xl border border-[#edf0f4] bg-white p-4 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out-strong sm:p-5 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
        }`}
        aria-hidden="true"
      >
        <div className="flex items-center justify-between">
          <JusIaLogo />
          <span className="text-base leading-none text-[#94a3b8]">&times;</span>
        </div>

        <span className="mt-3 inline-flex rounded-full bg-[#dafff7] px-2.5 py-0.5 text-[10px] font-medium text-[#007a5f]">
          Oferta exclusiva para você
        </span>

        <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-[#0f172a] sm:text-base">
          Atualize seu plano por mais R$ 80
        </h3>
        <p className="mt-1 text-[11px] text-[#7c8aa0] sm:text-xs">
          Seu plano passará de R$ 58,90 para{" "}
          <s className="text-[#a9b4c2]">R$ 208,90</s>{" "}
          <span className="font-medium text-[#455468]">R$ 138,90/mês</span>
        </p>

        <ul className="mt-3.5 space-y-1.5">
          {BENEFITS.map((benefit, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[11px] leading-snug text-[#455468] transition-all duration-500 ease-out-strong sm:text-xs"
              style={{
                transitionDelay: shown ? `${140 + i * 70}ms` : "0ms",
                opacity: shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(4px)",
              }}
            >
              <Check />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[10px] font-medium text-[#7c8aa0]">Pagar com:</p>
        <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-[#e3e8ee] p-2.5">
          <span className="rounded border border-[#e3e8ee] px-1.5 py-0.5 text-[9px] font-bold italic tracking-wide text-[#1a1f71]">
            VISA
          </span>
          <span className="flex-1 leading-tight">
            <span className="block text-[11px] text-[#0f172a]">Cartão de crédito</span>
            <span className="block text-[10px] text-[#7c8aa0]">Final 4242</span>
          </span>
          <span className="text-[11px] font-medium text-[#007a5f]">Alterar</span>
        </div>

        <button
          type="button"
          tabIndex={-1}
          className="mt-3 w-full rounded-lg bg-[#007a5f] py-2 text-[12px] font-semibold text-white"
        >
          Atualizar plano
        </button>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#007a5f"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
