function toDisplayText(value, fallback) {
  const safeValue = typeof value === "string" ? value.trim() : "";
  return safeValue || fallback;
}

export function createMissionCompletionPopup(popupSystem) {
  return {
    showCompletionInfo({ missionTitle, popupTitle, popupText, popupIcon }) {
      return popupSystem.prompt("mission-completion-info", (popupRoot, { hidePopup }) => {
        const titleElement = popupRoot.querySelector("[data-mission-completion-title]");
        const textElement = popupRoot.querySelector("[data-mission-completion-text]");
        const iconElement = popupRoot.querySelector("[data-mission-completion-icon]");
        const continueButton = popupRoot.querySelector("[data-mission-completion-continue]");

        const resolvedMissionTitle = toDisplayText(missionTitle, "Mission");
        titleElement.textContent = toDisplayText(popupTitle, `${resolvedMissionTitle} Complete`);
        textElement.textContent = toDisplayText(
          popupText,
          `${resolvedMissionTitle} has finished. Review the outcome and continue when ready.`,
        );
        iconElement.textContent = toDisplayText(popupIcon, "❗");

        continueButton.onclick = () => {
          hidePopup({ reason: "continue" });
        };

        continueButton.focus();
      });
    },
  };
}