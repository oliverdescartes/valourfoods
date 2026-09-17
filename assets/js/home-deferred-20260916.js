const cfPopupOverlay = document.getElementById("cfPopupOverlay");
const cfPopupVideoHost = document.getElementById("cfPopupVideoHost");
const cfPopupClose = document.getElementById("cfPopupClose");
let cfPopupVideo = null;

function createCfVideoCard(item) {
  const card = document.createElement("div");
  card.className = "cf-card";
  card.dataset.youtubeId = item.videoId;

  const video = document.createElement("iframe");
  video.title = item.title || "Valour recipe video preview";
  video.src = `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.videoId}&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`;
  video.allow = "autoplay; encrypted-media";
  video.loading = "lazy";
  card.appendChild(video);
  return card;
}

async function initializeCfVideos() {
  const carousel = document.querySelector(".cf-carousel");
  if (!carousel) return;

  try {
    const response = await fetch("/api/carousel-videos", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const videos = Array.isArray(payload.items) ? payload.items : [];
    if (!videos.length) throw new Error("No active videos");
    carousel.replaceChildren(...videos.map(createCfVideoCard));
  } catch (error) {
    console.error("Carousel videos could not be loaded", error);
    const message = document.createElement("p");
    message.className = "cf-loading-message";
    message.setAttribute("role", "status");
    message.textContent = "Videos are temporarily unavailable.";
    carousel.replaceChildren(message);
    return;
  }

  /* 🎬 OPEN POPUP */
  document.querySelectorAll(".cf-card").forEach((card) => {
    const video = card.querySelector("iframe");
    const showVideo = () => card.classList.add("cf-video-ready");
    video.addEventListener("load", showVideo, { once: true });

    card.addEventListener("click", () => {
      const youtubeId = card.dataset.youtubeId;
      cfPopupVideo = document.createElement("iframe");
      cfPopupVideo.title = "Valour recipe video";
      cfPopupVideo.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`;
      cfPopupVideo.allow =
        "autoplay; encrypted-media; picture-in-picture; fullscreen";
      cfPopupVideo.allowFullscreen = true;
      cfPopupVideoHost.replaceChildren(cfPopupVideo);
      cfPopupOverlay.style.display = "flex";
    });
  });

  /* ❌ CLOSE POPUP */
  function closePopup() {
    cfPopupOverlay.style.display = "none";
    if (!cfPopupVideo) return;
    cfPopupVideoHost.replaceChildren();
    cfPopupVideo = null;
  }

  cfPopupClose.onclick = closePopup;

  cfPopupOverlay.onclick = (e) => {
    if (e.target === cfPopupOverlay) {
      closePopup();
    }
  };

  /* ⌨️ ESC KEY CLOSE */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePopup();
    }
  });

  // for reel slider
  const cf3d_cards = document.querySelectorAll(".cf-card");
  let cf3d_currentIndex = Math.floor(cf3d_cards.length / 2);

  let cf3d_autoSlideTimer;
  let cf3d_isInView = false;
  let cf3d_isAnimating = false; // 🔥 lock to prevent overlap

  const cf3d_SLIDE_INTERVAL = 4000;
  const cf3d_ANIMATION_TIME = 600; // match CSS transition

  /* 🎯 UPDATE FUNCTION */
  function cf3d_updateCarousel() {
    cf3d_isAnimating = true;

    const cf3d_cardWidth = cf3d_cards[0]?.getBoundingClientRect().width || 300;
    const cf3d_offsetX =
      cf3d_cardWidth * (window.innerWidth <= 760 ? 0.52 : 0.62);
    const cf3d_rotateY = window.innerWidth <= 760 ? 20 : 35;

    cf3d_cards.forEach((cf3d_card, cf3d_i) => {
      const cf3d_diff = cf3d_i - cf3d_currentIndex;
      cf3d_card.classList.remove("cf-active");

      if (cf3d_diff === 0) {
        cf3d_card.style.transform = `
        translateX(0px)
        scale(1.05)
        rotateY(0deg)
      `;
        cf3d_card.classList.add("cf-active");
      } else {
        cf3d_card.style.transform = `
        translateX(${cf3d_diff * cf3d_offsetX}px)
        scale(0.85)
        rotateY(${cf3d_diff > 0 ? -cf3d_rotateY : cf3d_rotateY}deg)
      `;
      }
    });

    // 🔓 unlock after animation completes
    setTimeout(() => {
      cf3d_isAnimating = false;
    }, cf3d_ANIMATION_TIME);
  }

  /* ▶️ AUTO SLIDE */
  function cf3d_startAutoSlide() {
    cf3d_clearAutoSlide(); // 🔥 prevent stacking

    if (!cf3d_isInView || document.hidden) return;

    cf3d_autoSlideTimer = setInterval(() => {
      if (cf3d_isAnimating) return; // 🔥 prevent conflict

      cf3d_goNext();
    }, cf3d_SLIDE_INTERVAL);
  }

  /* 🛑 CLEAR TIMER */
  function cf3d_clearAutoSlide() {
    if (cf3d_autoSlideTimer) {
      clearInterval(cf3d_autoSlideTimer);
      cf3d_autoSlideTimer = null;
    }
  }

  /* 🔁 SAFE NAV FUNCTIONS */
  function cf3d_goNext() {
    if (cf3d_isAnimating) return;

    cf3d_currentIndex =
      cf3d_currentIndex < cf3d_cards.length - 1 ? cf3d_currentIndex + 1 : 0;

    cf3d_updateCarousel();
  }

  function cf3d_goPrev() {
    if (cf3d_isAnimating) return;

    cf3d_currentIndex =
      cf3d_currentIndex > 0 ? cf3d_currentIndex - 1 : cf3d_cards.length - 1;

    cf3d_updateCarousel();
  }

  /* ⏹ RESET TIMER (debounced) */
  function cf3d_resetAutoSlide() {
    cf3d_clearAutoSlide();

    // 🔥 delay restart slightly to avoid clash
    setTimeout(() => {
      cf3d_startAutoSlide();
    }, 1000);
  }

  /* 👉 BUTTONS */
  document.querySelector(".cf-next").onclick = () => {
    cf3d_goNext();
    cf3d_resetAutoSlide();
  };

  document.querySelector(".cf-prev").onclick = () => {
    cf3d_goPrev();
    cf3d_resetAutoSlide();
  };

  /* ⏸ HOVER PAUSE */
  const cf3d_wrapper = document.querySelector(".cf-wrapper");

  cf3d_wrapper.addEventListener("mouseenter", () => {
    cf3d_clearAutoSlide();
  });

  cf3d_wrapper.addEventListener("mouseleave", () => {
    cf3d_startAutoSlide();
  });

  /* 🚀 INIT */
  const cf3d_observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        cf3d_isInView = entry.isIntersecting && entry.intersectionRatio >= 0.6;

        if (cf3d_isInView) {
          cf3d_updateCarousel();
          cf3d_startAutoSlide();
        } else {
          cf3d_clearAutoSlide();
        }
      });
    },
    { rootMargin: "0px", threshold: [0, 0.6] },
  );

  cf3d_observer.observe(cf3d_wrapper);

  let cf3d_resizeFrame;
  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(cf3d_resizeFrame);
      cf3d_resizeFrame = requestAnimationFrame(cf3d_updateCarousel);
    },
    { passive: true },
  );
}

const cfVideoSection = document.querySelector(
  "#shopify-section-template--19781511708886__sachet_video_gjfm3w",
);
if (cfVideoSection && "IntersectionObserver" in window) {
  const cfVideoObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      initializeCfVideos();
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  cfVideoObserver.observe(cfVideoSection);
} else {
  initializeCfVideos();
}

// end

// Preserve campaign attribution from the landing page through checkout.
(function captureLandingAttribution() {
  const attributionKey = "valour_checkout_attribution";
  const params = new URLSearchParams(window.location.search);
  const hasUtmParameters = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ].some((key) => params.has(key));

  if (!hasUtmParameters) return;

  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(attributionKey) || "{}");
  } catch (_error) {
    stored = {};
  }

  const attribution = {
    ...stored,
    source: params.get("utm_source") || stored.source || "",
    medium: params.get("utm_medium") || stored.medium || "",
    campaign: params.get("utm_campaign") || stored.campaign || "",
    content: params.get("utm_content") || stored.content || "",
    term: params.get("utm_term") || stored.term || "",
    landingPage: `${window.location.pathname}${window.location.search}`,
    capturedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(attributionKey, JSON.stringify(attribution));
})();

function initProductGalleries() {
  document.querySelectorAll(".product_slide .left").forEach((gallery) => {
    const thumbnails = Array.from(gallery.querySelectorAll(".thumbnails img"));
    const thumbnailStrip = gallery.querySelector(".thumbnails");
    const mainImage = gallery.querySelector(".main-image");
    const originalImage = mainImage ? mainImage.querySelector("img") : null;

    if (!thumbnails.length || !mainImage || !originalImage) return;

    const thumbnailWrap = document.createElement("div");
    thumbnailWrap.className = "thumbnail-strip-wrap";
    thumbnailStrip.before(thumbnailWrap);
    thumbnailWrap.appendChild(thumbnailStrip);

    const moreIndicator = document.createElement("button");
    moreIndicator.className = "thumbnail-more-indicator";
    moreIndicator.type = "button";
    moreIndicator.setAttribute("aria-label", "Show more product images");
    moreIndicator.innerHTML = "&#8250;";
    thumbnailWrap.appendChild(moreIndicator);

    const previousIndicator = document.createElement("button");
    previousIndicator.className =
      "thumbnail-more-indicator thumbnail-more-indicator--previous";
    previousIndicator.type = "button";
    previousIndicator.setAttribute(
      "aria-label",
      "Show previous product images",
    );
    previousIndicator.innerHTML = "&#8249;";
    thumbnailWrap.prepend(previousIndicator);

    function updateThumbnailIndicator() {
      const hasPrevious = thumbnailStrip.scrollLeft > 2;
      const hasMore =
        thumbnailStrip.scrollLeft + thumbnailStrip.clientWidth <
        thumbnailStrip.scrollWidth - 2;
      previousIndicator.hidden = !hasPrevious;
      moreIndicator.hidden = !hasMore;
    }

    previousIndicator.addEventListener("click", () => {
      thumbnailStrip.scrollBy({
        left: -thumbnailStrip.clientWidth * 0.75,
        behavior: "smooth",
      });
    });
    moreIndicator.addEventListener("click", () => {
      thumbnailStrip.scrollBy({
        left: thumbnailStrip.clientWidth * 0.75,
        behavior: "smooth",
      });
    });
    thumbnailStrip.addEventListener("scroll", updateThumbnailIndicator, {
      passive: true,
    });
    window.addEventListener("resize", updateThumbnailIndicator, {
      passive: true,
    });
    requestAnimationFrame(updateThumbnailIndicator);

    let activeIndex = Math.max(
      0,
      thumbnails.findIndex((thumb) => thumb.classList.contains("active")),
    );
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const track = document.createElement("div");
    track.className = "main-image-track";

    thumbnails.forEach((thumb, index) => {
      const panel = document.createElement("div");
      panel.className = "main-image-panel";

      const image =
        index === activeIndex ? originalImage : originalImage.cloneNode(true);
      const thumbnailSource = thumb.getAttribute("src") || thumb.src;
      const responsiveMatch = thumbnailSource.match(
        /^(.*)-(?:320|640|960)\.webp$/,
      );
      if (responsiveMatch) {
        const responsiveBase = responsiveMatch[1];
        image.src = `${responsiveBase}-640.webp`;
        image.srcset = `${responsiveBase}-320.webp 320w, ${responsiveBase}-640.webp 640w, ${responsiveBase}-960.webp 960w`;
        image.sizes = "(max-width: 900px) calc(100vw - 40px), 42vw";
      } else {
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.src = thumbnailSource;
      }
      image.alt = thumb.alt || originalImage.alt || "product";

      panel.appendChild(image);
      track.appendChild(panel);
    });

    mainImage.replaceChildren(track);

    function updateGallery(index, animate = true) {
      activeIndex = (index + thumbnails.length) % thumbnails.length;
      thumbnails.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle("active", thumbIndex === activeIndex);
      });

      const activeThumbnail = thumbnails[activeIndex];
      if (
        thumbnailStrip &&
        activeThumbnail &&
        thumbnailStrip.scrollWidth > thumbnailStrip.clientWidth
      ) {
        const stripRect = thumbnailStrip.getBoundingClientRect();
        const thumbnailRect = activeThumbnail.getBoundingClientRect();
        const thumbnailLeft =
          thumbnailRect.left - stripRect.left + thumbnailStrip.scrollLeft;
        const thumbnailRight = thumbnailLeft + activeThumbnail.offsetWidth;
        const visibleLeft = thumbnailStrip.scrollLeft;
        const visibleRight = visibleLeft + thumbnailStrip.clientWidth;

        if (thumbnailLeft < visibleLeft) {
          thumbnailStrip.scrollTo({
            left: thumbnailLeft,
            behavior: animate ? "smooth" : "auto",
          });
        } else if (thumbnailRight > visibleRight) {
          thumbnailStrip.scrollTo({
            left: thumbnailRight - thumbnailStrip.clientWidth,
            behavior: animate ? "smooth" : "auto",
          });
        }
      }

      track.classList.toggle("is-dragging", !animate);
      track.style.transform = `translateX(-${activeIndex * 100}%)`;
    }

    function dragTo(deltaX) {
      const slideWidth = mainImage.offsetWidth || 1;
      const baseOffset = -activeIndex * slideWidth;
      track.style.transform = `translateX(${baseOffset + deltaX}px)`;
    }

    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener("click", () => updateGallery(index));
    });

    mainImage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      isDragging = true;
      startX = event.clientX;
      currentX = startX;
      track.classList.add("is-dragging");
      mainImage.setPointerCapture(event.pointerId);
    });

    mainImage.addEventListener("pointermove", (event) => {
      if (!isDragging) return;

      currentX = event.clientX;
      dragTo(currentX - startX);
    });

    function finishDrag(event) {
      if (!isDragging) return;

      const deltaX = currentX - startX;
      const threshold = Math.min(90, (mainImage.offsetWidth || 300) * 0.22);

      isDragging = false;
      track.classList.remove("is-dragging");

      if (Math.abs(deltaX) > threshold) {
        updateGallery(activeIndex + (deltaX < 0 ? 1 : -1));
      } else {
        updateGallery(activeIndex);
      }

      if (mainImage.hasPointerCapture(event.pointerId)) {
        mainImage.releasePointerCapture(event.pointerId);
      }
    }

    mainImage.addEventListener("pointerup", finishDrag);
    mainImage.addEventListener("pointercancel", finishDrag);
    mainImage.addEventListener("lostpointercapture", () => {
      if (isDragging) {
        isDragging = false;
        track.classList.remove("is-dragging");
        updateGallery(activeIndex);
      }
    });

    updateGallery(activeIndex, false);
  });
}

const productGallerySection = document.querySelector(".container_slider");
if (productGallerySection) {
  const productGalleryObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      initProductGalleries();
    },
    { rootMargin: "600px 0px", threshold: 0 },
  );
  productGalleryObserver.observe(productGallerySection);
}

let homepageTestimonialsRequest = null;
function getHomepageTestimonialsRequest() {
  if (!homepageTestimonialsRequest) {
    homepageTestimonialsRequest = fetch("/api/homepage-testimonials", {
      headers: { Accept: "application/json" },
    }).then(async (response) => ({
      ok: response.ok,
      payload: await response.json(),
    }));
  }
  return homepageTestimonialsRequest;
}

const responsiveHomepageMedia = new Map([
  [
    "/vendor/cdn/cdn/shop/files/test4_x.png",
    "/vendor/cdn/cdn/shop/files/test4_x",
  ],
  [
    "/vendor/cdn/cdn/shop/files/testi_2.jpg",
    "/vendor/cdn/cdn/shop/files/testi_2",
  ],
  [
    "/vendor/cdn/cdn/shop/files/testi_4.jpeg",
    "/vendor/cdn/cdn/shop/files/testi_4",
  ],
  [
    "/vendor/cdn/cdn/shop/files/testi_5.jpeg",
    "/vendor/cdn/cdn/shop/files/testi_5",
  ],
]);

function setHomepageMediaSource(image, source, sizes) {
  let pathname = "";
  try {
    pathname = new URL(source, location.origin).pathname;
  } catch {
    /* Keep the supplied source. */
  }
  const responsiveBase = responsiveHomepageMedia.get(pathname);
  if (!responsiveBase) {
    image.src = source;
    return;
  }
  image.src = `${responsiveBase}-640.webp`;
  image.srcset = `${responsiveBase}-320.webp 320w, ${responsiveBase}-640.webp 640w, ${responsiveBase}-960.webp 960w`;
  image.sizes = sizes;
}

async function initHomepageTestimonials() {
  const section = document.querySelector("[data-valour-testimonials]");
  if (!section) return;

  try {
    const { ok, payload } = await getHomepageTestimonialsRequest();
    if (
      ok &&
      payload.ok &&
      Array.isArray(payload.items) &&
      payload.items.length
    ) {
      const databaseTrack = section.querySelector("[data-testimonial-track]");
      const validUrl = (value) =>
        typeof value === "string" && /^(\/|https:\/\/)/.test(value);
      const testimonialCards = payload.items
        .map((item, itemIndex) => {
          const images = Array.isArray(item.images)
            ? item.images.filter((image) => validUrl(image?.url)).slice(0, 3)
            : [];
          if (
            !images.length ||
            typeof item.quote !== "string" ||
            typeof item.personName !== "string"
          )
            return null;

          const card = document.createElement("article");
          card.className = "valour-testimonial";
          card.dataset.testimonialSlide = "";
          card.setAttribute("role", "group");
          card.setAttribute("aria-roledescription", "slide");
          card.setAttribute(
            "aria-label",
            `${itemIndex + 1} of ${payload.items.length}`,
          );

          const media = document.createElement("div");
          media.className = "valour-testimonial__media";
          media.dataset.imageCount = String(images.length);
          images.forEach((imageData) => {
            const image = document.createElement("img");
            setHomepageMediaSource(
              image,
              imageData.url,
              "(max-width: 720px) calc(100vw - 64px), 38vw",
            );
            image.alt =
              typeof imageData.alt === "string" && imageData.alt.trim()
                ? imageData.alt.trim()
                : "A VALOUR meal prepared at home";
            image.loading = "lazy";
            image.decoding = "async";
            if (
              typeof imageData.objectPosition === "string" &&
              /^\d{1,3}%\s+\d{1,3}%$/.test(imageData.objectPosition)
            )
              image.style.objectPosition = imageData.objectPosition;
            media.appendChild(image);
          });

          const copy = document.createElement("div");
          copy.className = "valour-testimonial__copy";
          const stars = document.createElement("p");
          stars.className = "valour-testimonial__stars";
          stars.setAttribute("aria-label", "5 out of 5 stars");
          stars.textContent = "★★★★★";
          const quote = document.createElement("blockquote");
          quote.className = "valour-testimonial__quote";
          quote.textContent = `“${item.quote.trim()}”`;
          const person = document.createElement("p");
          person.className = "valour-testimonial__person";
          const name = document.createElement("strong");
          name.className = "valour-testimonial__name";
          name.textContent = item.personName.trim();
          const detail = document.createElement("span");
          detail.className = "valour-testimonial__detail";
          detail.textContent =
            typeof item.personDetail === "string"
              ? item.personDetail.trim()
              : "Verified customer";
          person.append(name, detail);
          copy.append(stars, quote, person);
          card.append(media, copy);
          return card;
        })
        .filter(Boolean);

      if (databaseTrack && testimonialCards.length) {
        databaseTrack.replaceChildren(...testimonialCards);
      }
    }
  } catch (error) {
    console.warn("Using fallback testimonials", error);
  }

  const viewport = section.querySelector("[data-testimonial-viewport]");
  const track = section.querySelector("[data-testimonial-track]");
  const slides = Array.from(
    section.querySelectorAll("[data-testimonial-slide]"),
  );
  const dots = Array.from(section.querySelectorAll("[data-testimonial-dot]"));
  const previousButton = section.querySelector("[data-testimonial-prev]");
  const nextButton = section.querySelector("[data-testimonial-next]");
  const status = section.querySelector("[data-testimonial-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pauseReasons = new Set();
  let activeIndex = 0;
  let autoRotateTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let navigationLocked = false;
  let resizeFrame = null;

  const getVisibleCount = () =>
    Math.max(
      1,
      Math.floor(
        parseFloat(
          getComputedStyle(track).getPropertyValue("--photos-visible"),
        ) || 1,
      ),
    );
  const getMaxIndex = () => Math.max(0, slides.length - getVisibleCount());

  const update = (nextIndex, announce = true) => {
    const maxIndex = getMaxIndex();
    activeIndex =
      nextIndex > maxIndex ? 0 : nextIndex < 0 ? maxIndex : nextIndex;
    const firstSlideOffset = slides[0]?.offsetLeft || 0;
    const activeSlideOffset =
      slides[activeIndex]?.offsetLeft || firstSlideOffset;
    track.style.transform = `translate3d(-${activeSlideOffset - firstSlideOffset}px, 0, 0)`;
    const visibleCount = getVisibleCount();
    slides.forEach((slide, slideIndex) => {
      const isVisible =
        slideIndex >= activeIndex && slideIndex < activeIndex + visibleCount;
      slide.setAttribute("aria-hidden", isVisible ? "false" : "true");
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) =>
      dot.setAttribute(
        "aria-current",
        dotIndex === activeIndex ? "true" : "false",
      ),
    );
    const firstVisible = activeIndex + 1;
    const lastVisible = Math.min(activeIndex + visibleCount, slides.length);
    status.textContent =
      visibleCount === 1
        ? `Testimonial ${firstVisible} of ${slides.length}`
        : `Testimonials ${firstVisible}–${lastVisible} of ${slides.length}`;
  };

  const stopAutoRotate = () => {
    window.clearInterval(autoRotateTimer);
    autoRotateTimer = null;
  };

  const startAutoRotate = () => {
    stopAutoRotate();
    if (reducedMotion.matches || pauseReasons.size) return;
    autoRotateTimer = window.setInterval(
      () => update(activeIndex + 1, false),
      6500,
    );
  };

  const pause = (reason) => {
    pauseReasons.add(reason);
    stopAutoRotate();
  };

  const resume = (reason) => {
    pauseReasons.delete(reason);
    startAutoRotate();
  };

  const selectManually = (nextIndex) => {
    if (navigationLocked) return;
    navigationLocked = true;
    update(nextIndex);
    pause("manual");
    window.setTimeout(
      () => {
        navigationLocked = false;
      },
      reducedMotion.matches ? 0 : 640,
    );
    window.setTimeout(() => resume("manual"), 8000);
  };

  previousButton.addEventListener("click", () =>
    selectManually(activeIndex - 1),
  );
  nextButton.addEventListener("click", () => selectManually(activeIndex + 1));
  dots.forEach((dot) =>
    dot.addEventListener("click", () =>
      selectManually(Number(dot.dataset.testimonialDot)),
    ),
  );

  section.addEventListener("mouseenter", () => pause("hover"));
  section.addEventListener("mouseleave", () => resume("hover"));
  section.addEventListener("focusin", () => pause("focus"));
  section.addEventListener("focusout", (event) => {
    if (!section.contains(event.relatedTarget)) resume("focus");
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    selectManually(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  viewport.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      pause("touch");
    },
    { passive: true },
  );

  viewport.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      if (touch) {
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (
          Math.abs(deltaX) > 48 &&
          Math.abs(deltaX) > Math.abs(deltaY) * 1.2
        ) {
          selectManually(activeIndex + (deltaX < 0 ? 1 : -1));
        }
      }
      resume("touch");
    },
    { passive: true },
  );

  viewport.addEventListener("touchcancel", () => resume("touch"), {
    passive: true,
  });
  window.addEventListener(
    "resize",
    () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() =>
        update(Math.min(activeIndex, getMaxIndex()), false),
      );
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () =>
    document.hidden ? pause("hidden") : resume("hidden"),
  );
  reducedMotion.addEventListener?.("change", startAutoRotate);
  section
    .querySelectorAll(".valour-testimonial__media img")
    .forEach((image) => {
      if (!image.complete)
        image.addEventListener("load", () => update(activeIndex, false), {
          once: true,
        });
    });
  update(0, false);
  startAutoRotate();
}

const homepageTestimonialsSection = document.querySelector(
  "[data-valour-testimonials]",
);
if (homepageTestimonialsSection && "IntersectionObserver" in window) {
  const homepageTestimonialsObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      initHomepageTestimonials();
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  homepageTestimonialsObserver.observe(homepageTestimonialsSection);
} else if (homepageTestimonialsSection) {
  initHomepageTestimonials();
}

function toggleAccordion(element) {
  const accordion = element.closest(".accordion");
  const content = accordion?.querySelector(".accordion-content");

  accordion.classList.toggle("active");
  element.setAttribute(
    "aria-expanded",
    accordion.classList.contains("active") ? "true" : "false",
  );
  if (content) {
    content.style.maxHeight = accordion.classList.contains("active")
      ? `${content.scrollHeight}px`
      : "0px";
  }
}

function appendAccordionParagraph(container, text) {
  if (typeof text !== "string" || !text.trim()) return;
  const paragraph = document.createElement("p");
  paragraph.textContent = text.trim();
  container.appendChild(paragraph);
}

function renderAccordionContent(container, item) {
  container.replaceChildren();
  const content = item.content || {};

  if (item.contentType === "paragraph") {
    appendAccordionParagraph(container, content.text);
  } else if (item.contentType === "paragraphs") {
    (Array.isArray(content.paragraphs) ? content.paragraphs : []).forEach(
      (text) => appendAccordionParagraph(container, text),
    );
  } else if (item.contentType === "serving-guide") {
    appendAccordionParagraph(container, content.intro);
    const servings = Array.isArray(content.servings) ? content.servings : [];
    if (servings.length) {
      const list = document.createElement("ul");
      servings.forEach((serving) => {
        const listItem = document.createElement("li");
        const size =
          typeof serving?.size === "string" ? serving.size.trim() : "";
        const detail =
          typeof serving?.detail === "string" ? serving.detail.trim() : "";
        listItem.textContent = [size, detail].filter(Boolean).join(" — ");
        if (listItem.textContent) list.appendChild(listItem);
      });
      container.appendChild(list);
    }
  } else {
    appendAccordionParagraph(container, content.text || "Content unavailable.");
  }
}

async function loadAccordionContent() {
  const accordions = [
    ...document.querySelectorAll(".accordion[data-accordion-key]"),
  ];
  if (!accordions.length) return;

  try {
    const response = await fetch("/api/accordion-content", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const itemsByKey = new Map(
      (payload.items || []).map((item) => [item.key, item]),
    );

    accordions.forEach((accordion) => {
      const item = itemsByKey.get(accordion.dataset.accordionKey);
      const container = accordion.querySelector(".accordion-content");
      if (!item || !container) return;
      const title = accordion.querySelector(".header_name");
      if (title && item.title) title.textContent = item.title;
      renderAccordionContent(container, item);
    });
  } catch (error) {
    console.error("Accordion content could not be loaded", error);
    accordions.forEach((accordion) => {
      const container = accordion.querySelector(".accordion-content");
      if (container) {
        container.replaceChildren();
        appendAccordionParagraph(
          container,
          "Content is temporarily unavailable.",
        );
      }
    });
  }
}

const firstAccordion = document.querySelector(".accordion[data-accordion-key]");
if (firstAccordion) {
  const accordionObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadAccordionContent();
    },
    { rootMargin: "500px 0px", threshold: 0 },
  );
  accordionObserver.observe(firstAccordion);
}

// slidier beign
let currentSlide = 0;
const slides = document.querySelectorAll(".product_slide");
const slider = document.querySelector(".slider");
const dots = slider.querySelectorAll(".slider-nav .dot");
const productTabs = document.querySelectorAll(".container_slider .product-tab");
const sliderInteractionArea = document.querySelector(".container_slider");

let autoSlideTimer = null;
let sliderIsBeingPressed = false;
let sliderIsInView = false;
const intervalTime = 4000;

/* CHANGE SLIDE (CORE FUNCTION) */
function changeSlide(index) {
  if (!slides.length || index < 0 || index >= slides.length) return;

  slides[currentSlide].classList.remove("active");
  dots[currentSlide]?.classList.remove("active");
  productTabs[currentSlide]?.classList.remove("active");
  productTabs[currentSlide]?.setAttribute("aria-selected", "false");

  currentSlide = index;

  slides[currentSlide].classList.add("active");
  dots[currentSlide]?.classList.add("active");
  productTabs[currentSlide]?.classList.add("active");
  productTabs[currentSlide]?.setAttribute("aria-selected", "true");
}

/* MANUAL CLICK */
function goToSlide(index) {
  changeSlide(index);
  startAutoSlide();
}

/* AUTO SLIDE */
function startAutoSlide() {
  stopAutoSlide(); // ensure no duplicate

  if (sliderInteractionArea?.dataset.autoplay === "false") return;

  if (
    sliderIsBeingPressed ||
    !sliderIsInView ||
    document.hidden ||
    slides.length < 2
  )
    return;

  autoSlideTimer = setTimeout(() => {
    const next = (currentSlide + 1) % slides.length;
    changeSlide(next);
    startAutoSlide();
  }, intervalTime);
}

/* STOP */
function stopAutoSlide() {
  if (autoSlideTimer) {
    clearTimeout(autoSlideTimer);
    autoSlideTimer = null;
  }
}

function pauseAutoSlide() {
  sliderIsBeingPressed = true;
  stopAutoSlide();
}

function resumeAutoSlide() {
  if (!sliderIsBeingPressed) return;
  sliderIsBeingPressed = false;
  // Start a completely fresh countdown after the user releases.
  startAutoSlide();
}

/* Run automatic transitions only while the product slider is visible. */
if (sliderInteractionArea) {
  const sliderVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      sliderIsInView = entry.isIntersecting;

      if (sliderIsInView) {
        startAutoSlide();
      } else {
        stopAutoSlide();
      }
    },
    {
      threshold: 0.2,
    },
  );

  sliderVisibilityObserver.observe(sliderInteractionArea);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoSlide();
  } else if (sliderIsInView) {
    startAutoSlide();
  }
});

/* Pause while the user is pressing the slider, then resume on release. */
sliderInteractionArea?.addEventListener("pointerdown", pauseAutoSlide, {
  passive: true,
});
window.addEventListener("pointerup", resumeAutoSlide, { passive: true });
window.addEventListener("pointercancel", resumeAutoSlide, { passive: true });

/* Swipe between products on touch devices without hijacking inner controls. */
if (slider) {
  let productSwipeStartX = 0;
  let productSwipeStartY = 0;
  let productSwipeEnabled = false;
  const swipeExclusions =
    ".main-image, .thumbnails, a, button, input, select, textarea";

  slider.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      productSwipeEnabled =
        window.matchMedia("(max-width: 900px)").matches &&
        !event.target.closest(swipeExclusions);

      if (!productSwipeEnabled || !touch) return;
      productSwipeStartX = touch.clientX;
      productSwipeStartY = touch.clientY;
      pauseAutoSlide();
    },
    { passive: true },
  );

  slider.addEventListener(
    "touchend",
    (event) => {
      if (!productSwipeEnabled) return;
      productSwipeEnabled = false;

      const touch = event.changedTouches[0];
      if (!touch) {
        resumeAutoSlide();
        return;
      }

      const deltaX = touch.clientX - productSwipeStartX;
      const deltaY = touch.clientY - productSwipeStartY;

      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        const nextSlide =
          deltaX < 0
            ? (currentSlide + 1) % slides.length
            : (currentSlide - 1 + slides.length) % slides.length;
        changeSlide(nextSlide);
      }

      resumeAutoSlide();
    },
    { passive: true },
  );

  slider.addEventListener(
    "touchcancel",
    () => {
      productSwipeEnabled = false;
      resumeAutoSlide();
    },
    { passive: true },
  );
}

// slidier end

// Keep only the story inside the hero. Customer stories and products follow it.
const productSliderSection = document.querySelector(".container_slider");
const valourHero = document.querySelector(".valour-hero");
const valourHeroInner = document.querySelector(".valour-hero__inner");
const valourStackStory = document.querySelector(".valour-stack-story");
const customerStories = document.querySelector("#customer-stories");

if (valourStackStory && valourHeroInner) {
  valourHeroInner.appendChild(valourStackStory);
}

if (valourHero && customerStories) {
  valourHero.insertAdjacentElement("afterend", customerStories);
  if (productSliderSection) {
    customerStories.insertAdjacentElement("afterend", productSliderSection);
  }
}

// Meta Pixel: count a product view when the Velvety Butter Chicken slide
// is actually visible, rather than as soon as the homepage loads.
const velvetyButterChickenSlide = document.querySelector(
  ".container_slider #velvety-butter-chicken",
);

const homepageOfferCode = "VALOUR75";
const authoritativeProductRequests = new Map();

const loadAuthoritativeProduct = async (productSku, quantity = 1) => {
  const requestKey = `${productSku}:${quantity}`;
  if (authoritativeProductRequests.has(requestKey)) {
    return authoritativeProductRequests.get(requestKey);
  }

  const request = (async () => {
    const response = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ sku: productSku, quantity }],
        couponCode: homepageOfferCode,
      }),
    });
    const result = await response.json();
    const product = result?.quote?.items?.find(
      (item) => item.sku === productSku,
    );
    const compareAt =
      Number(product?.compareAtPaise ?? product?.unitPricePaise) / 100;
    const discountedSubtotal =
      (Number(result?.quote?.subtotalPaise) -
        Number(result?.quote?.discountPaise)) /
      100;
    const value = discountedSubtotal / quantity;

    if (
      !response.ok ||
      result.ok === false ||
      !Number.isFinite(value) ||
      !Number.isFinite(compareAt)
    ) {
      throw new Error(result.error || "Database product price is unavailable");
    }

    return {
      name: product.name || "Velvety Butter Chicken",
      value,
      compareAt,
      savings: Math.max(compareAt - value, 0),
      lineValue: discountedSubtotal,
      currency: result.quote.currency || "INR",
      couponCode: result.quote.couponCode,
    };
  })();

  authoritativeProductRequests.set(requestKey, request);
  return request;
};

const formatHomepagePrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

async function syncHomepageProductPricing() {
  if (!velvetyButterChickenSlide) return;

  const offer = velvetyButterChickenSlide.querySelector(".product-offer");
  const price = offer?.querySelector(".price");
  const offerCode = offer?.querySelector(".product-offer__code");
  const originalPrice = offer?.querySelector(".product-offer__original-price");
  const saving = offer?.querySelector(".product-offer__saving");
  const productButtons = velvetyButterChickenSlide.querySelectorAll(
    "[data-product-id='velvety-butter-chicken']",
  );

  try {
    const product = await loadAuthoritativeProduct("velvety-butter-chicken");
    const hasDiscount = product.savings > 0 && Boolean(product.couponCode);

    if (price) price.textContent = formatHomepagePrice(product.value);
    if (originalPrice) {
      originalPrice.textContent = hasDiscount
        ? formatHomepagePrice(product.compareAt)
        : "";
    }
    if (saving) {
      saving.textContent = hasDiscount
        ? `You save ${formatHomepagePrice(product.savings)}`
        : "";
    }
    if (offerCode) {
      offerCode.hidden = !hasDiscount;
      const code = offerCode.querySelector("strong");
      if (code && product.couponCode) code.textContent = product.couponCode;
    }
    if (offer) {
      offer.setAttribute(
        "aria-label",
        hasDiscount
          ? `Pay ${product.value} rupees with code ${product.couponCode}. Original price ${product.compareAt} rupees. You save ${product.savings} rupees.`
          : `Current price ${product.value} rupees.`,
      );
    }

    productButtons.forEach((button) => {
      button.dataset.productPrice = String(product.value);
      button.dataset.productCompareAt = String(product.compareAt);
      button.disabled = false;
    });

    const productSchema = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (productSchema) {
      const schema = JSON.parse(productSchema.textContent);
      const productNode = schema["@graph"]?.find(
        (node) => node["@type"] === "Product",
      );
      if (productNode?.offers)
        productNode.offers.price = product.value.toFixed(2);
      productSchema.textContent = JSON.stringify(schema);
    }
  } catch (error) {
    if (price) price.textContent = "Price unavailable";
    if (offerCode) offerCode.hidden = true;
    if (offer)
      offer.setAttribute("aria-label", "Current product price is unavailable");
    console.error("Unable to load homepage product pricing", error);
  }
}

if (velvetyButterChickenSlide && "IntersectionObserver" in window) {
  const homepagePricingObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      syncHomepageProductPricing();
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  homepagePricingObserver.observe(velvetyButterChickenSlide);
} else if (velvetyButterChickenSlide) {
  syncHomepageProductPricing();
}

if (velvetyButterChickenSlide && "IntersectionObserver" in window) {
  const productSku = "velvety-butter-chicken";

  const viewContentObserver = new IntersectionObserver(
    async (entries, observer) => {
      const productIsVisible = entries.some(
        (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
      );

      if (!productIsVisible || typeof window.fbq !== "function") return;
      observer.disconnect();

      try {
        const product = await loadAuthoritativeProduct(productSku);
        window.valourMeta.track("track", "ViewContent", {
          content_ids: [productSku],
          content_name: product.name,
          content_type: "product",
          contents: [
            { id: productSku, quantity: 1, item_price: product.value },
          ],
          value: product.value,
          currency: product.currency,
        });
      } catch (error) {
        console.warn(
          "Unable to send Meta ViewContent with database pricing",
          error,
        );
      }
    },
    { threshold: 0.5 },
  );

  viewContentObserver.observe(velvetyButterChickenSlide);
}

// Place the sachet video carousel directly before the looks-and-tastes section.
const looksTastesSection = document.querySelector(".looks-tastes-section");
const sachetVideoSection = document.querySelector(
  "#shopify-section-template--19781511708886__sachet_video_gjfm3w",
);

if (looksTastesSection && sachetVideoSection) {
  looksTastesSection.insertAdjacentElement("beforebegin", sachetVideoSection);
}

// Meta Pixel: record meaningful section views once per page load.
function observeMetaSectionEntry(element, eventName, parameters) {
  if (!element || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
      if (typeof window.fbq !== "function") return;

      window.valourMeta?.track("trackCustom", eventName, parameters);
      observer.disconnect();
    },
    { threshold: 0.35 },
  );

  observer.observe(element);
}

observeMetaSectionEntry(productSliderSection, "ProductSliderView", {
  section_id: "container_slider",
  section_name: "Product slider",
  content_name: "Velvety Butter Chicken",
});

observeMetaSectionEntry(looksTastesSection, "LooksTastesSectionView", {
  section_id: "looks-tastes-section",
  section_name: "Looks and tastes",
  content_name: "Velvety Butter Chicken recipe",
});

const looksTastesVideo = looksTastesSection?.querySelector("video");

if (looksTastesSection && looksTastesVideo) {
  let looksTastesVideoIsVisible = false;
  let looksTastesSoundWasRequested = false;

  const controlLooksTastesVideo = (command) => {
    if (command === "playVideo") {
      looksTastesVideo.play().catch(() => {
        // Autoplay may be blocked until the visitor interacts with the page.
      });
    } else if (command === "pauseVideo") {
      looksTastesVideo.pause();
    }
  };

  const playLooksTastesVideoWithSound = () => {
    looksTastesSoundWasRequested = true;
    looksTastesVideo.muted = false;
    looksTastesVideo.volume = 1;
    controlLooksTastesVideo("playVideo");
  };

  const restartLooksTastesVideoWithSound = () => {
    looksTastesVideo.currentTime = 0;
    playLooksTastesVideoWithSound();
  };

  document.querySelectorAll(".product-video-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      playLooksTastesVideoWithSound();

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const videoTarget = document.getElementById("detailed-recipe-video");
      videoTarget?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });

      if (window.location.hash !== "#detailed-recipe-video") {
        window.history.pushState(null, "", "#detailed-recipe-video");
      }
    });
  });

  const looksTastesVideoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        looksTastesVideoIsVisible = entry.isIntersecting;
        controlLooksTastesVideo(
          looksTastesVideoIsVisible ? "playVideo" : "pauseVideo",
        );
      });
    },
    {
      threshold: 0.45,
    },
  );

  looksTastesVideo.addEventListener("loadedmetadata", () => {
    if (looksTastesSoundWasRequested) {
      playLooksTastesVideoWithSound();
    } else {
      controlLooksTastesVideo(
        looksTastesVideoIsVisible ? "playVideo" : "pauseVideo",
      );
    }
  });

  looksTastesVideoObserver.observe(looksTastesSection);
}

let animationLibrariesPromise = null;

function loadAnimationLibraries() {
  if (window.gsap && window.ScrollTrigger) return Promise.resolve();
  if (animationLibrariesPromise) return animationLibrariesPromise;

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });

  animationLibrariesPromise = loadScript(
    "assets/js/gsap-3.12.5.min.js?v=20260915",
  )
    .then(() => loadScript("assets/js/scroll-trigger-3.12.5.min.js?v=20260915"))
    .then(() => gsap.registerPlugin(ScrollTrigger));
  return animationLibrariesPromise;
}

function initProductStoryAnimations() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const looksHeading = document.querySelector(".looks-tastes-heading");
  const looksVideo = document.querySelector(".looks-tastes-video");
  const rawReadySection = document.querySelector(".raw-ready-section");
  const baseMessageSection = document.querySelector(".base-message-section");
  const processHeading = document.querySelector(".valour-banner__title_sec2");

  if (reduceMotion) {
    const animatedElements = [
      looksHeading,
      looksVideo,
      rawReadySection,
      baseMessageSection,
      processHeading,
      ...document.querySelectorAll(
        ".raw-ready-heading, .raw-ready-item, .base-message-kicker, .base-message-heading",
      ),
    ].filter(Boolean);

    gsap.set(animatedElements, {
      clearProps: "all",
    });
    return;
  }

  if (looksHeading) {
    gsap.fromTo(
      looksHeading,
      { autoAlpha: 0, y: 32 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: {
          trigger: looksHeading,
          start: "top 94%",
          toggleActions: "play none none none",
          once: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  if (looksVideo) {
    gsap.fromTo(
      looksVideo,
      { autoAlpha: 0, y: 38, scale: 0.975 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.78,
        ease: "power3.out",
        scrollTrigger: {
          trigger: looksVideo,
          start: "top 96%",
          toggleActions: "play none none none",
          once: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  if (rawReadySection) {
    const rawReadyParts = rawReadySection.querySelectorAll(
      ".raw-ready-heading, .raw-ready-item",
    );

    gsap.fromTo(
      rawReadySection,
      {
        autoAlpha: 0,
        y: 56,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rawReadySection,
          start: "top 82%",
          toggleActions: "play reverse play reverse",
        },
      },
    );

    gsap.fromTo(
      rawReadyParts,
      {
        autoAlpha: 0,
        y: 34,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: {
          trigger: rawReadySection,
          start: "top 76%",
          toggleActions: "play reverse play reverse",
        },
      },
    );
  }

  if (baseMessageSection) {
    const baseMessageParts = baseMessageSection.querySelectorAll(
      ".base-message-kicker, .base-message-heading",
    );

    gsap.fromTo(
      baseMessageSection,
      { autoAlpha: 0, y: 36, scale: 0.992 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.76,
        ease: "power3.out",
        scrollTrigger: {
          trigger: baseMessageSection,
          start: "top 94%",
          toggleActions: "play none none none",
          once: true,
          invalidateOnRefresh: true,
        },
      },
    );

    gsap.fromTo(
      baseMessageParts,
      { autoAlpha: 0, y: 24, filter: "blur(5px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: baseMessageSection,
          start: "top 90%",
          toggleActions: "play none none none",
          once: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  if (processHeading) {
    gsap.fromTo(
      processHeading,
      {
        autoAlpha: 0,
        y: 48,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: processHeading,
          start: "top 82%",
          toggleActions: "play reverse play reverse",
        },
      },
    );
  }
}

const productStoryAnimationTarget = document.querySelector(
  ".looks-tastes-section",
);
if (productStoryAnimationTarget) {
  const productStoryObserver = new IntersectionObserver(
    async (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      try {
        await loadAnimationLibraries();
        initProductStoryAnimations();
        ScrollTrigger.refresh();
      } catch (error) {
        console.error("Unable to initialize product animations", error);
      }
    },
    { rootMargin: "600px 0px", threshold: 0 },
  );
  productStoryObserver.observe(productStoryAnimationTarget);
}

let ctx;
let spotlightInitialized = false;

function init() {
  const spotlight = document.querySelector("#spotlight");
  const mediaStage = document.querySelector("#mediaStage");

  const panels = gsap.utils.toArray(".panel");
  const cards = gsap.utils.toArray(".media-card");

  // 🚨 CRITICAL: sync counts
  const total = Math.min(panels.length, cards.length);
  if (!spotlight || !mediaStage || !total) return;
  spotlightInitialized = true;

  ctx = gsap.context(() => {
    // Reset this section without touching other page scroll animations.
    gsap.killTweensOf(cards);
    cards.forEach((card) => {
      card.removeAttribute("style");
    });

    // INITIAL STATE
    gsap.set(cards, {
      autoAlpha: 0,
      y: 40,
      scale: 0.96,
    });

    gsap.set(cards[0], {
      autoAlpha: 1,
      y: 0,
      scale: 1,
    });

    // COLOR SYNC
    function applyColors(i) {
      const panel = panels[i];
      if (!panel) return;

      spotlight.style.backgroundColor = panel.dataset.bg;
      mediaStage.style.backgroundColor = panel.dataset.mediaBg;
    }

    applyColors(0);

    // 🔥 ONE TRIGGER PER PANEL (no timeline, no confusion)
    for (let i = 0; i < total; i++) {
      ScrollTrigger.create({
        trigger: panels[i],
        start: "top center",
        end: "bottom center",

        onEnter: () => switchTo(i),
        onEnterBack: () => switchTo(i),
      });
    }

    let active = 0;

    function switchTo(i) {
      if (i === active) return;

      const prev = cards[active];
      const next = cards[i];

      active = i;

      applyColors(i);

      gsap.to(prev, {
        autoAlpha: 0,
        y: -40,
        duration: 0.35,
        overwrite: true,
      });

      gsap.fromTo(
        next,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          overwrite: true,
        },
      );
    }
  });
}

// CLEANUP
function destroy() {
  if (ctx) {
    ctx.revert();
    ctx = null;
  }
}

// Initialize this below-fold story only shortly before it is needed.
const spotlightSection = document.querySelector("#spotlight");
if (spotlightSection) {
  const spotlightObserver = new IntersectionObserver(
    async (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      try {
        await loadAnimationLibraries();
        destroy();
        init();
      } catch (error) {
        console.error("Unable to initialize spotlight animations", error);
      }
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  spotlightObserver.observe(spotlightSection);
}

// BFCACHE FIX
window.addEventListener("pageshow", (e) => {
  if (e.persisted && spotlightInitialized) {
    destroy();
    init();
  }
});

// OPTIONAL: resize safety
window.addEventListener("resize", () => {
  if (!spotlightInitialized) return;
  destroy();
  init();
});

function initValourComparisonSlider() {
  document.querySelectorAll("[data-comparison-slider]").forEach((slider) => {
    const range = slider.querySelector(".comparison-range");
    const divider = slider.querySelector(".comparison-divider");
    if (!range || !divider) return;

    const updateSplit = () => {
      slider.style.setProperty("--split", `${range.value}%`);
    };

    const setSplitFromPointer = (event) => {
      const rect = slider.getBoundingClientRect();
      const position = ((event.clientX - rect.left) / rect.width) * 100;
      range.value = Math.max(0, Math.min(100, position));
      updateSplit();
    };

    const stopDragging = (event) => {
      divider.releasePointerCapture?.(event.pointerId);
      divider.removeEventListener("pointermove", setSplitFromPointer);
      divider.removeEventListener("pointerup", stopDragging);
      divider.removeEventListener("pointercancel", stopDragging);
    };

    const startDragging = (event) => {
      event.preventDefault();
      divider.setPointerCapture?.(event.pointerId);
      setSplitFromPointer(event);
      divider.addEventListener("pointermove", setSplitFromPointer);
      divider.addEventListener("pointerup", stopDragging);
      divider.addEventListener("pointercancel", stopDragging);
    };

    divider.addEventListener("pointerdown", startDragging);
    range.addEventListener("input", updateSplit);
    updateSplit();
  });
}

const firstComparisonSlider = document.querySelector(
  "[data-comparison-slider]",
);
if (firstComparisonSlider) {
  const comparisonObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      initValourComparisonSlider();
    },
    { rootMargin: "500px 0px", threshold: 0 },
  );
  comparisonObserver.observe(firstComparisonSlider);
}

function initStickyNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  function handleNavbarScroll() {
    navbar.classList.toggle("is-sticky", window.scrollY > 280);
  }

  window.addEventListener("scroll", handleNavbarScroll, { passive: true });
  handleNavbarScroll();
}

window.addEventListener("load", initStickyNavbar);

function initValourCartActions() {
  const cartStorageKey = "valour_checkout_cart";
  const cartCount = document.querySelector("[data-cart-count]");
  const cartToast = document.querySelector("[data-cart-toast]");
  const cartToastMessage = document.querySelector("[data-cart-toast-message]");
  const buySheetBackdrop = document.querySelector("[data-buy-sheet-backdrop]");
  const buySheetTitle = document.querySelector("[data-buy-sheet-title]");
  const buySheetName = document.querySelector("[data-buy-sheet-name]");
  const buySheetDescription = document.querySelector(
    "[data-buy-sheet-description]",
  );
  const buySheetImage = document.querySelector("[data-buy-sheet-image]");
  const buySheetQty = document.querySelector("[data-buy-sheet-qty]");
  const buySheetTotal = document.querySelector("[data-buy-sheet-total]");
  let selectedBuyProduct = null;
  let selectedBuyQuantity = 1;
  let toastTimer;

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }

  function getCartQuantity(cart = readCart()) {
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function updateCartCount() {
    if (!cartCount) return;

    const quantity = getCartQuantity();
    cartCount.textContent = quantity > 99 ? "99+" : String(quantity);
    cartCount.classList.toggle("is-visible", quantity > 0);
  }

  function showAddedToCartToast(productName, quantity) {
    if (!cartToast || !cartToastMessage) return;

    cartToastMessage.textContent = `${productName} added. Cart quantity: ${quantity}.`;
    cartToast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      cartToast.classList.remove("is-visible");
    }, 2600);
  }

  function formatMoney(value) {
    return `₹${Math.round(value).toLocaleString("en-IN")}.00`;
  }

  function getProductFromButton(button) {
    const productSlide = button.closest(".product_slide");
    const productName =
      button.dataset.productName ||
      productSlide
        ?.querySelector(".title-price h1, .title-price h2")
        ?.textContent.trim() ||
      "Valour product";
    const productPrice = Number(
      button.dataset.productPrice ||
        productSlide
          ?.querySelector(".price")
          ?.textContent.replace(/[^\d.]/g, "") ||
        0,
    );

    return {
      id:
        button.dataset.productId ||
        productName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      name: productName,
      descriptor: button.dataset.productDescriptor || "",
      size: button.dataset.productSize || "",
      serves: button.dataset.productServes || "",
      price: productPrice,
      compareAt: Number(button.dataset.productCompareAt || productPrice),
      image:
        button.dataset.productImage ||
        productSlide?.querySelector(".main-image img")?.getAttribute("src") ||
        "",
      quantity: 1,
    };
  }

  async function trackMetaAddToCart(product, quantity) {
    if (typeof window.fbq !== "function") return;

    try {
      const pricedProduct = await loadAuthoritativeProduct(
        product.id,
        quantity,
      );
      window.valourMeta.track("track", "AddToCart", {
        content_ids: [product.id],
        content_name: pricedProduct.name,
        content_type: "product",
        contents: [
          {
            id: product.id,
            quantity,
            item_price: pricedProduct.lineValue / quantity,
          },
        ],
        value: pricedProduct.lineValue,
        currency: pricedProduct.currency,
      });
    } catch (error) {
      console.warn(
        "Unable to send Meta AddToCart with database pricing",
        error,
      );
    }
  }

  async function addProductToCart(button) {
    const product = getProductFromButton(button);
    addProduct(product, 1);
    showAddedToCartToast(product.name, getCartQuantity());
    await trackMetaAddToCart(product, 1);
  }

  function addProduct(product, quantity) {
    const cart = readCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity = Number(existingItem.quantity || 0) + quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    saveCart(cart);
    updateCartCount();
  }

  function renderBuySheet() {
    if (!selectedBuyProduct) return;

    buySheetTitle.textContent = selectedBuyProduct.name.replace(
      " Liquid Spice",
      "",
    );
    buySheetName.textContent = selectedBuyProduct.name.includes("Liquid Spice")
      ? selectedBuyProduct.name
      : `${selectedBuyProduct.name} Liquid Spice`;
    buySheetDescription.textContent =
      selectedBuyProduct.descriptor ||
      "Make restaurant-style Butter Chicken at home. Just add chicken.";
    buySheetImage.src = selectedBuyProduct.image;
    buySheetImage.alt = selectedBuyProduct.name;
    buySheetQty.textContent = selectedBuyQuantity;
    buySheetTotal.textContent = formatMoney(
      selectedBuyProduct.price * selectedBuyQuantity,
    );
  }

  function openBuySheet(button) {
    if (!buySheetBackdrop) return;

    selectedBuyProduct = getProductFromButton(button);
    selectedBuyQuantity = 1;
    renderBuySheet();
    buySheetBackdrop.classList.add("is-visible");
    buySheetBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeBuySheet() {
    buySheetBackdrop?.classList.remove("is-visible");
    buySheetBackdrop?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updateBuyQuantity(direction) {
    selectedBuyQuantity = Math.max(1, selectedBuyQuantity + direction);
    renderBuySheet();
  }

  document
    .querySelectorAll(".container_slider .product-action-btn--cart")
    .forEach((button) => {
      button.addEventListener("click", () => addProductToCart(button));
    });

  document
    .querySelectorAll(".container_slider .product-action-btn--buy")
    .forEach((button) => {
      button.addEventListener("click", () => openBuySheet(button));
    });

  document
    .querySelector("[data-buy-sheet-close]")
    ?.addEventListener("click", closeBuySheet);
  buySheetBackdrop?.addEventListener("click", (event) => {
    if (event.target === buySheetBackdrop) closeBuySheet();
  });

  document.querySelectorAll("[data-buy-qty-action]").forEach((button) => {
    button.addEventListener("click", () => {
      updateBuyQuantity(button.dataset.buyQtyAction === "increase" ? 1 : -1);
    });
  });

  document
    .querySelector("[data-buy-sheet-checkout]")
    ?.addEventListener("click", async () => {
      if (!selectedBuyProduct) return;

      addProduct(selectedBuyProduct, selectedBuyQuantity);
      await trackMetaAddToCart(selectedBuyProduct, selectedBuyQuantity);
      window.location.href = "checkout.html";
    });

  window.addEventListener("storage", (event) => {
    if (event.key === cartStorageKey) updateCartCount();
  });

  updateCartCount();
}

window.addEventListener("load", initValourCartActions);

function initValourWhatsappSupport() {
  const support = document.querySelector("[data-whatsapp-support]");
  if (!support) return;

  const closeButton = support.querySelector("[data-whatsapp-close]");
  let hasShown = false;
  let bubbleCloseTimer;

  function showSupport() {
    if (hasShown) return;
    hasShown = true;
    support.classList.add("is-visible");
    window.removeEventListener("scroll", handleScroll);
    bubbleCloseTimer = window.setTimeout(() => {
      support.classList.add("is-bubble-closed");
    }, 4500);
  }

  function getScrollProgress() {
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollableHeight <= 0) return 0;
    return window.scrollY / scrollableHeight;
  }

  function handleScroll() {
    if (getScrollProgress() >= 0.38) {
      showSupport();
    }
  }

  closeButton?.addEventListener("click", () => {
    window.clearTimeout(bubbleCloseTimer);
    support.classList.add("is-bubble-closed");
  });

  support
    .querySelector(".valour-whatsapp-support__button")
    ?.addEventListener("click", () => {
      if (typeof window.fbq !== "function") return;
      window.valourMeta?.track("track", "Contact", {
        content_name: "VALOUR WhatsApp support",
        contact_channel: "whatsapp",
        source: "floating_support_cta",
      });
    });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.setTimeout(showSupport, 12000);
  handleScroll();
}

window.addEventListener("load", initValourWhatsappSupport);

function initAnnouncementCarousel() {
  const bar = document.querySelector(".announcement-bar");
  const track = document.getElementById("track-xf");
  const slides = Array.from(
    track?.querySelectorAll(".announcement-text") || [],
  );
  if (!bar || !track || slides.length < 2) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let activeIndex = 0;
  let autoplayTimer;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.setAttribute(
        "aria-hidden",
        slideIndex === activeIndex ? "false" : "true",
      );
    });
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!reduceMotion) {
      autoplayTimer = window.setInterval(
        () => showSlide(activeIndex + 1),
        4000,
      );
    }
  }

  bar.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isDragging = true;
    startX = currentX = event.clientX;
    track.classList.add("is-dragging");
    bar.setPointerCapture(event.pointerId);
    stopAutoplay();
  });

  bar.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    currentX = event.clientX;
    const dragPercent =
      ((currentX - startX) / Math.max(bar.clientWidth, 1)) * 100;
    track.style.transform = `translateX(calc(-${activeIndex * 100}% + ${dragPercent}%))`;
  });

  function finishDrag(event) {
    if (!isDragging) return;
    const distance = currentX - startX;
    isDragging = false;
    track.classList.remove("is-dragging");

    if (Math.abs(distance) > Math.min(70, bar.clientWidth * 0.2)) {
      showSlide(activeIndex + (distance < 0 ? 1 : -1));
    } else {
      showSlide(activeIndex);
    }

    if (bar.hasPointerCapture(event.pointerId))
      bar.releasePointerCapture(event.pointerId);
    startAutoplay();
  }

  bar.addEventListener("pointerup", finishDrag);
  bar.addEventListener("pointercancel", finishDrag);
  bar.addEventListener("mouseenter", stopAutoplay);
  bar.addEventListener("mouseleave", startAutoplay);
  document.addEventListener("visibilitychange", () => {
    document.hidden ? stopAutoplay() : startAutoplay();
  });

  showSlide(0);
  startAutoplay();
}

window.addEventListener("load", initAnnouncementCarousel);

function initValourStackStory() {
  const section = document.querySelector("[data-valour-stack-story]");
  if (!section) return;

  const items = Array.from(
    section.querySelectorAll(".valour-stack-story__item"),
  );
  const cards = items.map((item) => item.querySelector(".valour-stack-card"));
  const videos = cards.map((card) => card?.querySelector("video"));
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let activeIndex = 0;
  let activeCopyIndex = 0;
  let activeVideoIndices = new Set([0]);
  let triggerPositions = [];
  let copyTriggerPositions = [];
  let videoTriggerPositions = [];
  let scrollFrame = 0;
  const pendingPlayIndices = new Set();
  const playbackHealth = videos.map(() => ({
    currentTime: 0,
    advancedAt: performance.now(),
  }));

  function playVideo(index) {
    const video = videos[index];
    if (
      !video ||
      document.hidden ||
      reducedMotion ||
      pendingPlayIndices.has(index) ||
      !video.paused
    )
      return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    if (video.readyState < 2) {
      // `preload="none"` is commonly reported as NETWORK_IDLE on mobile,
      // not NETWORK_EMPTY. Explicitly request the deferred source once when
      // its card becomes relevant without repeatedly resetting the download.
      if (
        video.networkState !== HTMLMediaElement.NETWORK_LOADING &&
        video.dataset.loadRequested !== "true"
      ) {
        video.dataset.loadRequested = "true";
        video.load();
      }
      return;
    }

    pendingPlayIndices.add(index);
    const attempt = video.play();
    if (attempt?.then) {
      attempt.catch(() => {}).finally(() => pendingPlayIndices.delete(index));
    } else {
      pendingPlayIndices.delete(index);
    }
  }

  function setPlayingVideos(indices) {
    const nextIndices = new Set(
      indices.map((index) => Math.max(0, Math.min(videos.length - 1, index))),
    );
    const activatedAt = performance.now();
    nextIndices.forEach((index) => {
      if (!activeVideoIndices.has(index) && playbackHealth[index]) {
        playbackHealth[index].advancedAt = activatedAt;
      }
    });
    activeVideoIndices = nextIndices;
    videos.forEach((video, videoIndex) => {
      if (!video) return;
      if (nextIndices.has(videoIndex)) {
        if (video.paused) playVideo(videoIndex);
      } else video.pause();
    });
  }

  function setActiveStep(index, force = false) {
    const nextIndex = Math.max(0, Math.min(items.length - 1, index));
    if (!force && nextIndex === activeIndex) return;

    activeIndex = nextIndex;
    section.dataset.activeStep = String(nextIndex);
  }

  function setActiveCopy(index, force = false) {
    const nextIndex = Math.max(0, Math.min(items.length - 1, index));
    if (!force && nextIndex === activeCopyIndex) return;

    activeCopyIndex = nextIndex;
    items.forEach((item, itemIndex) => {
      item.classList.toggle("is-past", itemIndex < nextIndex);
      item.classList.toggle("is-current", itemIndex === nextIndex);
      item.classList.toggle("is-future", itemIndex > nextIndex);
    });
  }

  videos.forEach((video, index) => {
    if (!video) return;
    const markReady = () => cards[index]?.classList.add("is-video-ready");
    if (video.readyState >= 2) markReady();
    else {
      video.addEventListener("loadeddata", markReady, { once: true });
      video.addEventListener("canplay", markReady, { once: true });
    }
    video.addEventListener("canplay", () => {
      if (activeVideoIndices.has(index)) playVideo(index);
    });
    video.addEventListener("loadeddata", () => {
      if (activeVideoIndices.has(index)) playVideo(index);
    });
    video.addEventListener("pause", () => {
      if (!activeVideoIndices.has(index) || document.hidden || reducedMotion)
        return;
      window.requestAnimationFrame(() => playVideo(index));
    });
    const markPlaybackProgress = () => {
      const health = playbackHealth[index];
      if (!health) return;
      const currentTime = video.currentTime || 0;
      if (
        Math.abs(currentTime - health.currentTime) > 0.025 ||
        currentTime < health.currentTime
      ) {
        health.currentTime = currentTime;
        health.advancedAt = performance.now();
      }
    };
    video.addEventListener("playing", markPlaybackProgress);
    video.addEventListener("timeupdate", markPlaybackProgress);
  });

  function ensureActiveVideosPlaying() {
    if (document.hidden || reducedMotion) return;
    const sectionRect = section.getBoundingClientRect();
    if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) return;

    const now = performance.now();
    activeVideoIndices.forEach((index) => {
      const video = videos[index];
      const health = playbackHealth[index];
      if (!video || !health) return;
      if (video.paused) {
        pendingPlayIndices.delete(index);
        playVideo(index);
        return;
      }
      // Some mobile browsers suspend a decoder during momentum scrolling
      // without changing `paused`. Restart only when playback has genuinely
      // stopped advancing, leaving normally playing clips untouched.
      if (video.readyState >= 2 && now - health.advancedAt > 1800) {
        health.advancedAt = now;
        pendingPlayIndices.delete(index);
        video.pause();
        window.requestAnimationFrame(() => playVideo(index));
      }
    });
  }

  function measureSteps() {
    const trackTop =
      section
        .querySelector(".valour-stack-story__track")
        ?.getBoundingClientRect().top + window.scrollY || section.offsetTop;
    const stickyTop =
      Number.parseFloat(window.getComputedStyle(items[0]).top) || 0;
    // Stack depth changes only when the incoming card reaches the shared
    // sticky position. Copy timing follows the real copy-block positions.
    const activationLine = stickyTop + 8;
    triggerPositions = items.map(
      (item) => trackTop + item.offsetTop - activationLine,
    );
    copyTriggerPositions = items.map((item, index) => {
      if (index === 0) return Number.NEGATIVE_INFINITY;
      const incomingCopyTop =
        item.querySelector(".valour-stack-story__copy")?.offsetTop || 0;
      const previousCopyTop =
        items[index - 1].querySelector(".valour-stack-story__copy")
          ?.offsetTop || 0;
      const previousStickyCopyPosition = stickyTop + previousCopyTop;
      const readingLead = window.innerHeight * 0.12;
      return (
        trackTop +
        item.offsetTop +
        incomingCopyTop -
        previousStickyCopyPosition -
        readingLead
      );
    });
    videoTriggerPositions = items.map(
      (item) => trackTop + item.offsetTop - window.innerHeight * 0.82,
    );
  }

  function updateFromScroll() {
    scrollFrame = 0;
    let nextIndex = 0;
    for (let index = 1; index < triggerPositions.length; index += 1) {
      if (window.scrollY >= triggerPositions[index]) nextIndex = index;
    }
    let nextCopyIndex = 0;
    for (let index = 1; index < copyTriggerPositions.length; index += 1) {
      if (window.scrollY >= copyTriggerPositions[index]) nextCopyIndex = index;
    }
    let nextVideoIndex = 0;
    for (let index = 1; index < videoTriggerPositions.length; index += 1) {
      if (window.scrollY >= videoTriggerPositions[index])
        nextVideoIndex = index;
    }
    setActiveStep(nextIndex);
    setActiveCopy(nextCopyIndex);
    setPlayingVideos(
      nextVideoIndex === nextCopyIndex
        ? [nextVideoIndex]
        : [nextCopyIndex, nextVideoIndex],
    );
  }

  function requestScrollUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateFromScroll);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) videos.forEach((video) => video?.pause());
    else ensureActiveVideosPlaying();
  });

  if (reducedMotion) {
    videos.forEach((video) => video?.pause());
    return;
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("touchend", ensureActiveVideosPlaying, {
    passive: true,
  });
  window.addEventListener("pointerup", ensureActiveVideosPlaying, {
    passive: true,
  });
  window.addEventListener("scrollend", ensureActiveVideosPlaying, {
    passive: true,
  });
  window.addEventListener("focus", ensureActiveVideosPlaying);
  window.setInterval(ensureActiveVideosPlaying, 900);
  window.addEventListener(
    "resize",
    () => {
      measureSteps();
      requestScrollUpdate();
    },
    { passive: true },
  );
  measureSteps();
  setActiveStep(0, true);
  setActiveCopy(0, true);
  setPlayingVideos([0]);
  updateFromScroll();
  const directTarget =
    window.location.hash === "#valour-stack-story"
      ? section
      : items.find((item) => `#${item.id}` === window.location.hash);
  if (directTarget) {
    window.requestAnimationFrame(() =>
      directTarget.scrollIntoView({ block: "start" }),
    );
  }
}

// Start the first story video as soon as the markup is available. Waiting for
// window.load made this above-the-fold visual depend on every page asset.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initValourStackStory, {
    once: true,
  });
} else {
  initValourStackStory();
}
