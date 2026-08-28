export type Metric = {
  value: string;
  label: string;
};

export type ProcessStep = {
  /** Replaces the case page's 01 / 02 / 03 with a label of the step's own — a
   *  quarter, a phase name. A process that actually ran on the calendar reads
   *  better dated than counted, and the numbers say nothing the order doesn't. */
  label?: string;
  title: string;
  description: string;
};

/**
 * A case's problem statement.
 *
 * A plain string is one paragraph, which is all most cases need. The object
 * form is for a problem that genuinely has sides — a lead line, then named
 * parts — rather than one paragraph pretending to be a single thought. The
 * page renders the parts as a titled run at the same measure; nothing about
 * the section's own heading changes.
 */
export type Problem =
  | string
  | {
      lead: string;
      parts: { title: string; body: string }[];
    };

export type MediaItem = {
  /** How the asset is rendered. */
  type: "image" | "video" | "component";
  /** Path under /public (for image / video) — e.g. "/projects/x/seats.mp4". */
  src?: string;
  /** Registry key for type: "component" — e.g. "jusia-paywall". */
  component?: string;
  /** Alt text for images / accessible label for video. */
  alt?: string;
  /** Optional caption shown beneath the tile. */
  caption?: string;
  /** Poster frame for videos (path under /public). */
  poster?: string;
  /** "full" spans the row; "half" pairs 2-up. Defaults to "full". */
  span?: "full" | "half";
  /** CSS aspect-ratio for the stage, e.g. "16 / 9". Defaults to "16 / 9". */
  aspect?: string;
  /** How image / video fills the stage. Defaults to "contain". */
  fit?: "cover" | "contain";
  /** Video only. Marks a clip as something to be *watched* rather than a
   *  moving thumbnail: the lightbox gives it player controls, plays it with its
   *  audio, and starts it from the beginning instead of inheriting the muted
   *  tile's playhead. The tile itself stays muted — every browser refuses to
   *  autoplay audible video, so a clip that asked for sound on the page would
   *  simply not play at all. The click that opens the lightbox is the user
   *  gesture that earns the audio. */
  sound?: boolean;
  /** When true, the image floats on the neutral stage with a rounded border +
   * shadow (like the video), instead of rendering edge-to-edge. */
  frame?: boolean;
};

export type Project = {
  slug: string;
  /** Short title used in the home list. */
  title: string;
  /** Full headline used on the case study page. */
  headline: string;
  company: string;
  year: string;
  role: string;
  /** e.g. "Shipped", "Experiment". */
  status: string;
  /** Live product / company link. */
  url?: string;
  /** Collaborators on the project. */
  team?: string;
  /** One-line summary shown under the home list title. */
  summary: string;
  problem: Problem;
  solution: string;
  process: ProcessStep[];
  results: Metric[];
  /** Media shown in the gallery at the end of the case study. */
  media?: MediaItem[];
  /** Set to false for projects that are still drafts. */
  published: boolean;
};

