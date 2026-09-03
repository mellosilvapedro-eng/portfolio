"use client";

/**
 * The seat-purchase card, driven from outside.
 *
 * Its own module because two sequences render it: the seat-adding loop that is
 * the case's last figure (seat-purchase), and the last-switch warning two
 * figures above it, which acknowledges the warning and lands here. A card that
 * appears in two figures has to be the same card in both — one copy, one set of
 * colours, one price.
 *
 * Presentational: it holds no timers and no step machine. The caller says how
 * many seats, whether the card is on screen, and whether the plus is being
 * pressed this instant; everything else follows from the seat count.
 */

/** R$ 49,48 a seat per month, in cents — the tier price the design states. */
export const PER_SEAT = 4948;

/** The plan's price before any seats are added, in cents. */
const CURRENT_PLAN = 5890;

/**
 * Cents → the Brazilian decimal the product prints, without Intl.
 *
 * Hand-rolled deliberately. This renders on the server as well as the client,
 * and `Intl.NumberFormat` is the kind of thing whose output can differ between
 * a Node build and a browser — a hydration mismatch over a comma. The grouping
 * separator never fires at the seat counts this animation reaches; it's here so
 * the function stays correct if it ever does.
 */
export function brl(cents: number): string {
  const digits = String(cents).padStart(3, "0");
  const whole = digits
    .slice(0, -2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${whole},${digits.slice(-2)}`;
}

export function SeatCard({
  seats,
  shown,
  pressing = false,
  delay = 0,
}: {
  /** How many seats the plan is being taken to. Drives the total. */
  seats: number;
  /** On screen, or in the loop's out-frame. */
  shown: boolean;
  /** The plus is down *this instant* — a tap, not a state. */
  pressing?: boolean;
  /** Hold the entrance back by this many ms, for a card that has to wait for
   *  another one to leave first (see the handoff in device-lastswitch). */
  delay?: number;
}) {
  /* The figures that move. During the tap the old number sits low and dim;
     the step that ends the tap swaps in the new number *and* releases these
     classes in the same render, so the transition carries the new figure up
     from where the old one was left. That's the whole animation — no keyframe,
     and nothing to fall out of step with the count. */
  const rising = `transition-all duration-300 ease-out-strong ${
    pressing ? "translate-y-px opacity-50" : "translate-y-0 opacity-100"
  }`;

  return (
    /* `relative` is load-bearing — the "Plano atual" badge hangs off the top
       edge — and it's why this takes no `className`: a caller passing
       `absolute` would lose the race, since Tailwind emits `relative` after
       `absolute` and the stylesheet's order decides, not the attribute's. A
       caller that needs this positioned wraps it. */
    <div
      className={`relative w-full max-w-[360px] rounded-2xl border border-[#edf0f4] bg-white p-5 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out-strong ${
        shown
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.97] opacity-0"
      }`}
      /* Entrance only. The style is gone by the render that hides the card, so
         the exit leaves at once instead of waiting out the handoff again. */
      style={delay && shown ? { transitionDelay: `${delay}ms` } : undefined}
      aria-hidden="true"
    >
      {/* Sits astride the card's top edge, as in the design. */}
      <span className="absolute -top-[11px] right-[19px] rounded-full border border-[#f7f7f7] bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-[#5d626b]">
        Plano atual
      </span>

      <p className="text-sm font-semibold leading-6 text-[#15171b]">Básico</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Stepper>
            <path d="M14.5 16H21.5" stroke="#15171b" strokeLinecap="round" />
          </Stepper>
          <span className="flex h-8 w-14 items-center justify-center rounded-lg border border-[#e6ebf1] text-[13px] font-semibold text-[#15171b] tabular">
            <span className={rising}>{seats}</span>
          </span>
          <Stepper pressing={pressing}>
            <path
              d="M13 16H23M18 11V21"
              stroke="#15171b"
              strokeWidth="1.37"
              strokeLinecap="round"
            />
          </Stepper>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="leading-none">
            <span className="block text-[22px] font-semibold text-[#15171b] tabular">
              R$ {brl(PER_SEAT)}
            </span>
            <span className="mt-0.5 block text-xs text-[#5d626b]">
              por usuário / mês
            </span>
          </span>
          <span className="rounded-full bg-[#f1fbf7] px-2 py-[3px] text-[11px] font-semibold leading-none text-[#184537] tabular">
            -16%
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-[13px] leading-none text-[#5d626b]">
        <p>
          Plano atual irá de{" "}
          <span className="font-bold text-[#455468]">R$ {brl(CURRENT_PLAN)}</span>{" "}
          para:
        </p>
        <p>
          <span className="text-sm">Total: </span>
          <span
            className={`inline-block text-lg font-semibold text-[#15171b] tabular ${rising}`}
          >
            R$ {brl(seats * PER_SEAT)}
          </span>
          / mês
        </p>
      </div>

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
        className="mt-4 h-11 w-full rounded-lg bg-[#007a5f] text-sm font-bold text-white"
      >
        Atualizar plano
      </button>
    </div>
  );
}

/** One 36×32 quantity button, drawn in the product's own 36×32 box. The plus
 *  takes a press; the minus never does, because nothing here removes a seat. */
function Stepper({
  pressing = false,
  children,
}: {
  pressing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`grid h-8 w-9 place-items-center rounded-lg border transition-all duration-150 ease-out-strong ${
        pressing
          ? "scale-95 border-[#cdd8e3] bg-[#f1f5f9]"
          : "scale-100 border-[#e6ebf1] bg-white"
      }`}
    >
      <svg
        width="36"
        height="32"
        viewBox="0 0 36 32"
        fill="none"
        aria-hidden="true"
        className="h-8 w-9"
      >
        {children}
      </svg>
    </span>
  );
}
