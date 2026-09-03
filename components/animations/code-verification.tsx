"use client";

import { JusbrasilLogo } from "./brand-logo";
import { useLoopStep, usePrefersReducedMotion } from "./use-loop-step";

// 0 empty · 1 typing (digits stagger in) · 2 filled + button enabled · 3 hold
const STEPS = [500, 1600, 1600, 1200];
const CODE = ["2", "0", "4", "8", "1", "5"];

/**
 * The six-digit account verification screen, as a card that takes its state
 * rather than keeping it: the caller owns the timing, this owns the screen.
 * Two of them drive it — the standalone loop below, and the second act of the
 * device-control sequence, which plays this in the same frame as the
 * disconnect modal (see components/animations/device-control).
 *
 * Rebuilt from the Figma frame (12:5830) at its stated geometry — a 440px
 * card, 36×40 digit boxes 8 apart, 16 between blocks — in the product's exact
 * colours, sampled from the Lottie this replaces (green #007a5f, slate ink).
 */
export function VerificationCard({
  typed,
  buttonEnabled,
  className = "",
}: {
  typed: boolean;
  buttonEnabled: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-[440px] rounded-2xl border border-[#edf0f4] bg-white p-4 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] sm:p-5 ${className}`}
      aria-hidden="true"
    >
      <JusbrasilLogo />

      <h3 className="mt-4 text-center text-[14px] font-semibold tracking-tight text-[#0f172a]">
        Insira o código de seis dígitos
      </h3>
      <p className="mx-auto mt-2 max-w-[280px] text-center text-[11px] leading-snug text-[#7c8aa0]">
        Você recebeu no email{" "}
        <span className="font-semibold text-[#455468]">pedro.mello@jusbrasil.com.br</span>{" "}
        um código para validação de conta
      </p>

      <div className="mt-4 flex justify-center gap-2">
        {CODE.map((digit, i) => (
          <span
            key={i}
            className="flex h-10 w-9 items-center justify-center rounded-lg border text-[15px] font-semibold text-[#0f172a] transition-colors duration-300"
            style={{ borderColor: typed ? "#007a5f" : "#d8dfe8" }}
          >
            <span
              className="transition-all duration-200 ease-out-strong"
              style={{
                opacity: typed ? 1 : 0,
                transform: typed ? "scale(1)" : "scale(0.6)",
                transitionDelay: typed ? `${i * 160}ms` : "0ms",
              }}
            >
              {digit}
            </span>
          </span>
        ))}
      </div>

      <button
        type="button"
        tabIndex={-1}
        disabled={!buttonEnabled}
        className="mt-4 w-full rounded-lg py-2.5 text-[12px] font-semibold transition-colors duration-300"
        style={
          buttonEnabled
            ? { backgroundColor: "#007a5f", color: "#ffffff" }
            : { backgroundColor: "#f1f5f9", color: "#9aa7b8" }
        }
      >
        Confirmar
      </button>

      <p className="mt-3 text-center text-[11px] text-[#7c8aa0]">
        Não recebeu o código?{" "}
        <span className="font-medium text-[#007a5f]">Tentar novamente (59s)</span>
      </p>
    </div>
  );
}

/**
 * The verification card on its own loop: the code fills in and Confirmar
 * enables. Kept as its own registry entry — the device-control case plays it
 * as the tail of one sequence, but the screen still stands alone.
 */
export function CodeVerification() {
  const reduce = usePrefersReducedMotion();
  const step = useLoopStep(STEPS, !reduce, 2);

  return (
    <div
      role="img"
      aria-label="Jusbrasil verification screen: a six-digit code fills in and the Confirm button enables."
      className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
    >
      <VerificationCard typed={step >= 1} buttonEnabled={step >= 2} />
    </div>
  );
}
