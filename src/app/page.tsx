const apps = [
  {
    name: "Shutterfield",
    url: "https://shutterfield.com",
    tagline: "Because Google shouldn't own your memories.",
    description:
      "Started as a place to store drone footage. Turned into a full photo library when Google Photos got greedy with storage. Now it handles 4TB+ of photos and videos with smart albums and search that actually works.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 19l3.5-4.5L11 17l3-4 5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    status: "live",
  },
  {
    name: "SixGuess",
    url: "https://sixguess.com",
    tagline: "Wordle with friends. For real this time.",
    description:
      "Born from a group text thread where three friends shared Wordle scores every day. We built a Discord bot, then a Tableau dashboard, then said screw it and built the whole app. 24 players, 3,900+ games logged, and growing.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="2" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9.5" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9.5" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    status: "live",
  },
  {
    name: "What a Great Day",
    url: "https://greatday.you",
    tagline: "What happened today? Let's find out.",
    description:
      "A morning ritual. Open it up, see what's worth celebrating today - historical events, weird holidays, notable birthdays. It's a small thing that makes the day feel a little more interesting.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    status: "live",
  },
  {
    name: "Acey Deucy",
    url: "#",
    tagline: "The card game your grandpa taught you.",
    description:
      "Simple rules, fast rounds, and just enough luck to keep it interesting. We've been playing this at family gatherings for years. Now we're putting it online so we can play when we're not all in the same room.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="3" y="2" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="5" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" fill="#0a0a0a" />
        <text x="13" y="14" fontSize="6" fill="currentColor" fontWeight="bold">A</text>
      </svg>
    ),
    status: "coming-soon",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Outlaw Apps
              </h1>
              <p className="text-xs text-text-muted">We&apos;re having fun here!</p>
            </div>
          </div>
          <span className="text-xs text-text-muted hidden sm:block">
            Johnny Outlaw, LLC
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
          Outlaw Apps.<br />
          <span className="text-accent">We&apos;re having fun here!</span>
        </h2>
      </section>

      {/* Story */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="max-w-3xl space-y-4 text-text-secondary text-base leading-relaxed">
          <p>
            I&apos;m Johnny Outlaw - a data developer with 25+ years of experience who got tired of
            waiting for someone else to build the things I wanted. So I started building them myself
            out of Church Street Studio in Greenville, TX.
          </p>
          <p>
            It usually starts the same way: something annoys me, or a friend says &quot;wouldn&apos;t it be
            cool if...&quot; and then I can&apos;t stop thinking about it. A group text about Wordle scores
            turned into SixGuess. Getting fed up with Google Photos turned into Shutterfield. Wanting
            to know why today felt special turned into What a Great Day.
          </p>
          <p>
            The goal is always the same - take something fun or useful, strip out the friction, and
            use data and technology to make it better. No investors, no bloat, no tracking your every
            move. Just apps that do what they say and get out of the way.
          </p>
        </div>
      </section>

      {/* App Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.status === "live" ? app.url : undefined}
              target={app.status === "live" ? "_blank" : undefined}
              rel={app.status === "live" ? "noopener noreferrer" : undefined}
              className={`group block rounded-xl border border-border bg-surface p-6 transition-all duration-200 ${
                app.status === "live"
                  ? "hover:border-accent/40 hover:bg-surface-hover cursor-pointer"
                  : "opacity-50 cursor-default"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-text-secondary ${app.status === "live" ? "group-hover:text-accent" : ""} transition-colors`}>
                    {app.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{app.name}</h3>
                    <p className="text-sm text-text-muted">{app.tagline}</p>
                  </div>
                </div>
                {app.status === "coming-soon" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-border text-text-muted">
                    Coming Soon
                  </span>
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {app.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Johnny Outlaw, LLC. Designed in Church Street Studio, Greenville, TX.
          </p>
          <p className="text-xs text-text-muted">
            outlawapps.online
          </p>
        </div>
      </footer>
    </div>
  );
}
