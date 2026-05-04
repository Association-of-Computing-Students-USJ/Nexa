export default function FAQPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">FAQ</h1>
      <div className="space-y-4 text-zinc-300">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="font-medium text-white">How do I register?</div>
          <div className="mt-1 text-sm">Use the registration page to submit your details.</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="font-medium text-white">How do live games work?</div>
          <div className="mt-1 text-sm">Scores are pushed in real-time via Socket.IO.</div>
        </div>
      </div>
    </section>
  );
}

