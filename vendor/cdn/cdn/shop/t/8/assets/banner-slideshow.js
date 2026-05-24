class BannerSlideshow {
    constructor(sectionId, options = {}) {
        (this.sectionId = sectionId),
            (this.wrapper = document.getElementById(`banner-section-${sectionId}`)),
            (this.container = this.wrapper?.querySelector(".banner-section")),
            !(!this.wrapper || !this.container) &&
            ((this.config = {
                autoplay: options.autoplay ?? !1,
                autoplayDuration: options.autoplayDuration ?? 2e3,
                ...options,
            }),
                (this.currentIndex = 0),
                (this.slides = this.container.querySelectorAll(".banner-slide")),
                (this.dots = this.wrapper.querySelectorAll(".banner-dot")),
                (this.totalSlides = this.slides.length),
                (this.isUserInteracting = !1),
                (this.autoplayTimer = null),
                (this.scrollTimer = null),
                (this.isTransitioning = !1),
                (this.lastWheelAt = 0),
                (this.touchStartX = 0),
                (this.touchStartY = 0),
                (this.boundHandlers = new Map()),
                !(this.totalSlides <= 1) && this.init());
    }
    init() {
        this.setupInfiniteLoop(), this.bindEvents(), this.setInitialState(), this.startAutoplay(); this.bindCTAEvents();
    }

    bindCTAEvents() {
        this.wrapper.querySelectorAll(".cta-container").forEach(cta => {
            cta.addEventListener("mousedown", (e) => e.stopPropagation());
            cta.addEventListener("touchstart", (e) => e.stopPropagation());
        });
    }
    setupInfiniteLoop() {
        const firstSlideClone = this.slides[0].cloneNode(!0);

        firstSlideClone.classList.remove("active"),
            firstSlideClone.setAttribute("data-cloned", "true"),
            this.container.appendChild(firstSlideClone),
            (this.slides = this.container.querySelectorAll(".banner-slide")),
            (this.totalSlides = this.slides.length);
    }
bindEvents() {
    const wheelHandler = (e) => this.handleWheel(e);
    const touchStartHandler = (e) => this.handleTouchStart(e);
    const touchEndHandler = (e) => this.handleTouchEnd(e);

    this.container.addEventListener("wheel", wheelHandler, { passive: false });
    this.container.addEventListener("touchstart", touchStartHandler, { passive: true });
    this.container.addEventListener("touchend", touchEndHandler, { passive: true });
    this.boundHandlers.set("wheel", wheelHandler);
    this.boundHandlers.set("touchstart-controlled", { element: this.container, handler: touchStartHandler, event: "touchstart" });
    this.boundHandlers.set("touchend-controlled", { element: this.container, handler: touchEndHandler, event: "touchend" });

    const scrollHandler = () => this.handleScroll();
    this.container.addEventListener("scroll", scrollHandler, { passive: true });
    this.boundHandlers.set("scroll", scrollHandler);

    // ✅ DRAG DETECTION STARTS HERE
    this.startX = 0;
    this.isDragging = false;

    this.container.addEventListener("touchstart", (e) => {
        this.startX = e.touches[0].clientX;
        this.isDragging = false;
    }, { passive: true });

    this.container.addEventListener("touchmove", (e) => {
        const diff = Math.abs(e.touches[0].clientX - this.startX);

        if (diff > 10) { // threshold = real drag
            this.isDragging = true;
        }
    }, { passive: true });
    // ✅ DRAG DETECTION ENDS HERE

    const startHandler = () => this.handleInteractionStart(),
          endHandler = () => this.handleInteractionEnd();

    ["touchstart", "mousedown"].forEach((event) => {
        this.container.addEventListener(event, startHandler, { passive: true });
        this.boundHandlers.set(event, startHandler);
    });

    ["touchend", "mouseup", "mouseleave"].forEach((event) => {
        this.container.addEventListener(event, endHandler, { passive: true });
        this.boundHandlers.set(event, endHandler);
    });

    this.bindDotEvents();
}
    handleWheel(e) {
        const horizontalDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
        if (!horizontalDelta) return;

        e.preventDefault();

        const now = Date.now();
        if (now - this.lastWheelAt < 650 || this.isTransitioning) return;
        this.lastWheelAt = now;

        horizontalDelta > 0 ? this.nextSlide(true) : this.prevSlide(true);
    }
    handleTouchStart(e) {
        if (!e.changedTouches.length) return;
        this.touchStartX = e.changedTouches[0].clientX;
        this.touchStartY = e.changedTouches[0].clientY;
    }
    handleTouchEnd(e) {
        if (!e.changedTouches.length) return;

        const diffX = e.changedTouches[0].clientX - this.touchStartX,
            diffY = e.changedTouches[0].clientY - this.touchStartY;

        if (Math.abs(diffX) < 45 || Math.abs(diffX) < Math.abs(diffY) * 1.15) return;

        diffX < 0 ? this.nextSlide(true) : this.prevSlide(true);
    }
    bindDotEvents() {
        this.dots.forEach((dot, index) => {
            const clickHandler = (e) => {
                e.preventDefault(), this.goToSlide(index, !0);
            },
                keyHandler = (e) => {
                    (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.goToSlide(index, !0));
                };
            dot.addEventListener("click", clickHandler),
                dot.addEventListener("keydown", keyHandler),
                this.boundHandlers.set(`dot-${index}-click`, { element: dot, handler: clickHandler, event: "click" }),
                this.boundHandlers.set(`dot-${index}-key`, { element: dot, handler: keyHandler, event: "keydown" });
        });
    }
    handleScroll() {
        this.scrollTimer && clearTimeout(this.scrollTimer);

        this.isUserInteracting = true;
        this.pauseAutoplay();


        this.scrollTimer = setTimeout(() => {
            this.updateFromScroll();
            this.isUserInteracting = false;
            this.resumeAutoplay();

        }, 150);
    }






   


    updateFromScroll() {
        const scrollLeft = this.container.scrollLeft,
            slideWidth = this.container.clientWidth,
            calculatedIndex = Math.round(scrollLeft / slideWidth);
        calculatedIndex >= this.totalSlides - 1
            ? this.resetToFirstSlide()
            : calculatedIndex !== this.currentIndex &&
            ((this.currentIndex = calculatedIndex), this.updateActiveStates());
    }
    handleInteractionStart() {
        (this.isUserInteracting = !0), this.pauseAutoplay();

        this.isUserInteracting = true;
        this.pauseAutoplay();



    }
    handleInteractionEnd() {
        setTimeout(() => {
            (this.isUserInteracting = !1), this.resumeAutoplay();
        }, 300);
    }
goToSlide(targetIndex, isUserInitiated = false) {
    if (targetIndex === this.currentIndex || this.isTransitioning) return;

    if (isUserInitiated) {
        this.isUserInteracting = true;
        this.pauseAutoplay();
    }

    this.isTransitioning = true;

    const slideWidth = this.container.clientWidth;
    const targetScroll = targetIndex * slideWidth;

    this.container.scrollTo({ left: targetScroll, behavior: "smooth" });

    this.currentIndex = targetIndex;

    // 🔥 This already handles animation correctly
    this.updateActiveStates();

    setTimeout(() => {
        this.isTransitioning = false;

        if (isUserInitiated) {
            this.isUserInteracting = false;
            this.resumeAutoplay();
        }
    }, 350);
}
    nextSlide(isUserInitiated = false) {
        if ((!isUserInitiated && this.isUserInteracting) || this.isTransitioning) return;
        const nextIndex = this.currentIndex + 1;
        nextIndex >= this.totalSlides - 1
            ? ((this.isTransitioning = !0),
                this.container.scrollTo({ left: nextIndex * this.container.clientWidth, behavior: "smooth" }),
                setTimeout(() => {
                    this.resetToFirstSlide(), (this.isTransitioning = !1);
                }, 350))
            : this.goToSlide(nextIndex, isUserInitiated);
    }
    prevSlide(isUserInitiated = false) {
        if ((!isUserInitiated && this.isUserInteracting) || this.isTransitioning) return;
        const originalSlidesCount = this.totalSlides - 1,
            prevIndex = this.currentIndex <= 0 ? originalSlidesCount - 1 : this.currentIndex - 1;
        this.goToSlide(prevIndex, isUserInitiated);
    }
    resetToFirstSlide() {
        (this.container.style.scrollBehavior = "auto"),
            (this.container.scrollLeft = 0),
            (this.currentIndex = 0),
            this.updateActiveStates(),
            requestAnimationFrame(() => {
                this.container.style.scrollBehavior = "smooth";
            });
    }
    setInitialState() {
        (this.currentIndex = 0), (this.container.scrollLeft = 0), this.updateActiveStates();
    }

updateActiveStates() {
    this.slides.forEach((slide, index) => {
        const isActive = index === this.currentIndex;

        // Toggle active class on the slide
        slide.classList.toggle("active", isActive);

        // Get the CTA container from the slide
        const cta = slide.querySelector(".cta-container");

        if (!cta) return; // If no CTA container, exit
        if (!cta) return;

        // If the slide is active
        if (isActive) {
            // 🔥 reset first
            cta.classList.remove("animate");

            // force reflow (important)
            // The following line forces the browser to reflow the element,
            // which is necessary for the animation to work.
            void cta.offsetWidth;

            // 🔥 trigger animation
            cta.classList.add("animate");
        } else {
            // 🔥 IMPORTANT: remove animate from inactive slides
            cta.classList.remove("animate");
        }
    });

    const originalSlidesCount = this.totalSlides - 1,
        dotIndex = this.currentIndex >= originalSlidesCount ? 0 : this.currentIndex;

    this.dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === dotIndex);
/*******  dda7bdea-5161-48e2-b436-effb3803b549  *******/
    });
}
    startAutoplay() {
        this.config.autoplay && this.scheduleNext();
    }
    scheduleNext() {
        this.clearAutoplay(),
            (this.autoplayTimer = setTimeout(() => {
                this.isUserInteracting ? this.scheduleNext() : (this.nextSlide(), this.scheduleNext());
            }, this.config.autoplayDuration));
    }
    pauseAutoplay() {
        this.clearAutoplay();
    }
    resumeAutoplay() {
        this.config.autoplay && !this.isUserInteracting && this.scheduleNext();
    }
    clearAutoplay() {
        this.autoplayTimer && (clearTimeout(this.autoplayTimer), (this.autoplayTimer = null));
    }
    destroy() {
        this.clearAutoplay(),
            this.scrollTimer && clearTimeout(this.scrollTimer),
            this.boundHandlers.forEach((value, key) => {
                typeof value == "function"
                    ? this.container.removeEventListener(key, value)
                    : value.element.removeEventListener(value.event, value.handler);
            }),
            this.boundHandlers.clear();
    }
}
class BannerTransform {
    constructor() {
        (this.initialized = !1), (this.isMobile = window.innerWidth <= 768), (this.scrollTrigger = null), this.init();
    }
    init() {
        if (this.isLoadingActive()) {
            setTimeout(() => this.init(), 500);
            return;
        }
        this.setupScrollTrigger(), this.bindResize();
    }
    isLoadingActive() {
        const loading = document.getElementById("loading-phase"),
            mainContent = document.getElementById("main-content");
        return (
            (loading && loading.style.display !== "none" && loading.style.opacity !== "0") ||
            (mainContent && mainContent.style.display === "none")
        );
    }
    setupScrollTrigger() {
        const bannerSection = document.querySelector(".banner-slideshow-section");
        if (!bannerSection) return;
        this.scrollTrigger && this.scrollTrigger.kill(), (this.isMobile = window.innerWidth <= 768);
        const endDistance = this.isMobile ? "+=80%" : "+=70%";
        (this.scrollTrigger = ScrollTrigger.create({
            trigger: bannerSection,
            start: "top top",
            end: endDistance,
            scrub: 0.65,
            onUpdate: (self) => {
                const progress = self.progress,
                    translateY = progress * 15,
                    scale = 1 - progress * 0.2,
                    rotateZ = progress * 2.85;
                gsap.set(bannerSection, {
                    transform: `translate3d(0px, ${translateY}vw, 0px) scale3d(${scale}, ${scale}, 1) rotateZ(${rotateZ}deg)`,
                    transformStyle: "preserve-3d",
                });
            },
        })),
            (this.initialized = !0);
    }
    bindResize() {
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer),
                (resizeTimer = setTimeout(() => {
                    window.innerWidth <= 768 !== this.isMobile ? this.setupScrollTrigger() : ScrollTrigger.refresh();
                }, 250));
        });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[id^="banner-section-"]').forEach((section) => {
        const sectionId = section.id.replace("banner-section-", ""),
            config = {
                autoplay: section.dataset.autoplay === "true",
                autoplayDuration: parseInt(section.dataset.autoplayDuration) || 2e3,
            };
        new BannerSlideshow(sectionId, config);
    });
}),
    window.addEventListener("load", () => {
        typeof gsap < "u" && (gsap.registerPlugin(ScrollTrigger), new BannerTransform());
    }),
    typeof window < "u" && ((window.BannerSlideshow = BannerSlideshow), (window.BannerTransform = BannerTransform));
