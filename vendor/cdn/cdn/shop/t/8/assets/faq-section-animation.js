let faqAccordionInitialized = !1;
function initFaqAccordion() {
  if (faqAccordionInitialized) return;
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (question) {
      const newQuestion = question.cloneNode(!0);
      question.parentNode.replaceChild(newQuestion, question);
    }
  });
  const refreshedFaqItems = document.querySelectorAll(".faq-item");
  (refreshedFaqItems.forEach((item) => {
    const question = item.querySelector(".faq-question"),
      answer = item.querySelector(".faq-answer"),
      answerContent = item.querySelector(".faq-answer-content");
    if (!question || !answer || !answerContent) return;
    const handleToggle = (e) => {
      (e.preventDefault(),
        e.stopPropagation(),
        toggleFaq(item, answer, answerContent, refreshedFaqItems));
    };
    (question.addEventListener("click", handleToggle),
      question.addEventListener("keydown", (e) => {
        (e.key === "Enter" || e.key === " ") && handleToggle(e);
      }));
  }),
    (faqAccordionInitialized = !0));
}
function toggleFaq(currentItem, answer, answerContent, allItems) {
  const isActive = currentItem.classList.contains("active");
  (allItems.forEach((item) => {
    if (item !== currentItem && item.classList.contains("active")) {
      const otherAnswer = item.querySelector(".faq-answer");
      otherAnswer && closeFaq(item, otherAnswer);
    }
  }),
    isActive
      ? closeFaq(currentItem, answer)
      : setTimeout(() => openFaq(currentItem, answer, answerContent), 50));
}
function openFaq(item, answer, answerContent) {
  if (!item || !answer || !answerContent) return;
  item.classList.add("active");
  const question = item.querySelector(".faq-question");
  question && question.setAttribute("aria-expanded", "true");
  const contentHeight = answerContent.scrollHeight + 20;
  answer.style.height = `${contentHeight}px`;
}
function closeFaq(item, answer) {
  if (!item || !answer) return;
  item.classList.remove("active");
  const question = item.querySelector(".faq-question");
  (question && question.setAttribute("aria-expanded", "false"),
    (answer.style.height = "0px"));
}
function initFaqHeadingAnimation() {
  const faqSection = document.querySelector(".faq-section"),
    faqSubheading = document.querySelector(".faq-subheading");
  if (!faqSection || !faqSubheading) return;
  let hasAnimated = !1;
  (ScrollTrigger.create({
    trigger: faqSection,
    start: "top 50%",
    end: "bottom top",
    onEnter: () => {
      (faqSubheading.classList.add("animate-width"), (hasAnimated = !0));
    },
    onEnterBack: () => {
      hasAnimated && faqSubheading.classList.add("animate-width");
    },
    onLeave: () => faqSubheading.classList.remove("animate-width"),
    onLeaveBack: () => faqSubheading.classList.remove("animate-width"),
  }),
    ScrollTrigger.refresh(),
    setTimeout(() => ScrollTrigger.refresh(), 1e3));
}
function checkFaqAnimation() {
  const faqSection = document.querySelector(".faq-section"),
    faqSubheading = document.querySelector(".faq-subheading");
  if (!faqSection || !faqSubheading) return;
  const rect = faqSection.getBoundingClientRect(),
    viewportHeight = window.innerHeight;
  rect.top <= viewportHeight * 0.5 && rect.bottom > 0
    ? faqSubheading.classList.add("animate-width")
    : (rect.bottom <= 0 || rect.top >= viewportHeight) &&
      faqSubheading.classList.remove("animate-width");
}
function initFaq() {
  (gsap.registerPlugin(ScrollTrigger),
    initFaqAccordion(),
    initFaqHeadingAnimation());
}
(window.addEventListener("load", () => {
  (initFaqAccordion(), setTimeout(initFaq, 3e3));
}),
  document.addEventListener("DOMContentLoaded", () => {
    initFaqAccordion();
    const loadingPhase = document.getElementById("loading-phase");
    (!loadingPhase || loadingPhase.style.display === "none") &&
      setTimeout(initFaq, 500);
  }),
  window.addEventListener("scroll", checkFaqAnimation),
  setTimeout(checkFaqAnimation, 100));
//# sourceMappingURL=/cdn/shop/t/8/assets/faq-section-animation.js.map?v=53513994526984560201754340011
