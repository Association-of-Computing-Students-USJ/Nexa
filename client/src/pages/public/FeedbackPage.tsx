import { useState } from "react";
import Reveal from "../../components/Reveal";
import FeedbackForm from "../../components/FeedbackForm";

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="w-full min-w-0">
      <section className="relative bg-[#0e0e0e] overflow-hidden py-14 sm:py-20 md:py-28 min-h-dvh">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#19D1E6]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <Reveal variant="fade-up">
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/30 mb-6">
                  <span className="material-symbols-outlined text-[#19D1E6] text-3xl">check_circle</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Thank You!</h1>
                <p className="text-[#888] text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  Your feedback has been submitted successfully. We appreciate you taking the time to share your thoughts.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-[#2a2a2a] text-[#888] rounded-xl hover:border-[#19D1E6]/40 hover:text-[#19D1E6] transition-colors text-sm font-medium"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Submit Another Response
                </button>
              </div>
            </Reveal>
          ) : (
            <>
              <Reveal variant="fade-up">
                <div className="text-center mb-8 sm:mb-10">
                  <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">NEXA 2026</span>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-3">Event Feedback</h1>
                  <p className="text-[#888] text-sm sm:text-base leading-relaxed">
                    We value your opinion. Please share your experience and suggestions below.
                  </p>
                </div>
              </Reveal>

              <Reveal variant="fade-up" delayMs={100}>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 sm:p-8">
                  <FeedbackForm onSuccess={() => setSubmitted(true)} />
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
