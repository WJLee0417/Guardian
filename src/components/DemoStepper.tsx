import type { DemoState } from "../types/guardian";

export function DemoStepper({ states, currentState }: { states: readonly DemoState[]; currentState: DemoState }) {
  const currentIndex = states.indexOf(currentState);
  const progress = Math.round((currentIndex / (states.length - 1)) * 100);

  return (
    <section className="stepper" aria-label="Demo state stepper">
      <div className="progressMeta">
        <strong>현재 단계: {currentState.replaceAll("_", " ")}</strong>
        <span>Progress {progress}%</span>
      </div>
      <div className="stepLine" style={{ width: `${progress * 0.94}%` }} />
      <div className="stepperItems">
        {states.map((state, index) => (
          <div
            className={`step ${index < currentIndex ? "done" : ""} ${index === currentIndex ? "active" : ""}`}
            key={state}
          >
            <span className="stepDot">{index < currentIndex ? "✓" : index + 1}</span>
            <span className="stepLabel">{state.replaceAll("_", " ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
