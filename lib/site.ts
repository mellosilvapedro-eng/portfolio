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
  /** The same, for /projects — the experiments have their own page now, so they
   *  get their own opening rather than a heading halfway down home. */
  projectsIntro: [
    "This page collects my latest projects and experiments. I see design as a playground to explore my interests, and this is my creative space for that.",
    "I hope you enjoy it as much as I do.",
  ],
  /** Career history. Drives the home page's Experience timeline — one entry per
   *  job, and nothing else: the case studies used to hang off the matching
   *  `company` here and now have their own section above it (see
   *  components/selected-work), so the two files no longer have to agree on how
   *  a company is spelled. `url` turns the company name into a link. */
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
  /** Side projects and explorations, listed on /projects. */
  experiments: [
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
  /** The agent-skills collection. It used to be a row in the experiments list;
   *  it's a destination in the nav now, so it's out of that list — but the
   *  assistant should still be able to point a visitor at it, which is why it
   *  stays here rather than only in app/skills (see lib/persona). */
  skillsPage: {
    name: "Skills",
    description: "Design skills for AI agents",
    url: "/skills",
    year: "2026",
  },
  url: "https://pedromello.cc",
  email: "mellosilvapedro@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/pedrodesinmello/",
    github: "https://github.com/mellosilvapedro-eng",
    substack: "https://pedromellopp.substack.com/",
  },
} as const;