export const projects: Project[] = [
  {
    slug: "ai-onboarding",
    title: "AI-driven onboarding: 67% faster",
    headline: "AI-driven onboarding: 67% faster",
    company: "Factorial",
    year: "2026",
    role: "Product Designer",
    status: "Shipped",
    url: "https://factorialhr.com/",
    team: "Product Manager, Engineering, Onboarding Specialist",
    summary:
      "Turning an expert-led setup into one companies can run themselves.",
    problem: {
      lead: "At Factorial, onboarding was a big problem on two sides:",
      parts: [
        {
          title: "Business Problem",
          body: "The fully human onboarding model couldn't scale to meet the year's business goals. Each company required ~6 hours and took 45+ days to complete, creating a growing dependency on headcount and limiting our ability to scale.",
        },
        {
          title: "User Problem",
          body: "Customers faced significant friction throughout the process and often didn't realize they could start onboarding themselves. Complex setups also led to broken flows, delaying time to value.",
        },
      ],
    },
    solution:
      "I developed an AI-driven onboarding system that simplifies setup by transforming business rules into clear, easy-to-follow steps.",
    process: [
      {
        label: "Q1 2026",
        title: "AI voice assistant",
        description:
          "First version, deliberately narrow. An AI voice assistant, one market (Spain), small companies only — just enough to test whether onboarding could be automated at all.",
      },
      {
        label: "Q2 2026",
        title: "Guided self-setup AI-system",
        description:
          "The AI voice was validated and discarded, so we rebuilt the whole experience around guided self-setup, opened it to all markets, and ran a controlled test against the old expert-led flow.",
      },
      {
        label: "Q3 2026",
        title: "Scale the winner",
        description:
          "Roll out to every new small company, make it the default starting point, and add a mechanism that keeps the in-product guidance current as the interface changes.",
      },
    ],
    results: [
      { value: "67%", label: "faster setup. 45d → 15d" },
      {
        value: "~€ 1.5M",
        label: "projected onboarding savings for the year",
      },
      { value: "4.9", label: "customer satisfaction with the onboarding" },
    ],
    /* Three clips and one screenshot, in the design's order. Each `aspect` is
       the asset's own pixel ratio, the same way the Jus AI case states its: the
       stage takes that ratio and the media sits on it uncropped.

       The exception is the first clip. It was letterboxed into 16:9 at capture
       — 18 black rows above the recording and 20 below — which the dark theme
       hid and the light one showed as two bands. Both the tile and the home
       page's hover card lay a clip out as `object-cover` on a stage of this
       ratio, so declaring the *content's* ratio rather than the file's makes
       the two of them crop the bands off. 680 rather than 682: the bars aren't
       symmetric, and cover crops evenly, so the ratio has to be cut to the
       larger of the two.

       The screenshot is the design's `Detail` frame exported at 3x and cropped
       to the screen itself. Figma bakes the canvas it sits on into any export
       of it — #131313, opaque, alpha channel or not — so the first version
       arrived with a black slab around the window that read as the ground on
       the dark theme and as a hole on the light one. Cropped to the screen and
       squared off at the corners, it takes `frame` like the Jus IA
       screenshots: the neutral stage under it is the theme's rather than the
       export's, and the border lands on the screen's own edge.

       Only the first clip carries a `poster`. It's `media[0]`, which is what
       the home page's hover card shows, and that card loads with
       `preload="none"` — so without a still there's an empty stage until 17MB
       of video arrives. The gallery's own tiles autoplay with `preload="auto"`
       and never need one. */
    media: [
      {
        type: "video",
        src: "/projects/ai-onboarding/voice-assistant.mp4",
        poster: "/projects/ai-onboarding/voice-assistant-poster.jpg",
        aspect: "1280 / 680",
        sound: true,
        alt: "The AI voice assistant walking a new company through its Get started checklist.",
        caption:
          "We discontinued the AI voice assistant due to low adoption and high error rates revealed during testing.",
      },
      {
        type: "video",
        src: "/projects/ai-onboarding/guided-setup.mp4",
        aspect: "2208 / 1080",
        alt: "The guided self-setup reading the interface and stepping the user through basic configuration.",
        caption:
          "To replace the voice, we created a self-guided AI setup that understands the UI and helps users navigate the setup process.",
      },
      {
        type: "image",
        src: "/projects/ai-onboarding/get-started.png",
        frame: true,
        aspect: "725 / 413",
        alt: "Factorial's Get started page: the left nav beside a progress bar reading 0 of 10 modules completed, a Basic configuration card with Add people expanded over five more setup tasks, and Module configuration locked below it.",
        caption:
          "Get started page — I've built a get started page to concentrate all tasks in the same place.",
      },
      {
        type: "video",
        src: "/projects/ai-onboarding/onboarding-intro.mp4",
        aspect: "2208 / 1080",
        alt: "The onboarding intro, customisable with AI.",
        caption:
          "Onboarding intro + customizable with AI — onboarding is the first impression of a product, so the design should shine.",
      },
    ],
    published: true,
  },
  {
    slug: "monetization-jusia",
    title: "Turning AI into profit with a 40% revenue lift",
    headline:
      "Turning AI into revenue: the monetization strategy that boosted profits by 40%",
    company: "Jusbrasil",
    year: "2025",
    role: "Product Designer",
    status: "Shipped",
    url: "https://ia.jusbrasil.com.br",
    team: "Product Managers, Engineers, Business Strategists",
    summary: "Designing monetization for Jus AI without breaking user trust.",
    problem:
      "We had to design monetization for an emerging AI product with no established pricing. The core tension was clear: monetize AI without breaking user trust or hurting engagement.",
    solution:
      "I introduced output-based paywalls — triggers activated only after the AI delivers a high-value result. The strategy relied on identifying the aha-moment in each journey and positioning the upgrade prompt immediately afterward, when perceived value is highest.",
    process: [
      {
        title: "Research & benchmarking",
        description:
          "Analyzed competitors like Notion AI, Grammarly, Claude, and ChatGPT to find the balance point between value and monetization.",
      },
      {
        title: "Aha-moment mapping",
        description:
          "Reviewed behavioral data and session recordings, which revealed that post-generation moments — right after a legal draft or completed research — were the optimal paywall positions.",
      },
      {
        title: "Design decisions",
        description:
          "Created four flowchart variations mapping the purchase journey, designed contextual upgrade modals based on user intent, and repositioned pricing within the existing subscription tiers.",
      },
    ],
    results: [
      { value: "+40%", label: "ARPU growth" },
      { value: "5,000+", label: "new subscriptions post-launch" },
      { value: "20,000", label: "monthly active subscribers in 4 months" },
    ],
    media: [
      {
        type: "video",
        src: "/projects/monetization-jusia/video-example-1.mp4",
        aspect: "2164 / 1080",
        alt: "Jus AI product walkthrough.",
        caption: "Jus AI answering a legal due-diligence prompt.",
      },
      {
        type: "image",
        src: "/projects/monetization-jusia/response-limit-paywall.png",
        frame: true,
        aspect: "1512 / 875",
        alt: "The Jus IA chat with a due-diligence answer on screen and an inline card below it reading 'Você chegou no limite de respostas', with an 'Assinar agora' button.",
        caption:
          "The trigger in context — the response limit lands under a finished answer, not before it.",
      },
      {
        type: "component",
        component: "jusia-paywall",
        caption: "The output-based paywall, shown right after the AI delivers value.",
      },
      {
        type: "image",
        src: "/projects/monetization-jusia/plans-repackaging.png",
        frame: true,
        aspect: "1512 / 875",
        alt: "Jusbrasil's plans page after the repackaging: Essencial, Profissional, and a recommended Premium tier, each including Jus IA, with a monthly/annual toggle.",
        caption:
          "The plan repackaging — three tiers built around the AI, with Premium set as the recommended plan to lift ARPU.",
      },
    ],
    published: true,
  },
  {
    slug: "device-control",
    title: "Protecting revenue driving 20% growth",
    headline:
      "Control that converts: how device management protected Jusbrasil's revenue and boosted profits by ~20%",
    company: "Jusbrasil",
    year: "2025",
    role: "Product Designer",
    status: "Experiment",
    url: "https://www.jusbrasil.com.br",
    team: "Product Managers, Engineers, Business Strategists",
    summary: "Curbing account sharing without punishing legitimate users.",
    problem:
      "Over 80% of paying users accessed their accounts from more than two devices, and that usage correlated directly with page views. The challenge was distinguishing legitimate multi-device access from unauthorized account sharing — without losing revenue or trust.",
    solution:
      "I designed a three-part system: device switching limits (one new device per month, beyond which the account is blocked), self-service seat purchasing to unlock additional access, and an admin seat-management interface for assigning users.",
    process: [
      {
        title: "Behavioral analysis",
        description:
          "Examined device-switching frequency and session overlap patterns to understand real usage.",
      },
      {
        title: "User research",
        description:
          "Interviews revealed sharing stemmed mostly from convenience, not malicious intent — which shaped a softer, conversion-oriented approach.",
      },
      {
        title: "Iteration",
        description:
          "Tested high-fidelity prototypes focused on messaging and user flows, then refined with stakeholder feedback before A/B testing.",
      },
    ],
    results: [
      { value: "+20%", label: "revenue increase" },
      { value: "+50%", label: "shared accounts blocked" },
    ],
    media: [
      {
        type: "component",
        component: "device-control",
        caption: "Hitting the access limit — the user picks a device to disconnect.",
      },
      {
        type: "component",
        component: "code-verification",
        caption: "A six-digit code confirms each new device.",
      },
      {
        type: "component",
        component: "device-lastswitch",
        caption: "The last-switch warning, framed to convert rather than punish.",
      },
    ],
    published: true,
  },
  {
    slug: "segmented-homepage",
    title: "Lifting signups by 3% through a segmented homepage redesign",
    headline: "A segmented homepage redesign that lifted signups by 3%",
    company: "Jusbrasil",
    year: "2024",
    role: "Product Designer",
    status: "Shipped",
    url: "https://www.jusbrasil.com.br",
    summary: "Tailoring the homepage to distinct audiences to drive signups.",
    problem:
      "Draft — add the problem statement for this case study.",
    solution:
      "Draft — describe the segmented homepage approach and the key design decisions.",
    process: [
      {
        title: "Draft",
        description: "Add the design process steps for this project.",
      },
    ],
    results: [{ value: "+3%", label: "signups" }],
    media: [
      {
        type: "component",
        component: "segmented-toggle",
        caption: "A segmented hero that tailors the homepage to each audience.",
      },
    ],
    published: false,
  },
  {
    slug: "carminga-onboarding",
    title: "Boosting activation by 28% with a smarter onboarding",
    headline:
      "Activation that drives growth: how Carminga's new onboarding increased activation by 28%",
    company: "Carminga",
    year: "2021",
    role: "Product Designer",
    status: "Shipped",
    url: "https://carminga.com",
    team: "Product, Engineering",
    summary: "Removing friction from signup and identity verification.",
    problem:
      "Carminga's onboarding created friction during account creation and identity verification. The flow asked for too much upfront with no clear sense of next steps, so users abandoned before completing verification or booking their first vehicle.",
    solution:
      "I shortened the process and improved clarity: fewer form fields, grouped related actions, transparent progress feedback, and identity verification repositioned to happen naturally after signup but before the first booking.",
    process: [
      {
        title: "Research",
        description:
          "Analyzed competitor onboarding patterns with tools like Mobbin to identify expected interaction models and friction points.",
      },
      {
        title: "Flow redesign",
        description:
          "Simplified the experience through field reduction, logical action grouping, and clearer progress indicators.",
      },
      {
        title: "Testing & iteration",
        description:
          "Released directly to production with close collaboration between design, product, and engineering to monitor metrics and feedback.",
      },
    ],
    results: [
      { value: "+28%", label: "activation rate (first month)" },
      { value: "−40%", label: "time-to-first-booking" },
      { value: "−35%", label: "onboarding drop-off" },
    ],
    published: true,
  },
];

/** The problem as one flat string. The case page renders the block structure;
 *  the agent's system prompt (see lib/persona) wants prose. */
export function problemText(problem: Problem): string {
  if (typeof problem === "string") return problem;
  return [problem.lead, ...problem.parts.map((p) => `${p.title}: ${p.body}`)].join(
    " ",
  );
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const publishedProjects = projects.filter((p) => p.published);
