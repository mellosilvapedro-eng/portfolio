export const site = {
  name: "Pedro Mello",
  role: "Senior Product Designer",
  location: "Barcelona",
  /** Words in the bio that should render as inline links. */
  mentions: {
    Factorial: "https://factorialhr.com/",
    Jusbrasil: "https://www.jusbrasil.com.br/",
  } as Record<string, string>,
  /** Short intro shown on the home page, one entry per paragraph. */
  bio: [
    "Today, I work on the Growth team at Factorial. I design experiences that help businesses discover value, adopt products, and grow.",
    "Previously, I worked on the Growth Design team at Jusbrasil.",
  ],
  /** Career history. Drives the home page's Experience & Work timeline, where
   *  each job also carries the published case studies whose `company` matches
   *  this `company` — so the string has to stay spelled the same in both files
   *  (see lib/projects and components/career-timeline).
   *  `url` turns the company name into a link. */
  experience: [
    {
      period: "2026 — Now",
      role: "Product Designer, Growth",
      company: "Factorial",
      url: "https://factorialhr.com/",
      description:
        "Leading upselling growth and customer onboarding at Factorial",
    },
    {
      period: "2021 — 2025",
      role: "Senior Product Designer, Growth",
      company: "Jusbrasil",
      url: "https://www.jusbrasil.com.br/",
      description:
        "I lead monetization and conversion initiatives at Jusbrasil, working to democratize access to legal information in Brazil.",
    },
    {
      period: "2020 — 2021",
      role: "Product Designer",
      company: "Carminga",
      url: "https://carminga.com/",
      description:
        "Solo product designer for a German car subscription startup",
    },
    {
      period: "2020 — 2021",
      role: "Jr Visual Designer",
      company: "Wine",
      url: "https://www.wine.com.br/",
      description:
        "Visual Designer in the world's largest wine subscription club.",
    },
  ] as readonly {
    period: string;
    role: string;
    company: string;
    url?: string;
    description: string;
  }[],
  /** Side projects and explorations, shown below the timeline. */
  experiments: [
    {
      name: "Skills",
      description: "Design skills for AI agents",
      url: "/skills",
      year: "2026",
    },
    {
      name: "SpecNote",
      description: "Notes that become specs",
      url: "https://specnote.vercel.app/",
      year: "2026",
    },
    {
      name: "Paste",
      description: "Drop-in UI components for LLMs",
      url: "https://uipaste.vercel.app/",
      year: "2026",
    },
  ],
  url: "https://pedromello.cc",
  email: "mellosilvapedro@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/pedrodesinmello/",
    github: "https://github.com/mellosilvapedro-eng",
    substack: "https://pedromellopp.substack.com/",
  },
} as const;
