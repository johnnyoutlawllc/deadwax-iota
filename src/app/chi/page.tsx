// Channel Health Index
// Johnny Outlaw, LLC — Designed in Rockwall, TX

export default function ChannelHealthIndex() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
            <path d="M3 17l4-8 4 4 4-6 4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-3">
          Channel Health Index
        </h1>
        <p className="text-text-muted text-lg mb-8">Coming soon.</p>
        <a
          href="/"
          className="text-sm text-accent hover:underline transition-colors"
        >
          ← Back to Outlaw Apps
        </a>
      </div>
    </div>
  );
}
