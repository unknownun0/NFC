export const defaultData = {
  name: "Alex Rivera",
  handle: "@alexrivera",
  bio: "You only ship it once, but if you build it right, once is enough.",
  cover: "",
  phone: "+63 900 000 0000",
  email: "alex.rivera@example.com",
  socials: [
    { platform: "github", url: "https://github.com/" },
    { platform: "linkedin", url: "https://linkedin.com/" },
    { platform: "twitter", url: "https://twitter.com/" }
  ],
  projects: [
    {
      image: "",
      title: "Questlog",
      description: "A gamified task tracker where finishing to-dos earns XP and streak badges. Built with React and a Node/Postgres backend."
    },
    {
      image: "",
      title: "Portfolio Site",
      description: "Personal site and case study archive, built for speed with a static-first architecture."
    }
  ],
  experiences: [
    {
      role: "Full-Stack Developer",
      company: "Independent",
      period: "2022 - Present",
      description: "Building web products from idea to launch."
    }
  ],
  certificates: [
    {
      name: "Add your certificate",
      issuer: "Issuing organization",
      year: "2024",
      url: ""
    }
  ],
  skills: [
    { name: "JavaScript", level: 90 },
    { name: "React", level: 85 },
    { name: "Node.js", level: 75 },
    { name: "UI Design", level: 65 }
  ]
};

export function profileKey(slug) {
  return `profile:${slug}`;
}

export function slugListKey() {
  return `profile:__index__`;
}

export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9-]{2,40}$/.test(slug);
}
