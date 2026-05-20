(window.addEventListener("load", () => {
  (gsap.registerPlugin(ScrollTrigger),
    setTimeout(initTextScrollAnimation, 3e3));
}),
  document.addEventListener("DOMContentLoaded", () => {
    const loadingPhase = document.getElementById("loading-phase");
    (!loadingPhase || loadingPhase.style.display === "none") &&
      (gsap.registerPlugin(ScrollTrigger),
      setTimeout(initTextScrollAnimation, 500));
  }));
function initTextScrollAnimation() {
  const textRevealContainer = document.getElementById("textRevealContainer"),
    textContent = document.getElementById("textContent");
  if (!textRevealContainer || !textContent) {
    console.warn("Text elements not found");
    return;
  }
  if (textContent.dataset.wordAnimationReady === "true") {
    ScrollTrigger.refresh();
    return;
  }
  function wrapWordsInSpans(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node2) =>
            node2.parentNode.classList?.contains("blush-container") ||
            node2.parentNode.classList?.contains("word-animate")
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT,
        },
        !1,
      ),
      textNodes = [];
    let node;
    for (; (node = walker.nextNode()); )
      node.textContent.trim() && textNodes.push(node);
    textNodes.forEach((textNode) => {
      if (textNode.parentNode.classList?.contains("blush-container")) return;
      const words = textNode.textContent.split(/(\s+)/),
        fragment = document.createDocumentFragment();
      (words.forEach((word) => {
        if (word.trim()) {
          const span = document.createElement("span");
          ((span.textContent = word),
            (span.style.cssText = "color: rgb(255, 255, 255);"),
            span.classList.add("word-animate"),
            fragment.appendChild(span));
        } else fragment.appendChild(document.createTextNode(word));
      }),
        textNode.parentNode.replaceChild(fragment, textNode));
    });
  }
  wrapWordsInSpans(textContent);
  textContent.dataset.wordAnimationReady = "true";
  const wordElements = textContent.querySelectorAll(".word-animate"),
    blushContainer = document.querySelector(".blush-container");
  if (!wordElements.length) {
    console.warn("No words found to animate");
    return;
  }
  blushContainer
    ? (console.log("Blush container found and will be animated"),
      blushContainer.classList.remove("active"))
    : console.warn(
        "Blush container not found - animations may not work correctly",
      );
  gsap.set(wordElements, {
    display: "inline-block",
    color: "rgb(255, 255, 255)",
    opacity: 0.12,
    y: 26,
    filter: "blur(8px)",
    willChange: "transform, opacity, filter, color",
  });
  const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: textRevealContainer,
        start: "top 80%",
        end: "bottom 45%",
        scrub: 1.2,
        markers: !1,
      },
    }),
    totalWords = wordElements.length;
  (wordElements.forEach((word, index) => {
    const wordDuration = 1 / totalWords,
      startPosition = index * wordDuration * 0.75;
    masterTimeline.to(
      word,
      {
        color: "rgb(250, 234, 222)",
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: wordDuration * 2,
        ease: "power2.out",
      },
      startPosition,
    );
  }),
    blushContainer &&
      ScrollTrigger.create({
        trigger: textRevealContainer,
        start: "top 70%",
        end: "top 50%",
        onUpdate: (self) => {
          self.progress >= 1
            ? blushContainer.classList.add("active")
            : self.progress < 0.9 && blushContainer.classList.remove("active");
        },
      }),
    ScrollTrigger.refresh());
}
window.addEventListener("resize", () => ScrollTrigger.refresh());
