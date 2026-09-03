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
  /** CSS aspect-ratio for the stage, e.g. "16 / 9". Defaults to "16 / 9".
   *  For a video this is the media's box as well as the stage's — see the note
   *  on the onboarding case's `story`. */
  aspect?: string;
  /** A wider stage for the same media, from `md` up.
   *
   *  For the framed screenshots, whose stage the design makes deliberately
   *  wider than the screen floating on it. On a narrow layout that inset is a
   *  fifth of the width spent on empty bands either side of a thumbnail that's
   *  already at an 8x downscale, so below `md` the stage takes the media's own
   *  ratio and the screen gets the whole column. Only meaningful when it
   *  differs from
   *  `aspect`; omit it and the stage keeps one ratio at every width. */
  stage?: string;
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
  /** How the image meets its stage. Three states, because there are three
   *  kinds of picture here:
   *
   *  - omitted — the image *is* the figure, and runs edge-to-edge in the tile
   *    with no stage under it.
   *  - `true` — it floats on the neutral stage with a rounded border and a
   *    shadow, like the video. For the product screenshots, which are opaque
   *    and white at their own edges: without the hairline there's nothing for
   *    the picture to stop at and it bleeds into the light theme's stage.
   *  - `"own"` — it floats on the stage and the site draws nothing around it,
   *    because the file already carries an edge. Worth stating precisely, since
   *    the obvious reading of these two is wrong: the Figma-canvas screenshots
   *    are window captures saved *with* their drop shadow — palette PNGs with a
   *    `tRNS` chunk, so the margin is transparent (index 0 is black at alpha 2)
   *    and holds a real alpha ramp, 2 → 11 → 22 → 37 → 56 → 76 → 105 → 132 →
   *    192 → 255. The window itself occupies x 62–1985, y 42–1165 of 2048×1248.
   *    So a border here didn't outline anything: it traced the file's box, 62px
   *    out in empty margin, which is exactly why it read as a stray line. And
   *    TILE_SHADOW was a second cast under a picture that brought its own.
   *    (components/case-preview makes the same call for the same reason —
   *    "full-bleed art carries its own edge".) */
  frame?: boolean | "own";
};

/** A direction and a reading, for the comparison block. */
export type Signal = {
  /** Up is the good news. The renderer takes both the arrow and the weight
   *  from this: the thing that worked reads brighter than the thing that
   *  didn't, so the column you should be looking at is the louder one. */
  trend: "up" | "down";
  label: string;
};

/** One row of the operating-model diagram: a label and the chips it leads. */
export type FlowRow = {
  label: string;
  /** `key` marks the chip the design fills — the one thing that changed.
   *
   *  `edge` names what happens on the way *in* to this chip ("blocked", "pays
   *  on evidence"), and is ignored on the first step, which nothing leads to.
   *  Naming one edge changes how the whole flow draws its connectors — see the
   *  note on Flow in components/project-story. */
  steps: { label: string; key?: boolean; edge?: string }[];
  /** The row the diagram argues for. Outlined chips for the model being left
   *  behind, filled ones for the model replacing it. */
  active?: boolean;
};

/**
 * A case study told as a flat run of blocks, in the order the design stacks
 * them.
 *
 * Flat rather than nested, and the figures are the reason. They sit at the
 * gallery's width *between* the numbered items of a run, so a section that
 * owned its children would have to break out of its own column to place one.
 * Everything is a sibling instead, and the renderer derives the space between
 * two blocks from the pair of kinds — which is how the design states its
 * rhythm anyway: a figure after a step is 32px, a step after a figure is 64.
 *
 * A case with a `story` renders it in place of the fixed
 * problem → solution → process → results page. The four structured fields stay
 * populated either way: they're what the assistant reads (see lib/persona), and
 * a case needs that summary whether or not its page tells the longer version.
 */
