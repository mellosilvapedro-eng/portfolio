export type Metric = {
  value: string;
  label: string;
};

export type ProcessStep = {
  title: string;
  description: string;
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
  problem: string;
  solution: string;
  process: ProcessStep[];
  results: Metric[];
  /** Set to false for projects that are still drafts. */
  published: boolean;
};

export const projects: Project[] = [
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
    published: true,
  },
  {
    slug: "device-control",
    title: "Protecting revenue and driving 20% growth with device control",
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

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const publishedProjects = projects.filter((p) => p.published);
