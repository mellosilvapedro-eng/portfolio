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
  /** Side projects and explorations, shown below selected work. */
  experiments: [
    {
      name: "SpecNote",
      description: "Notes that become specs",
      url: "https://specnote.vercel.app/",
      year: "2026",
    },
  ],
  url: "https://pedromello.cc",
  email: "hello@pedromello.cc",
  links: {
    linkedin: "https://www.linkedin.com/in/pedrodesinmello/",
    github: "https://github.com/mellosilvapedro-eng",
  },
} as const;