export type StoryBlock =
  /** A muted eyebrow, and the start of a section. Every one of them opens the
   *  same gap — see gapAbove in components/project-story. */
  | { kind: "section"; title: string }
  /** The line that sets up the claim — the sentence the design sets *above*
   *  the lead rather than under it, a size down but at full strength. */
  | { kind: "intro"; text: string }
  /** The section's claim: medium, at full strength. */
  | { kind: "lead"; text: string }
  /** Body copy under it. */
  | { kind: "text"; text: string }
  /** What the old model cost, three figures across. */
  | { kind: "stats"; items: Metric[] }
  /** The case's headline numbers. Reads `results` off the project rather than
   *  restating them, so the page and the assistant can't drift apart. */
  | { kind: "metrics" }
  /** A numbered run that stays inside its section. */
  | { kind: "steps"; items: { title: string; text: string }[] }
  /** One numbered item on its own, so its figure can follow it. */
  | { kind: "step"; n: string; title: string; text: string }
  /** Two things tested, side by side. */
  | { kind: "comparison"; columns: { title: string; signals: Signal[] }[] }
  /** A figure at the gallery's width — the site's own media tile and caption. */
  | { kind: "figure"; media: MediaItem }
  /** The case's one diagram: the operating model, before and after. */
  | { kind: "flow"; rows: FlowRow[]; caption: string }
  /** A bespoke diagram, resolved by name against components/story-diagrams.
   *
   *  For a figure that's made of type rather than of pixels and is too
   *  particular to have a shape worth generalising — a raster of tracked
   *  events, a map of candidate triggers. The geometry and the labels live with
   *  the component, because they're bound to each other; the caption and the
   *  small print under the stage live here, because they're prose, and prose
   *  belongs with the case. */
  | { kind: "diagram"; name: string; caption: string; note?: string };

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
  /** Media shown in the gallery at the end of the case study. A case that
   *  tells its story in blocks places its own figures inline and leaves this
   *  empty — see `story`. */
  media?: MediaItem[];
  /** What the home list's hover card shows. Defaults to `media[0]`, which is
   *  the right answer for a case whose page ends in a gallery; a story case has
   *  to name one, because its figures open on a diagram rather than a screen. */
  preview?: MediaItem;
  /** The case page, told as blocks. Replaces the fixed sections when present. */
  story?: StoryBlock[];
  /** Whether the case is part of the site. `false` keeps it out of home's
   *  Selected work, out of the agent's knowledge, and out of the suggestion
   *  chips — everything that reads `publishedProjects`. It does NOT unpublish
   *  the case *page*: `/[slug]` is generated from every entry here, so the URL
   *  stays reachable for anyone holding a link.
   *
   *  Two things use it: a case that isn't written yet, and one that's finished
   *  but deliberately off the shortlist. */
  published: boolean;
};

/* The Voice AI recording, named because it does two jobs: the figure inside the
   case, and — with the caption dropped — the card the home list opens on hover.

   Its `aspect` is the *content's* ratio rather than the file's. The clip was
   letterboxed into 16:9 at capture — 18 black rows above the recording and 20
   below — which the dark theme hid and the light one showed as two bands. Both
   the figure and the hover card lay a clip out as `object-cover` on a stage of
   this ratio, so declaring 680 rather than 720 makes the two of them crop the
   bands off. 680, not 682: the bars aren't symmetric and cover crops evenly, so
   the ratio has to be cut to the larger of the two.

   The only clip here with a `poster`, because it's the one the hover card shows
   and that card loads with `preload="none"` — without a still there's an empty
   stage until 17MB of video arrives. The case's own figures autoplay with
   `preload="auto"` and never need one. */
