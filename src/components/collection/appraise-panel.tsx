import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { appraisalOf, markQuiz, QUIZ, TRIAL_KEY, TRIAL_MODE } from "@/lib/appraisal";
import { tr } from "@/lib/i18n";
import { trialLevels } from "@/lib/trial";

/** Giám định of one card: Sát hạch (quiz) and Thực chiến (levels). Opens over the album and the card vault. */
export function AppraisePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"menu" | "quiz">("menu");
  const [at, setAt] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);
  const [done, setDone] = useState(() => appraisalOf(id));
  const questions = QUIZ[id] ?? [];
  const levels = trialLevels(id);
  const question = questions[at];

  const answer = (index: number) => {
    if (pick !== null || !question) return;
    setPick(index);
  };
  const next = () => {
    if (!question || pick === null) return;
    if (pick !== question.right) {
      setAt(0);
      setPick(null);
      return;
    }
    if (at + 1 < questions.length) {
      setAt(at + 1);
      setPick(null);
      return;
    }
    setPaid(markQuiz(id));
    setDone(appraisalOf(id));
    setStep("menu");
    setAt(0);
    setPick(null);
  };
  const play = (level: number) => {
    sessionStorage.setItem("clash-mode", TRIAL_MODE);
    sessionStorage.setItem(TRIAL_KEY, JSON.stringify({ id, level }));
    sessionStorage.setItem("clash-tutorial-from", window.location.pathname);
    void navigate({ to: "/play" });
  };

  return (
    <div className="ap-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="ap-panel" role="dialog" aria-label={tr("Giám định")}>
        <h2>{tr("Giám định")}</h2>
        {paid || (done.paid && step === "menu") ? <p className="ap-paid">{tr("Đã hoàn thành cả hai phần: nhận ★2")}</p> : null}
        {step === "menu" ? (
          <>
            {questions.length ? (
              <button type="button" className="ap-row" onClick={() => setStep("quiz")}>
                <b>{tr("Sát hạch")}</b>
                <span>{tr(`${questions.length} câu trắc nghiệm`)}</span>
                {done.quiz ? <i>✓</i> : null}
              </button>
            ) : null}
            {levels.map((level, index) => (
              <button type="button" className="ap-row" key={level.title} onClick={() => play(index)}>
                <b>{tr(`Thực chiến ${index + 1}: ${level.title}`)}</b>
                <span>{tr(level.goal)}</span>
                {done.trials.includes(index) ? <i>✓</i> : null}
              </button>
            ))}
            {!questions.length && !levels.length ? <p>{tr("Lá này chưa có bài giám định.")}</p> : null}
          </>
        ) : question ? (
          <>
            <p className="ap-count">{tr(`Câu ${at + 1}/${questions.length}`)}</p>
            <p className="ap-ask">{tr(question.ask)}</p>
            {question.options.map((option, index) => (
              <button
                type="button"
                key={option}
                className={`ap-opt${pick === null ? "" : index === question.right ? " is-right" : index === pick ? " is-wrong" : ""}`}
                onClick={() => answer(index)}
              >
                {tr(option)}
              </button>
            ))}
            {pick !== null ? (
              <>
                <p className="ap-why">({tr(question.why)})</p>
                {pick !== question.right ? <p className="ap-why">{tr("Sai rồi. Làm lại từ câu 1.")}</p> : null}
                <button type="button" className="ap-go" onClick={next}>
                  {pick !== question.right ? tr("Làm lại") : at + 1 < questions.length ? tr("Câu tiếp") : tr("Xong")}
                </button>
              </>
            ) : null}
          </>
        ) : null}
        <button type="button" className="ap-close" onClick={step === "quiz" ? () => (setStep("menu"), setAt(0), setPick(null)) : onClose}>
          {tr(step === "quiz" ? "Quay lại" : "Đóng")}
        </button>
      </section>
    </div>
  );
}
