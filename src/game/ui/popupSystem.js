export function createPopupSystem(layerElement) {
  const popupRoots = new Map(
    [...layerElement.querySelectorAll("[data-popup-id]")].map((popupRoot) => [popupRoot.dataset.popupId, popupRoot])
  );
  let activePopup = null;

  function showPopup(popupId, options = {}) {
    if (!popupRoots.has(popupId)) {
      throw new Error(`Unknown popup: ${popupId}`);
    }

    if (activePopup) {
      hidePopup({ reason: "replaced" });
    }

    const popupRoot = popupRoots.get(popupId);
    activePopup = { popupId, popupRoot, onClose: options.onClose || null };

    layerElement.classList.add("show");
    layerElement.setAttribute("aria-hidden", "false");
    popupRoot.classList.add("show");
    document.body.classList.add("popup-open");

    if (options.onOpen) {
      options.onOpen(popupRoot, { hidePopup });
    }
  }

  function hidePopup(result = { reason: "closed" }) {
    if (!activePopup) {
      return;
    }

    const { popupRoot, onClose } = activePopup;
    activePopup = null;

    popupRoot.classList.remove("show");
    layerElement.classList.remove("show");
    layerElement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("popup-open");

    if (onClose) {
      onClose(result);
    }
  }

  function prompt(popupId, setup) {
    return new Promise((resolve) => {
      let settled = false;

      const settle = (result) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(result);
      };

      showPopup(popupId, {
        onOpen: (popupRoot, api) => {
          setup(popupRoot, {
            ...api,
            settle
          });
        },
        onClose: settle
      });
    });
  }

  layerElement.addEventListener("click", (event) => {
    if (event.target === layerElement) {
      hidePopup({ reason: "backdrop" });
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activePopup) {
      event.preventDefault();
      hidePopup({ reason: "escape" });
    }
  });

  return {
    showPopup,
    hidePopup,
    prompt,
    isOpen: () => Boolean(activePopup)
  };
}