const VOICE_AI: MediaItem = {
  type: "video",
  src: "/projects/ai-onboarding/voice-assistant.mp4",
  poster: "/projects/ai-onboarding/voice-assistant-poster.jpg",
  aspect: "1280 / 680",
  sound: true,
  alt: "The AI voice assistant walking a new company through its Get started checklist.",
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
          "The AI voice was validated and discarded, so I rebuilt the whole experience around guided self-setup, opened it to all markets, and ran a controlled test against the old expert-led flow.",
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
    preview: VOICE_AI,
    /* The case page, block by block, in the design's order.

       Every figure states its media's own ratio in `aspect` and the stage the
       design gives all of them in `stage` — 1024/534, which is what lands the
       whole run at one height and makes it read as a column rather than as six
       unrelated pictures. The two fields have to be separate because `aspect`
       does double duty on a video: it cuts the video's own box, which
       `object-cover` then fills, so a clip that borrowed the stage's ratio
       would lose its sides to the crop. `stage` is a wide-layout luxury —
       below `md` it's dropped and every figure takes the media's own ratio, so
       the picture gets the whole column on a phone instead of spending a fifth
       of it on empty bands. */
    story: [
      { kind: "section", title: "The problem" },
      {
        kind: "text",
        text: "Factorial has historically been a sales-led business, with onboarding relying 100% on human specialists. As the company scaled, this model became increasingly difficult to sustain.",
      },
      {
        kind: "lead",
        text: "The onboarding model was becoming the bottleneck to growth.",
      },
      {
        kind: "stats",
        items: [
          { value: "45+ days", label: "to onboard one customer" },
          { value: "6h", label: "specialist work per customer" },
          {
            value: "Manual Excel",
            label: "checklist per client, to track implementation",
          },
        ],
      },

      { kind: "section", title: "The signal" },
      {
        kind: "lead",
        text: "I immersed myself in the onboarding process, joining specialist sessions and observing customers firsthand to understand where the experience was breaking.",
      },
      {
        kind: "steps",
        items: [
          {
            title: "Customers lacked visibility",
            text: "Customers didn't know what was happening, what they needed to do, or when onboarding would be complete.",
          },
          {
            title: "Working rules were difficult to translate",
            text: "Specialists had to turn each company's unique working rules into complex system configurations.",
          },
          {
            title: "The process relied on specialist intervention",
            text: "Customers couldn't complete onboarding independently, creating a dependency on specialist sessions throughout the process.",
          },
        ],
      },

      { kind: "section", title: "The opportunity" },
      {
        kind: "lead",
        text: "We needed a faster onboarding process — and a different operating model.",
      },
      {
        kind: "flow",
        rows: [
          {
            label: "Before",
            steps: [
              { label: "Customer" },
              { label: "Specialist" },
              { label: "Systems" },
              { label: "Specialist" },
              { label: "Customer" },
            ],
          },
          {
            label: "After",
            active: true,
            steps: [
              { label: "Customer" },
              { label: "AI orchestration + onboarding skill", key: true },
              { label: "AI agents" },
              { label: "Specialist when needed" },
            ],
          },
        ],
        caption:
          "The shift: from a relay through specialists to an orchestration the customer drives.",
      },

      { kind: "section", title: "Exploration" },
      {
        kind: "intro",
        text: "I launched our first MVP to test the new onboarding experience with customers.",
      },
      {
        kind: "lead",
        text: "The MVP explored two complementary ideas: making progress visible and using AI to simplify complex configuration.",
      },
      {
        kind: "step",
        n: "01",
        title: "Get Started",
        text: "I explored a checklist-based experience to help customers understand what they needed to do and how far they were through onboarding.",
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/ai-onboarding/get-started-v1.png",
          frame: true,
          aspect: "2224 / 1276",
          stage: "1024 / 534",
          alt: "Factorial's first Get started page: a progress bar reading 0 of 10 modules completed, a Core card whose first task — how to create a legal entity — comes with a guide video and five more setup tasks under it, then a run of locked modules below the line 'Complete these mandatory steps first to unlock the rest.'",
          caption:
            "Get Started — the first MVP was based on a simple setup checklist to configure your account, connected to the help center and supporting videos.",
        },
      },
      {
        kind: "step",
        n: "02",
        title: "Voice AI",
        text: "Factorial's configuration was too complex to cover with a fixed onboarding flow. I explored AI as a way to dynamically understand what customers were trying to configure and guide them through the UI.",
      },
      {
        kind: "figure",
        media: {
          ...VOICE_AI,
          stage: "1024 / 534",
          caption:
            "Voice AI — the first MVP was a voice framework connected with our AI system that reads the interface and guides the user through a red cursor on screen.",
        },
      },

      { kind: "section", title: "What we learned" },
      { kind: "lead", text: "The checklist worked. Voice didn't." },
      {
        kind: "comparison",
        columns: [
          {
            title: "Get Started",
            signals: [{ trend: "up", label: "Strong engagement" }],
          },
          {
            title: "Voice AI",
            signals: [
              { trend: "down", label: "Low engagement" },
              { trend: "down", label: "High error rate" },
            ],
          },
        ],
      },
      {
        kind: "text",
        text: "Testing showed the guidance system worked — the AI understood tasks and directed users correctly. The issue was the voice interface, not the guidance itself.",
      },

      { kind: "section", title: "Iteration" },
      { kind: "lead", text: "I kept what worked — and made it scalable." },
      {
        kind: "text",
        text: "The second MVP combined the strongest parts of the first experiment:",
      },
      {
        kind: "step",
        n: "01",
        title: "AI-guided system support",
        text: "I kept the pointer system from Voice AI, but the voice itself was replaced by an AI system interface that reads the UI and guides customers with an on-screen cursor.",
      },
      {
        kind: "figure",
        media: {
          type: "video",
          src: "/projects/ai-onboarding/guided-setup.mp4",
          aspect: "2208 / 1080",
          stage: "1024 / 534",
          alt: "The AI-guided system support reading the interface and moving an on-screen cursor through basic configuration.",
          caption:
            "The system is connected with Factorial AI “One” and developed to guide customers through the process.",
        },
      },
      {
        kind: "step",
        n: "02",
        title: "A simpler Get Started",
        text: "I simplified Get Started based on what customers actually used. I removed low-engagement videos and the Help Center link, and moved optional tasks later — making it easier to scale globally.",
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/ai-onboarding/get-started.png",
          frame: true,
          aspect: "2175 / 1239",
          stage: "1024 / 534",
          alt: "The simplified Get started page: the left nav beside a progress bar reading 0 of 10 modules completed, a Basic configuration card with Add people expanded over five more setup tasks, and Module configuration locked below it.",
          caption:
            "New Get Started screen with a few steps displayed, providing clearer guidance and better understanding of the process.",
        },
      },
      {
        kind: "step",
        n: "03",
        title: "An onboarding intro animation",
        text: "I introduced a short animation at the start of onboarding to create a “wow” moment and make the first interaction feel more approachable.",
      },
      {
        kind: "figure",
        media: {
          type: "video",
          src: "/projects/ai-onboarding/onboarding-intro.mp4",
          aspect: "2208 / 1080",
          stage: "1024 / 534",
          alt: "The onboarding intro animation playing on first login.",
          caption:
            "The onboarding intro animation is the first thing users see after logging in, creating a sense of wow effect and a strong first impression.",
        },
      },
      {
        kind: "step",
        n: "04",
        title: "A personalized onboarding start with AI",
        text: "I used Factorial's AI to customize each customer's onboarding, tailoring steps from their first interaction and introducing the AI system early.",
      },
      {
        kind: "figure",
        media: {
          type: "video",
          src: "/projects/ai-onboarding/personalized-start.mp4",
          aspect: "2208 / 1080",
          stage: "1024 / 534",
          alt: "A short conversation with Factorial's AI shaping the customer's onboarding path before the Get started page.",
          caption:
            "A co-creation experience with Factorial's AI system tailors each customer's onboarding path.",
        },
      },

      { kind: "section", title: "Results" },
      { kind: "metrics" },
      {
        kind: "text",
        text: "The impact was clear: enabling Factorial to scale strategically, onboarding more customers without increasing specialist headcount while keeping customers highly satisfied.",
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
      { value: "+5,000", label: "new subscriptions in the first weeks" },
      { value: "+20k", label: "monthly active subscribers after four months" },
    ],
    /* The case leads on the product itself rather than on its first diagram:
       the clip is what the paywall *is*, and the two figures before it in the
       story only make sense once you've read the copy between them. */
    preview: {
      type: "video",
      src: "/projects/monetization-jusia/video-example-1.mp4",
      aspect: "2164 / 1080",
      alt: "Jus AI answering a legal due-diligence prompt.",
    },
    story: [
      { kind: "section", title: "The problem" },
      {
        kind: "text",
        text: "Jusbrasil launched a new AI product to establish itself as an AI-first company in the Brazilian legal market.",
      },
      {
        kind: "lead",
        text: "The challenge was to find a way to monetize AI without breaking user trust or interrupting the value users were getting from it.",
      },

      { kind: "section", title: "The signal" },
      {
        kind: "lead",
        text: "AI created value differently from our subscription, so I analyzed beta testers' behavior and sessions to find where the new AI product added real value.",
      },
      {
        kind: "steps",
        items: [
          {
            title: "Legal drafting",
            text: "Users experienced value immediately after generating a useful legal draft.",
          },
          {
            title: "Legal research",
            text: "Completing a research task was another strong moment of perceived value.",
          },
        ],
      },
      {
        kind: "diagram",
        name: "session-raster",
        note: "Illustrative — each row is one beta session, each mark one tracked event.",
        caption:
          "Behavioural data and session recordings from beta testers: the value moment landed after the output — in drafting and in research.",
      },

      { kind: "section", title: "The opportunity" },
      {
        kind: "lead",
        text: "We could monetize the moment users understood the value.",
      },
      {
        kind: "text",
        text: "Instead of placing AI behind a generic paywall, we explored a contextual model and set usage limits based on how the beta testers behaved.",
      },
      {
        kind: "flow",
        rows: [
          {
            label: "Generic",
            steps: [
              { label: "User asks" },
              { label: "Paywall", edge: "blocked" },
              { label: "AI answers", edge: "pays on a promise" },
            ],
          },
          {
            label: "Output-based",
            active: true,
            steps: [
              { label: "User asks" },
              { label: "AI answers + limit usage", edge: "generates" },
              { label: "Paywall", key: true, edge: "pays on evidence" },
            ],
          },
        ],
        caption:
          "Instead of charging before delivering value, we moved the paywall to the moment users had already experienced the AI's value.",
      },

      { kind: "section", title: "Exploration" },
      {
        kind: "lead",
        text: "I explored how AI products connect value with monetization.",
      },
      {
        kind: "step",
        n: "01",
        title: "Benchmarking research",
        text: "I benchmarked Notion AI, Grammarly, Claude and ChatGPT to understand how they positioned upgrades around AI usage.",
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/monetization-jusia/benchmark-figma.png",
          frame: "own",
          aspect: "2048 / 1248",
          stage: "1024 / 534",
          alt: "The benchmark board in Figma: four labelled groups of product screenshots — Notion AI, Grammarly, Claude and Chat.gpt — each a captured upgrade flow wired together with red connectors from the first prompt through to the plans page.",
          caption:
            "The benchmark study was inside Figma, featuring screenshots and buying workflows.",
        },
      },
      {
        kind: "step",
        n: "02",
        title: "Buying journey flows",
        text: "I then mapped possible buying journeys to explore different upgrade moments and align the strategy with stakeholders.",
      },
      {
        kind: "diagram",
        name: "buying-journeys",
        note: "Dashed — left on the table. Solid — the one taken forward.",
        caption:
          "Four candidate triggers, one purchase path — the buying journeys mapped side by side to compare upgrade moments with stakeholders.",
      },

      { kind: "section", title: "The decision" },
      {
        kind: "lead",
        text: "We chose the output-based trigger in a joint internal decision.",
      },
      {
        kind: "text",
        text: "The trade-off was to absorb the cost of generating the AI output upfront, in exchange for a more contextual upgrade moment tied to the value users had just experienced.",
      },

      { kind: "section", title: "Iteration" },
      {
        kind: "lead",
        text: "I kept the trigger contextual — and adapted the experience around it.",
      },
      {
        kind: "step",
        n: "01",
        title: "Output-based paywalls",
        text: "The upgrade appeared immediately after a high-value AI result.",
      },
      {
        kind: "figure",
        media: {
          type: "video",
          src: "/projects/monetization-jusia/video-example-1.mp4",
          aspect: "2164 / 1080",
          stage: "1024 / 534",
          alt: "Jus AI answering a legal due-diligence prompt, then reaching the response limit.",
          caption: "Triggering the paywall after the usage limit is reached.",
        },
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/monetization-jusia/response-limit-paywall.png",
          frame: true,
          aspect: "1512 / 875",
          stage: "1024 / 534",
          alt: "The Jus IA chat with a due-diligence answer on screen and an inline card below it reading 'Você chegou no limite de respostas', with an 'Assinar agora' button.",
          caption: "The trigger paywall in context.",
        },
      },
      {
        kind: "step",
        n: "02",
        title: "Payment modal",
        text: "I designed the payment modal to adapt to different use cases, tailoring the experience for trial, upgrade, and winback scenarios.",
      },
      {
        kind: "figure",
        media: {
          type: "component",
          component: "jusia-paywall",
          caption:
            "The payment modal was redesigned to fit new benefits and new tier plans.",
        },
      },
      {
        kind: "step",
        n: "03",
        title: "A new pricing structure",
        text: "We repositioned Jus AI as a premium feature within the existing subscription tiers, making the model clearer and more scalable.",
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/monetization-jusia/plans-repackaging.png",
          frame: true,
          aspect: "1512 / 875",
          stage: "1024 / 534",
          alt: "Jusbrasil's plans page after the repackaging: Essencial, Profissional, and a recommended Premium tier, each including Jus IA, with a monthly/annual toggle.",
          caption:
            "The plan repackaging — three tiers built around the AI, with Premium set as the recommended plan to lift ARPU.",
        },
      },

      { kind: "section", title: "Results" },
      { kind: "metrics" },
      {
        kind: "text",
        text: "The strategy turned a new AI capability into a meaningful revenue driver while keeping monetization connected to the value users experienced.",
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
    status: "Shipped",
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
      { value: "+20%", label: "revenue from seat expansion" },
      { value: "+50%", label: "shared accounts blocked" },
    ],
    /* The screen the case turns on: the limit reached, and a choice rather
       than a wall. */
    preview: { type: "component", component: "device-control" },
    story: [
      { kind: "section", title: "The problem" },
      {
        kind: "text",
        text: "Jusbrasil had become one of the most widely used B2C products among lawyers in Brazil. As usage scaled, we started seeing discrepancies between product usage and our subscriber base.",
      },
      {
        kind: "lead",
        text: "We had a strong signal that accounts were being shared.",
      },

      { kind: "section", title: "The signal" },
      {
        kind: "lead",
        text: "I paired behavioral data with interviews to find out what multi-device use actually was.",
      },
      {
        kind: "steps",
        items: [
          {
            title: "Multiple devices didn't mean account sharing",
            text: "Legitimate customers regularly switched between work and personal devices.",
          },
          {
            title: "Sharing was often about convenience",
            text: "A password was simply the easiest way to give someone access.",
          },
          {
            title: "A hard block would create unnecessary friction",
            text: "Controlling access is not the same as preventing it.",
          },
          {
            title: "Multi-device usage was the norm",
            text: "80%+ of paying users accessed Jusbrasil from multiple devices.",
          },
        ],
      },

      { kind: "section", title: "The opportunity" },
      {
        kind: "lead",
        text: "Turn access control into a path to legitimate usage and subscriber growth.",
      },
      {
        kind: "text",
        text: "Rather than treat every extra device as abuse, add friction gradually and leave a way out. The goal wasn't to stop sharing — it was to convert it.",
      },
      {
        kind: "flow",
        rows: [
          {
            label: "Before",
            steps: [{ label: "New device" }, { label: "Blocked", edge: "at once" }],
          },
          {
            label: "After",
            active: true,
            steps: [
              { label: "New device" },
              { label: "Identify", edge: "detected" },
              { label: "Warn", edge: "approaching" },
              { label: "Limit", edge: "reached" },
              { label: "Resolve", key: true, edge: "$ buy access" },
            ],
          },
        ],
        caption:
          "The shift: one block at the door becomes a sequence the customer can see coming.",
      },

      { kind: "section", title: "Exploration" },
      {
        kind: "lead",
        text: "I explored how to introduce friction without breaking the experience.",
      },
      {
        kind: "text",
        text: "I designed and tested different approaches to device limits, warnings, verification and additional access.",
      },
      {
        kind: "figure",
        media: {
          type: "image",
          src: "/projects/device-control/friction-ramp.png",
          frame: "own",
          aspect: "2048 / 1248",
          stage: "1024 / 534",
          alt: "The device-control file in Figma: pages for the disconnect flow and the seats upgrade vision beside a canvas of labelled flows — authentication, desktop, and new subscription — each a run of screens wired together with connectors.",
          caption:
            "All the flows were designed based on previous learnings, and the best decisions were made after design critiques with peers.",
        },
      },

      { kind: "section", title: "The trade-off" },
      {
        kind: "lead",
        text: "How much friction can we introduce before legitimate users start feeling punished?",
      },
      {
        kind: "text",
        text: "Based on everything we knew at this point, we made a decision. Instead of outright blocking additional devices, we introduced warnings and limits gradually, giving legitimate users a clear path to continue.",
      },

      { kind: "section", title: "What we learned" },
      {
        kind: "lead",
        text: "The restriction worked better when customers understood why.",
      },
      {
        kind: "text",
        text: "Testing showed that users needed clear context before being blocked — and a clear path to resolve the restriction.",
      },

      { kind: "section", title: "Iteration" },
      {
        kind: "step",
        n: "01",
        title: "Progressive warnings",
        text: "Customers received increasingly clear warnings before reaching the device limit. I wrote every piece of copy with our compliance team, so the blocking system explained itself.",
      },
      {
        kind: "figure",
        media: {
          type: "component",
          component: "device-control",
          caption:
            "All design screens are based on product modals that appear mid-flow, keeping users focused within the context of use.",
        },
      },
      {
        kind: "step",
        n: "02",
        title: "Verification",
        text: "A verification step helped distinguish legitimate access from unauthorized sharing. The verification flow was designed to be straightforward and assist users in making their decisions.",
      },
      {
        kind: "figure",
        media: {
          type: "component",
          component: "device-lastswitch",
          caption:
            "The last-switch warning, framed to convert rather than punish — and what acknowledging it opens onto.",
        },
      },
      {
        kind: "step",
        n: "03",
        title: "Self-service access",
        text: "Customers can purchase additional access instead of being permanently blocked, allowing us to increase growth opportunities and protect our revenue.",
      },
      {
        kind: "figure",
        media: {
          type: "component",
          component: "seat-purchase",
          caption:
            "At the limit — disconnect a device, or buy the access to keep both.",
        },
      },

      { kind: "section", title: "Results" },
      {
        kind: "lead",
        text: "Control without turning the experience hostile.",
      },
      { kind: "metrics" },
      {
        kind: "text",
        text: "Unmanaged sharing went down, and part of it turned into revenue.",
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
    published: false,
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

/** What the home list hovers. A case that ends in a gallery leads with the
 *  piece worth leading with, so the gallery's first item is the card; a case
 *  that places its figures inline names its own (see Project.preview). */
export function previewMedia(project: Project): MediaItem | undefined {
  return project.preview ?? project.media?.[0];
}

/** A section's anchor, derived from its title rather than authored.
 *
 *  Two things read this — the heading that carries the id and the rail that
 *  links to it (components/section-rail) — so deriving it means they can't
 *  disagree. Titles are short, human, and unique within a case, which is
 *  exactly the shape that survives slugification.
 */
export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The case's sections in order, for the rail. Empty for a case with no
 *  story, which is what keeps the rail off the classic pages. */
export function storySections(
  story?: StoryBlock[],
): { id: string; title: string }[] {
  if (!story) return [];
  return story
    .filter((block): block is { kind: "section"; title: string } =>
      block.kind === "section",
    )
    .map((block) => ({ id: sectionId(block.title), title: block.title }));
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const publishedProjects = projects.filter((p) => p.published);
