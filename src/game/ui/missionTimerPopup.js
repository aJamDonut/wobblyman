const DURATION_PRESETS = [
  { label: "1m", seconds: 60 },
  { label: "6h", seconds: 6 * 60 * 60 },
  { label: "12h", seconds: 12 * 60 * 60 },
  { label: "18h", seconds: 18 * 60 * 60 },
  { label: "1d", seconds: 24 * 60 * 60 }
];

function toClock(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getDefaultPresetIndex(seconds) {
  const minimumSeconds = Math.max(1, Math.floor(seconds || 1));
  const foundIndex = DURATION_PRESETS.findIndex((preset) => preset.seconds >= minimumSeconds);
  return foundIndex === -1 ? DURATION_PRESETS.length - 1 : foundIndex;
}

export function createMissionTimerPopup(popupSystem) {
  return {
    selectDuration({ missionKey, missionTitle, defaultSeconds }) {
      return popupSystem.prompt("mission-timer", (popupRoot, { hidePopup }) => {
        const title = popupRoot.querySelector("#missionTimerTitle");
        const time = popupRoot.querySelector("#missionTimerCurrent");
        const scale = popupRoot.querySelector("#missionTimerScale");
        const minusButton = popupRoot.querySelector("#missionTimerMinus");
        const plusButton = popupRoot.querySelector("#missionTimerPlus");
        const cancelButton = popupRoot.querySelector("#missionTimerCancel");
        const startButton = popupRoot.querySelector("#missionTimerStart");
        const labels = [...popupRoot.querySelectorAll(".popup-scale-label")];

        let selectedIndex = getDefaultPresetIndex(defaultSeconds);

        function render() {
          const selectedDuration = DURATION_PRESETS[selectedIndex];
          title.textContent = missionTitle || missionKey || "SELECT DURATION";
          time.textContent = toClock(selectedDuration.seconds);

          minusButton.disabled = selectedIndex === 0;
          plusButton.disabled = selectedIndex === DURATION_PRESETS.length - 1;

          const positionPercent = (selectedIndex / (DURATION_PRESETS.length - 1)) * 100;
          scale.style.setProperty("--popup-marker-x", `${positionPercent}%`);

          labels.forEach((label, index) => {
            label.classList.toggle("active", index === selectedIndex);
          });
        }

        minusButton.onclick = () => {
          selectedIndex = Math.max(0, selectedIndex - 1);
          render();
        };

        plusButton.onclick = () => {
          selectedIndex = Math.min(DURATION_PRESETS.length - 1, selectedIndex + 1);
          render();
        };

        cancelButton.onclick = () => {
          hidePopup({ confirmed: false, reason: "cancel" });
        };

        startButton.onclick = () => {
          hidePopup({ confirmed: true, seconds: DURATION_PRESETS[selectedIndex].seconds });
        };

        render();
      });
    }
  };
}
