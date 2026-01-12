'use client';

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen clinic-animated-bg flex items-center justify-center px-4">
      <div className="blob one" />
      <div className="blob two" />
      <div className="blob three" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border bg-white shadow-sm">
        {/* Left visual panel */}
        <div className="hidden md:block p-8 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="text-sm font-semibold text-slate-700">ClinicFlow</div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            A calmer way to run appointments.
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Book faster. Stay organized. Keep patient records clean.
          </p>

          {/* “moving images” without assets: animated icon row */}
          <div className="mt-8 space-y-3">
            <div className="rounded-2xl border bg-white p-4 animate-pulse">
              <div className="text-sm font-medium">✅ Instant booking confirmation</div>
              <div className="text-xs text-slate-500 mt-1">Email + logs for proof</div>
            </div>
            <div className="rounded-2xl border bg-white p-4" style={{ animation: 'floaty 8s ease-in-out infinite' }}>
              <div className="text-sm font-medium">🗓️ Any-available provider assignment</div>
              <div className="text-xs text-slate-500 mt-1">No manual matching stress</div>
            </div>
            <div className="rounded-2xl border bg-white p-4" style={{ animation: 'floaty 9s ease-in-out infinite', animationDelay: '1s' }}>
              <div className="text-sm font-medium">🧾 Visit notes + profiles</div>
              <div className="text-xs text-slate-500 mt-1">Staff can document quickly</div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
