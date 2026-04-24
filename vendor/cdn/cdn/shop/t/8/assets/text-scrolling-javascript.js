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
  const isMobile = window.innerWidth <= 768;
  function wrapWordsInSpans(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node2) =>
            node2.parentNode.classList?.contains("blush-container")
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
  const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: textRevealContainer,
        start: "top 70%",
        end: "top 50%",
        scrub: 2,
        markers: !1,
      },
    }),
    totalWords = wordElements.length;
  (wordElements.forEach((word, index) => {
    const wordDuration = 1 / totalWords,
      startPosition = index * wordDuration;
    masterTimeline.fromTo(
      word,
      { color: "rgb(255, 255, 255)", opacity: 0.1 },
      {
        display: "inline-block",
        color: "rgb(250, 234, 222)",
        opacity: 1,
        duration: wordDuration,
        ease: "power2.inOut",
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
