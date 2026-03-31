import Image from "next/image";

const apps = [
  {
    name: "Shutterfield",
    url: "https://shutterfield.com",
    tagline: "Your photos. Your cloud.",
    description: "A photo and video library built to replace Google Photos - with real storage, smart albums, and no subscription creep.",
    logo: "/images/shutterfield-logo.png",
    status: "live",
  },
  {
    name: "SixGuess",
    url: "https://sixguess.com",
    tagline: "Wordle with friends. For real this time.",
    description: "Daily word puzzles, live leaderboards, friend circles, and smack talk - all the parts Wordle left out.",
    logo: "/images/sixguess-icon.svg",
    status: "live",
  },
  {
    name: "What a Great Day",
    url: "https://greatday.you",
    tagline: "Every day has something worth celebrating.",
    description: "A daily dose of historical events, weird holidays, and notable birthdays to make any morning feel a little more interesting.",
    logo: null,
    status: "coming-soon",
  },
  {
    name: "Acey Deucy",
    url: "#",
    tagline: "The card game your grandpa taught you.",
    description: "Simple rules, fast rounds, and just enough luck to keep it interesting. Coming soon.",
    logo: null,
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
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
          <span className="text-accent">We&apos;re Having Fun Here.</span>
        </h2>
        <p className="mt-4 text-lg text-text-secondary max-w-2xl">
          Using modern technology to take the pain out of doing the things we love.
        </p>
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
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {app.logo ? (
                      <Image
                        src={app.logo}
                        alt={`${app.name} logo`}
                        width={40}
                        height={40}
                        className="object-contain w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-border" />
                    )}
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
                    className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0"
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
