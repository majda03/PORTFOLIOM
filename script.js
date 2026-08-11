const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");
const progress = document.querySelector(".page-progress span");
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = Array.from(nav?.querySelectorAll('a[href^="#"]') || []);
const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

/* Elegant safety fallback: a missing image never leaves a broken-image icon. */

const escapeSvgText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const createImageFallback = (label = "Project visual") => {
  const safeLabel = escapeSvgText(
    String(label).trim().slice(0, 42) || "Project visual",
  );

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#170b11"/>
            <stop offset=".52" stop-color="#0b0b0c"/>
            <stop offset="1" stop-color="#030303"/>
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0" stop-color="#7b2948" stop-opacity=".46"/>
            <stop offset="1" stop-color="#7b2948" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#bg)"/>
        <circle cx="1270" cy="130" r="570" fill="url(#glow)"/>
        <circle cx="120" cy="930" r="430" fill="url(#glow)" opacity=".35"/>
        <rect x="80" y="75" width="1440" height="850" rx="8" fill="none" stroke="#e8e0d5" stroke-opacity=".16"/>
        <text x="130" y="165" fill="#cda9b7" font-family="Arial, sans-serif" font-size="18" letter-spacing="6">MK · SELECTED WORK</text>
        <text x="130" y="535" fill="#f8f5ef" font-family="Georgia, serif" font-size="72">${safeLabel}</text>
        <text x="132" y="600" fill="#e8e0d5" fill-opacity=".5" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">PROJECT VISUAL</text>
      </svg>
    `)
  );
};

document.querySelectorAll("img:not(#case-study-image)").forEach((image) => {
  const useFallback = () => {
    if (image.dataset.fallbackApplied === "true") return;

    image.dataset.fallbackApplied = "true";
    image.removeAttribute("srcset");
    image.src = createImageFallback(image.alt);
  };

  image.addEventListener("error", useFallback, { once: true });

  if (image.complete && image.naturalWidth === 0) {
    useFallback();
  }
});

/* Custom cursor */

if (hasFinePointer.matches && cursor && cursorDot) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener(
    "pointermove",
    (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursorDot.style.transform = `translate3d(${mouseX - 2}px, ${mouseY - 2}px, 0)`;
    },
    { passive: true },
  );

  document.addEventListener("pointerover", (event) => {
    const interactive = event.target.closest(
      "a, button, input, select, textarea",
    );
    cursor.classList.toggle("active", Boolean(interactive));
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.add("is-hidden");
    cursorDot.classList.add("is-hidden");
  });

  document.addEventListener("mouseenter", () => {
    cursor.classList.remove("is-hidden");
    cursorDot.classList.remove("is-hidden");
  });

  const animateCursor = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    cursor.style.transform = `translate3d(${ringX - 17}px, ${ringY - 17}px, 0)`;
    window.requestAnimationFrame(animateCursor);
  };

  animateCursor();
}

/* Entrance reveals */

const revealItems = document.querySelectorAll(
  ".reveal, .reveal-project, .reveal-image, .reveal-item",
);

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -7% 0px",
      threshold: 0.12,
    },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

/* Scroll progress, header and parallax */

const processSection = document.querySelector(".process");
const processFill = document.querySelector(".process-line span");
let scrollFrame = null;

const updateOnScroll = () => {
  scrollFrame = null;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const amount = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  if (progress) {
    progress.style.width = `${amount}%`;
  }

  header?.classList.toggle("is-scrolled", window.scrollY > 24);

  if (processSection && processFill) {
    const rect = processSection.getBoundingClientRect();
    const start = window.innerHeight * 0.72;
    const end = -rect.height * 0.15;
    const ratio = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    processFill.style.width = `${ratio * 100}%`;
  }

  if (!prefersReducedMotion.matches && window.innerWidth > 760) {
    parallaxItems.forEach((element) => {
      const speed = Number(element.dataset.parallax) || 0.05;
      const rect = element.getBoundingClientRect();
      const rawOffset =
        (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
      const offset = Math.max(-38, Math.min(38, rawOffset));
      element.style.setProperty("--parallax-y", `${offset}px`);
    });
  } else {
    parallaxItems.forEach((element) => {
      element.style.setProperty("--parallax-y", "0px");
    });
  }
};

const requestScrollUpdate = () => {
  if (scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(updateOnScroll);
};

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate, { passive: true });
updateOnScroll();

/* Mobile navigation */

const setNavigationOpen = (isOpen) => {
  if (!nav || !menuToggle) return;

  nav.classList.toggle("open", isOpen);
  menuToggle.classList.toggle("is-active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  document.body.classList.toggle("nav-open", isOpen);

  if (isOpen && window.innerWidth <= 980) {
    window.setTimeout(() => navLinks[0]?.focus(), 60);
  }
};

menuToggle?.addEventListener("click", () => {
  setNavigationOpen(!nav?.classList.contains("open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setNavigationOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (!nav?.classList.contains("open")) return;

  if (event.key === "Escape") {
    setNavigationOpen(false);
    menuToggle?.focus();
    return;
  }

  if (event.key !== "Tab" || window.innerWidth > 980 || !navLinks.length) {
    return;
  }

  const firstLink = navLinks[0];
  const lastLink = navLinks[navLinks.length - 1];

  if (event.shiftKey && document.activeElement === firstLink) {
    event.preventDefault();
    lastLink.focus();
  } else if (!event.shiftKey && document.activeElement === lastLink) {
    event.preventDefault();
    firstLink.focus();
  }
});

window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth > 980 && nav?.classList.contains("open")) {
      setNavigationOpen(false);
    }
  },
  { passive: true },
);

/* Predictable anchor navigation: long page jumps finish in under one second. */

const anchorLinks = Array.from(
  document.querySelectorAll('a[href^="#"]:not(.skip-link)'),
);

const revealAnchorTarget = (target) => {
  if (target.matches(".reveal, .reveal-project, .reveal-image, .reveal-item")) {
    target.classList.add("is-visible");
  }

  target
    .querySelectorAll(".reveal, .reveal-project, .reveal-image, .reveal-item")
    .forEach((item) => item.classList.add("is-visible"));
};

const scrollToAnchor = (target) => {
  const headerOffset = (header?.offsetHeight || 0) + 16;
  const startPosition = window.scrollY;
  const targetPosition = Math.max(
    0,
    target.getBoundingClientRect().top + startPosition - headerOffset,
  );
  const distance = targetPosition - startPosition;

  if (prefersReducedMotion.matches || Math.abs(distance) < 2) {
    window.scrollTo(0, targetPosition);
    return;
  }

  const duration = Math.min(850, Math.max(350, Math.abs(distance) * 0.22));
  const startedAt = performance.now();
  const easeOutCubic = (progressValue) => 1 - (1 - progressValue) ** 3;

  const animateScroll = (currentTime) => {
    const progressValue = Math.min(1, (currentTime - startedAt) / duration);
    window.scrollTo(
      0,
      startPosition + distance * easeOutCubic(progressValue),
    );

    if (progressValue < 1) {
      window.requestAnimationFrame(animateScroll);
    }
  };

  window.requestAnimationFrame(animateScroll);
};

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    setNavigationOpen(false);
    revealAnchorTarget(target);

    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }

    scrollToAnchor(target);
  });
});

/* Active navigation section */

if ("IntersectionObserver" in window) {
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) return;

      navLinks.forEach((link) => {
        const isCurrent =
          link.getAttribute("href") === `#${visibleSection.target.id}`;

        if (isCurrent) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-20% 0px -62% 0px",
      threshold: [0, 0.15, 0.35],
    },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}
/* =========================================================
   CONTACT MODAL + FORMSPREE SUBMISSION
========================================================= */

const contactModal = document.querySelector("#contact-modal");
const contactDialog = contactModal?.querySelector(".contact-dialog");
const contactOpenButton = document.querySelector(".contact-open");
const contactCloseButtons = document.querySelectorAll("[data-contact-close]");

const contactForm = document.querySelector("#contact-form");
const contactFormStatus = document.querySelector("#contact-form-status");
const contactSubmitButton = contactForm?.querySelector(".contact-submit");

const contactDialogHeader = contactModal?.querySelector(
  ".contact-dialog-header",
);
const contactSuccess = document.querySelector("#contact-success");

let previouslyFocusedElement = null;

/**
 * Sve elemente unutar modala na koje se može fokusirati.
 */
const getFocusableElements = () => {
  if (!contactModal) return [];

  return Array.from(
    contactModal.querySelectorAll(
      [
        "button:not([disabled])",
        'input:not([disabled]):not([type="hidden"])',
        "select:not([disabled])",
        "textarea:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  ).filter((element) => {
    return element.offsetParent !== null && element.tabIndex >= 0;
  });
};

/**
 * Otvaranje kontakt forme.
 */
const openContactModal = () => {
  if (!contactModal) return;

  setNavigationOpen(false);
  previouslyFocusedElement = document.activeElement;

  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
  contactModal.removeAttribute("inert");
  document.body.classList.add("contact-modal-open");

  window.setTimeout(() => {
    contactDialog?.focus();
  }, 50);
};

/**
 * Zatvaranje kontakt forme.
 */
const closeContactModal = () => {
  if (!contactModal) return;

  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
  contactModal.setAttribute("inert", "");
  document.body.classList.remove("contact-modal-open");

  window.setTimeout(() => {
    previouslyFocusedElement?.focus();
  }, 50);
};

/**
 * Prikaz greške ispod konkretnog polja.
 */
const showFieldError = (field, message) => {
  if (!field) return;

  const formField = field.closest(".form-field");
  const errorElement = formField?.querySelector(".field-error");

  formField?.classList.add("has-error");
  field.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
};

/**
 * Brisanje greške konkretnog polja.
 */
const clearFieldError = (field) => {
  if (!field) return;

  const formField = field.closest(".form-field");
  const errorElement = formField?.querySelector(".field-error");

  formField?.classList.remove("has-error");
  field.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
};

/**
 * Provjera polja prije slanja.
 */
const validateContactForm = () => {
  if (!contactForm) return false;

  let isValid = true;

  const nameField = contactForm.querySelector("#contact-name");
  const emailField = contactForm.querySelector("#contact-email");
  const projectField = contactForm.querySelector("#contact-project");
  const messageField = contactForm.querySelector("#contact-message");

  [nameField, emailField, projectField, messageField].forEach((field) => {
    if (field) clearFieldError(field);
  });

  if (!nameField?.value.trim()) {
    showFieldError(nameField, "Please enter your name.");
    isValid = false;
  }

  if (!emailField?.value.trim()) {
    showFieldError(emailField, "Please enter your email address.");
    isValid = false;
  } else if (!emailField.validity.valid) {
    showFieldError(emailField, "Please enter a valid email address.");
    isValid = false;
  }

  if (!projectField?.value) {
    showFieldError(projectField, "Please select a project type.");
    isValid = false;
  }

  if (!messageField?.value.trim()) {
    showFieldError(
      messageField,
      "Please share a few details about your project.",
    );
    isValid = false;
  } else if (messageField.value.trim().length < 20) {
    showFieldError(
      messageField,
      "Please add a little more detail so I can understand your project.",
    );
    isValid = false;
  }

  if (!isValid) {
    const firstInvalidField = contactForm.querySelector(
      '[aria-invalid="true"]',
    );

    firstInvalidField?.focus();
  }

  return isValid;
};

/**
 * Uključivanje i isključivanje loading stanja.
 */
const setContactLoading = (isLoading) => {
  if (!contactSubmitButton) return;

  contactSubmitButton.disabled = isLoading;
  contactSubmitButton.classList.toggle("is-loading", isLoading);
  contactForm?.setAttribute("aria-busy", String(isLoading));
};

/**
 * Prikaz uspješno poslane poruke.
 */
const showContactSuccess = () => {
  if (!contactForm || !contactDialogHeader || !contactSuccess) return;

  contactDialogHeader.style.display = "none";
  contactForm.style.display = "none";

  contactSuccess.classList.add("is-visible");
  contactSuccess.setAttribute("aria-hidden", "false");
  contactSuccess.removeAttribute("inert");

  const successButton = contactSuccess.querySelector("button");
  successButton?.focus();
};

/**
 * Vraćanje modala u početno stanje.
 */
const resetContactModal = () => {
  if (!contactForm || !contactDialogHeader || !contactSuccess) return;

  contactForm.reset();
  contactForm.style.display = "";
  contactDialogHeader.style.display = "";

  contactSuccess.classList.remove("is-visible");
  contactSuccess.setAttribute("aria-hidden", "true");
  contactSuccess.setAttribute("inert", "");

  if (contactFormStatus) {
    contactFormStatus.textContent = "";
  }

  contactForm
    .querySelectorAll(".form-field")
    .forEach((field) => field.classList.remove("has-error"));

  contactForm
    .querySelectorAll('[aria-invalid="true"]')
    .forEach((field) => field.removeAttribute("aria-invalid"));

  contactForm.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });

  setContactLoading(false);
};

contactOpenButton?.addEventListener("click", openContactModal);

contactCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeContactModal();

    window.setTimeout(() => {
      resetContactModal();
    }, 450);
  });
});

/**
 * Escape zatvara modal.
 * Tab ostaje zarobljen unutar otvorenog modala.
 */
document.addEventListener("keydown", (event) => {
  if (!contactModal?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeContactModal();

    window.setTimeout(() => {
      resetContactModal();
    }, 450);

    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = getFocusableElements();

  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});

/**
 * Uklanja grešku čim korisnik počne ispravljati polje.
 */
contactForm?.querySelectorAll("input, select, textarea").forEach((field) => {
  const clearError = () => clearFieldError(field);

  field.addEventListener("input", clearError);
  field.addEventListener("change", clearError);
});

/**
 * Slanje forme Formspree servisu bez napuštanja stranice.
 */
contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateContactForm()) return;

  const endpoint = contactForm.getAttribute("action");

  if (!endpoint || endpoint.includes("YOUR_FORM_ID")) {
    if (contactFormStatus) {
      contactFormStatus.textContent =
        "The contact form is not connected yet. Please add your Formspree form ID.";
    }

    return;
  }

  setContactLoading(true);
  if (contactFormStatus) {
    contactFormStatus.textContent = "";
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(contactForm),
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      contactForm.reset();
      showContactSuccess();
      return;
    }

    let errorMessage =
      "Something went wrong. Please check your details and try again.";

    try {
      const responseData = await response.json();

      if (responseData.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors
          .map((error) => error.message)
          .join(" ");
      }
    } catch (jsonError) {
      // Ako odgovor nije JSON, koristi se opšta poruka.
    }

    if (response.status === 429) {
      errorMessage =
        "Too many messages were sent in a short period. Please try again a little later.";
    }

    if (contactFormStatus) {
      contactFormStatus.textContent = errorMessage;
    }
  } catch (error) {
    if (contactFormStatus) {
      contactFormStatus.textContent =
        "The message could not be sent. Please check your internet connection and try again.";
    }
  } finally {
    setContactLoading(false);
  }
});

/* Premium pointer light on project cards */

if (hasFinePointer.matches) {
  document.querySelectorAll(".work-card").forEach((card) => {
    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--spot-x", "50%");
      card.style.setProperty("--spot-y", "50%");
    });
  });
}

/* Royal Cosmetics interactive product preview */

const royalShowcase = document.querySelector("[data-royal-showcase]");
const royalTabs = Array.from(
  royalShowcase?.querySelectorAll("[data-royal-view]") || [],
);
const royalPanels = Array.from(
  royalShowcase?.querySelectorAll("[data-royal-panel]") || [],
);
const royalStatus = royalShowcase?.querySelector("[data-royal-status]");

const royalViewCopy = {
  storefront: "Storefront · Responsive product storytelling",
  discovery: "Discovery · Search, filters, sorting and saved products",
  checkout: "Checkout · Validation, payment choice and order summary",
};

let royalActiveIndex = 0;
let royalAutoplayTimer = null;
let royalWasManuallyControlled = false;
let royalShowcaseIsVisible = false;

const activateRoyalView = (viewName, { focusTab = false } = {}) => {
  const nextIndex = royalTabs.findIndex(
    (tab) => tab.dataset.royalView === viewName,
  );

  if (nextIndex < 0) return;

  royalActiveIndex = nextIndex;

  royalTabs.forEach((tab, index) => {
    const isActive = index === nextIndex;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    if (isActive && focusTab) {
      tab.focus();
    }
  });

  royalPanels.forEach((panel) => {
    const isActive = panel.dataset.royalPanel === viewName;

    if (isActive) {
      panel.hidden = false;
      window.requestAnimationFrame(() => panel.classList.add("is-active"));
    } else {
      panel.classList.remove("is-active");
      panel.hidden = true;
    }
  });

  if (royalStatus) {
    royalStatus.textContent = royalViewCopy[viewName] || "";
  }
};

const stopRoyalAutoplay = () => {
  if (royalAutoplayTimer !== null) {
    window.clearInterval(royalAutoplayTimer);
    royalAutoplayTimer = null;
  }
};

const startRoyalAutoplay = () => {
  if (
    prefersReducedMotion.matches ||
    royalWasManuallyControlled ||
    royalTabs.length < 2 ||
    royalAutoplayTimer !== null
  ) {
    return;
  }

  royalAutoplayTimer = window.setInterval(() => {
    const nextIndex = (royalActiveIndex + 1) % royalTabs.length;
    activateRoyalView(royalTabs[nextIndex].dataset.royalView);
  }, 5200);
};

royalTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    royalWasManuallyControlled = true;
    stopRoyalAutoplay();
    activateRoyalView(tab.dataset.royalView);
  });

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    royalWasManuallyControlled = true;
    stopRoyalAutoplay();

    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % royalTabs.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + royalTabs.length) % royalTabs.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = royalTabs.length - 1;
    }

    activateRoyalView(royalTabs[nextIndex].dataset.royalView, {
      focusTab: true,
    });
  });
});

if (royalShowcase && "IntersectionObserver" in window) {
  const royalPreviewObserver = new IntersectionObserver(
    ([entry]) => {
      royalShowcaseIsVisible = entry.isIntersecting;

      if (entry.isIntersecting) {
        startRoyalAutoplay();
      } else {
        stopRoyalAutoplay();
      }
    },
    { threshold: 0.28 },
  );

  royalPreviewObserver.observe(royalShowcase);
}

/* =========================================================
   PROJECT CASE STUDIES

   Kada objaviš Royal Cosmetics, njen live i GitHub link zalijepi u
   označena liveUrl i codeUrl polja u "royal" objektu ispod.
========================================================= */

const cineVaultCaseStudyImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="0.55" stop-color="#070b12"/>
          <stop offset="1" stop-color="#030509"/>
        </linearGradient>
        <linearGradient id="hero" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#101722"/>
          <stop offset="0.56" stop-color="#172337"/>
          <stop offset="1" stop-color="#804b42"/>
        </linearGradient>
        <linearGradient id="posterOne" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d8b17b"/>
          <stop offset="0.45" stop-color="#6f4540"/>
          <stop offset="1" stop-color="#151922"/>
        </linearGradient>
        <linearGradient id="posterTwo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7289aa"/>
          <stop offset="0.5" stop-color="#24354f"/>
          <stop offset="1" stop-color="#090d14"/>
        </linearGradient>
        <linearGradient id="posterThree" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#b66f62"/>
          <stop offset="0.48" stop-color="#4e2930"/>
          <stop offset="1" stop-color="#100b10"/>
        </linearGradient>
        <linearGradient id="posterFour" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#779082"/>
          <stop offset="0.48" stop-color="#2e4a43"/>
          <stop offset="1" stop-color="#09100f"/>
        </linearGradient>
        <radialGradient id="light">
          <stop offset="0" stop-color="#90a9cb" stop-opacity=".22"/>
          <stop offset="1" stop-color="#90a9cb" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000" flood-opacity=".42"/>
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#background)"/>
      <circle cx="1250" cy="130" r="430" fill="url(#light)"/>

      <rect x="0" y="0" width="1600" height="88" fill="#080c12"/>
      <line x1="0" y1="88" x2="1600" y2="88" stroke="#263140"/>
      <text x="58" y="55" fill="#f2f5f8" font-family="Arial, sans-serif" font-size="23" font-weight="700" letter-spacing="7">CINEVAULT</text>
      <text x="318" y="55" fill="#8290a3" font-family="Arial, sans-serif" font-size="13" letter-spacing="2">DISCOVER</text>
      <text x="438" y="55" fill="#8290a3" font-family="Arial, sans-serif" font-size="13" letter-spacing="2">COLLECTIONS</text>
      <text x="595" y="55" fill="#8290a3" font-family="Arial, sans-serif" font-size="13" letter-spacing="2">MY VAULT</text>
      <rect x="1185" y="24" width="265" height="40" rx="20" fill="#101722" stroke="#334155"/>
      <circle cx="1215" cy="44" r="7" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <line x1="1220" y1="49" x2="1227" y2="56" stroke="#94a3b8" stroke-width="2"/>
      <text x="1240" y="49" fill="#718096" font-family="Arial, sans-serif" font-size="12">Search films, genres, stories...</text>
      <circle cx="1510" cy="44" r="20" fill="#151d29" stroke="#334155"/>
      <path d="M1502 43 L1508 49 L1519 36" fill="none" stroke="#d9a96a" stroke-width="2"/>

      <rect x="0" y="88" width="250" height="812" fill="#090d13"/>
      <line x1="250" y1="88" x2="250" y2="900" stroke="#263140"/>
      <text x="42" y="145" fill="#65748a" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">BROWSE BY</text>
      <text x="42" y="191" fill="#f3f5f7" font-family="Arial, sans-serif" font-size="16">All films</text>
      <circle cx="211" cy="186" r="5" fill="#d9a96a"/>
      <text x="42" y="232" fill="#8592a3" font-family="Arial, sans-serif" font-size="15">Drama</text>
      <text x="42" y="273" fill="#8592a3" font-family="Arial, sans-serif" font-size="15">Thriller</text>
      <text x="42" y="314" fill="#8592a3" font-family="Arial, sans-serif" font-size="15">Science fiction</text>
      <text x="42" y="355" fill="#8592a3" font-family="Arial, sans-serif" font-size="15">Documentary</text>
      <line x1="42" y1="397" x2="208" y2="397" stroke="#25303d"/>
      <text x="42" y="438" fill="#65748a" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">RATING</text>
      <text x="42" y="481" fill="#d9a96a" font-family="Arial, sans-serif" font-size="17">★★★★★</text>
      <text x="42" y="522" fill="#8592a3" font-family="Arial, sans-serif" font-size="14">4 stars &amp; up</text>
      <line x1="42" y1="563" x2="208" y2="563" stroke="#25303d"/>
      <text x="42" y="606" fill="#65748a" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">MY COLLECTION</text>
      <rect x="42" y="634" width="166" height="42" rx="4" fill="#131b26" stroke="#2d3a4b"/>
      <text x="63" y="660" fill="#dce3eb" font-family="Arial, sans-serif" font-size="13">Saved titles</text>
      <text x="183" y="660" fill="#d9a96a" font-family="Arial, sans-serif" font-size="13">12</text>

      <g filter="url(#shadow)">
        <rect x="294" y="128" width="1262" height="350" rx="8" fill="url(#hero)"/>
      </g>
      <circle cx="1374" cy="254" r="182" fill="#ca8068" opacity=".15"/>
      <circle cx="1455" cy="228" r="112" fill="#e8b899" opacity=".09"/>
      <text x="350" y="188" fill="#d9a96a" font-family="Arial, sans-serif" font-size="11" letter-spacing="3">FEATURED COLLECTION · 07</text>
      <text x="350" y="265" fill="#f6f7f9" font-family="Georgia, serif" font-size="66">Stories that stay</text>
      <text x="350" y="329" fill="#f6f7f9" font-family="Georgia, serif" font-size="66" font-style="italic">after the credits.</text>
      <text x="353" y="375" fill="#aab4c2" font-family="Arial, sans-serif" font-size="15">A curated selection of visually striking cinema, saved around your taste.</text>
      <rect x="350" y="407" width="158" height="42" rx="3" fill="#e7d1b4"/>
      <text x="384" y="433" fill="#111722" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1">EXPLORE NOW</text>
      <rect x="521" y="407" width="127" height="42" rx="3" fill="none" stroke="#637186"/>
      <text x="550" y="433" fill="#dce3eb" font-family="Arial, sans-serif" font-size="11" letter-spacing="1">SAVE LIST</text>
      <circle cx="1370" cy="309" r="53" fill="#111722" fill-opacity=".72" stroke="#d5ac78"/>
      <polygon points="1356,284 1356,334 1394,309" fill="#e7d1b4"/>

      <text x="294" y="546" fill="#f2f5f8" font-family="Georgia, serif" font-size="28">Recommended for you</text>
      <text x="1470" y="544" fill="#8190a4" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">VIEW ALL →</text>

      <g filter="url(#shadow)">
        <rect x="294" y="580" width="270" height="248" rx="6" fill="url(#posterOne)"/>
        <rect x="585" y="580" width="270" height="248" rx="6" fill="url(#posterTwo)"/>
        <rect x="876" y="580" width="270" height="248" rx="6" fill="url(#posterThree)"/>
        <rect x="1167" y="580" width="270" height="248" rx="6" fill="url(#posterFour)"/>
      </g>

      <text x="318" y="620" fill="#f8e9d2" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">DRAMA · 2026</text>
      <text x="318" y="760" fill="#fff7ec" font-family="Georgia, serif" font-size="30">The Golden Hour</text>
      <text x="318" y="796" fill="#f2d69e" font-family="Arial, sans-serif" font-size="14">★ 4.9</text>
      <circle cx="526" cy="612" r="17" fill="#131923" fill-opacity=".7"/>
      <text x="518" y="619" fill="#f4dfc2" font-family="Arial, sans-serif" font-size="18">♡</text>

      <text x="609" y="620" fill="#dce8f7" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">SCI-FI · 2025</text>
      <text x="609" y="760" fill="#f2f6fb" font-family="Georgia, serif" font-size="30">Still Orbit</text>
      <text x="609" y="796" fill="#b6cce8" font-family="Arial, sans-serif" font-size="14">★ 4.8</text>
      <circle cx="817" cy="612" r="17" fill="#131923" fill-opacity=".7"/>
      <text x="809" y="619" fill="#dce8f7" font-family="Arial, sans-serif" font-size="18">♥</text>

      <text x="900" y="620" fill="#f3dadd" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">THRILLER · 2026</text>
      <text x="900" y="760" fill="#fff2f3" font-family="Georgia, serif" font-size="30">After Midnight</text>
      <text x="900" y="796" fill="#dda7ab" font-family="Arial, sans-serif" font-size="14">★ 4.7</text>
      <circle cx="1108" cy="612" r="17" fill="#131923" fill-opacity=".7"/>
      <text x="1100" y="619" fill="#f3dadd" font-family="Arial, sans-serif" font-size="18">♡</text>

      <text x="1191" y="620" fill="#dceae2" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">DOCUMENTARY · 2025</text>
      <text x="1191" y="760" fill="#f0f7f3" font-family="Georgia, serif" font-size="30">Quiet Earth</text>
      <text x="1191" y="796" fill="#b5d3c1" font-family="Arial, sans-serif" font-size="14">★ 4.9</text>
      <circle cx="1399" cy="612" r="17" fill="#131923" fill-opacity=".7"/>
      <text x="1391" y="619" fill="#dceae2" font-family="Arial, sans-serif" font-size="18">♡</text>

      <text x="294" y="868" fill="#64748b" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">SEARCH · FILTER · SAVE · REDISCOVER</text>
      <text x="1437" y="868" fill="#d9a96a" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">CINEVAULT / 2026</text>
    </svg>
  `);

const createCaseStudyFallbackImage = (project) => {
  const title = project?.title || "Selected Project";
  const category = project?.category || "Digital Experience";

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#170b11"/>
            <stop offset=".48" stop-color="#0b0b0c"/>
            <stop offset="1" stop-color="#030303"/>
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0" stop-color="#7b2948" stop-opacity=".5"/>
            <stop offset="1" stop-color="#7b2948" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#bg)"/>
        <circle cx="1260" cy="130" r="520" fill="url(#glow)"/>
        <circle cx="145" cy="770" r="350" fill="url(#glow)" opacity=".35"/>
        <rect x="76" y="70" width="1448" height="760" rx="8" fill="none" stroke="#e8e0d5" stroke-opacity=".16"/>
        <line x1="76" y1="160" x2="1524" y2="160" stroke="#e8e0d5" stroke-opacity=".12"/>
        <circle cx="116" cy="115" r="7" fill="#e8e0d5" fill-opacity=".38"/>
        <circle cx="140" cy="115" r="7" fill="#e8e0d5" fill-opacity=".22"/>
        <circle cx="164" cy="115" r="7" fill="#e8e0d5" fill-opacity=".12"/>
        <text x="1320" y="120" fill="#e8e0d5" fill-opacity=".45" font-family="Arial, sans-serif" font-size="12" letter-spacing="3">MK / 2026</text>
        <text x="150" y="280" fill="#cda9b7" font-family="Arial, sans-serif" font-size="14" letter-spacing="4">${category.toUpperCase()}</text>
        <text x="150" y="440" fill="#f8f5ef" font-family="Georgia, serif" font-size="94">${title}</text>
        <text x="154" y="505" fill="#e8e0d5" fill-opacity=".58" font-family="Arial, sans-serif" font-size="19" letter-spacing="2">CASE STUDY · RESPONSIVE DIGITAL EXPERIENCE</text>
        <rect x="150" y="600" width="220" height="52" fill="#f8f5ef"/>
        <text x="192" y="633" fill="#080808" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">PROJECT VISUAL</text>
        <text x="150" y="752" fill="#e8e0d5" fill-opacity=".36" font-family="Arial, sans-serif" font-size="12" letter-spacing="3">FRONTEND DEVELOPMENT · UI DESIGN · VISUAL DIRECTION</text>
      </svg>
    `)
  );
};

const portfolioProjects = {
  "coded-vibrations": {
    number: "01",
    category: "Creative Studio Website",
    title: "Coded Vibrations",
    intro:
      "A premium studio website built as a complete responsive frontend.",
    image: "images/coded-vibrations.jpeg",
    imageAlt: "Coded Vibrations premium creative studio website",
    role: "Frontend Development · UI Design · Visual Direction",
    stack: "HTML5 · CSS3 · JavaScript · Responsive Design · Motion",
    year: "2026",
    challenge:
      "Give a nine-section studio website a strong visual identity while keeping its service hierarchy and calls to action clear on every screen size.",
    approach:
      "I separated structure, presentation and interaction into HTML, CSS and JavaScript, used eight responsive media queries, and added a mobile menu plus IntersectionObserver reveals.",
    result:
      "A nine-section responsive site with mobile navigation, progressive reveals and a consistent editorial system implemented without a UI framework.",
    features: [
      "Nine complete content sections",
      "Eight CSS responsive media queries",
      "Mobile navigation written in JavaScript",
      "IntersectionObserver-based entrance reveals",
    ],
    liveUrl: "https://majda03.github.io/Premium-Landing/",
    codeUrl: "https://github.com/majda03/Premium-Landing",
  },
  noera: {
    number: "02",
    category: "Fashion Editorial",
    title: "Noéra",
    intro:
      "A fashion editorial translated into a focused responsive website.",
    image: "images/b.png",
    imageAlt: "Noéra fashion editorial website",
    role: "Frontend Development · UI Design · Art Direction",
    stack: "HTML5 · CSS3 · JavaScript · Responsive Layout · Animation",
    year: "2026",
    challenge:
      "Preserve an image-led editorial rhythm across six sections without letting the layout or typography lose clarity on smaller screens.",
    approach:
      "I built the composition with semantic HTML, three responsive breakpoints and an IntersectionObserver reveal system that keeps motion separate from the content structure.",
    result:
      "A six-section website with deliberate mobile layouts, responsive typography and progressive scroll reveals in a compact HTML, CSS and JavaScript build.",
    features: [
      "Six editorial content sections",
      "Three defined responsive breakpoints",
      "IntersectionObserver entrance system",
      "Dedicated mobile composition",
    ],
    liveUrl: "https://majda03.github.io/Noera-Fashion-Landing-Page/",
    codeUrl: "https://github.com/majda03/Noera-Fashion-Landing-Page",
  },
  "vesper-air": {
    number: "03",
    category: "Private Aviation",
    title: "Vesper Air",
    intro:
      "A private aviation website combining a premium interface with coordinated frontend motion.",
    image: "images/vesper-air.jpeg",
    imageAlt: "Vesper Air private aviation website",
    role: "Frontend Development · UI Design · Visual Direction",
    stack: "HTML5 · CSS3 · JavaScript · Responsive Design · Interactions",
    year: "2026",
    challenge:
      "Keep a loader, scroll-reactive navigation, reveals and animated counters coordinated across an eight-section page without overwhelming the content.",
    approach:
      "I organized each interaction in JavaScript, used IntersectionObserver for reveal timing and counters, and supported the layout with two major responsive breakpoints.",
    result:
      "An eight-section responsive website with a controlled loading sequence, active navigation states, animated statistics and smooth internal navigation.",
    features: [
      "Eight complete content sections",
      "Loader and scroll-reactive navigation",
      "Observer-driven reveals and counters",
      "Two major responsive breakpoints",
    ],
    liveUrl: "https://majda03.github.io/Premium-vibe-Landing-Page/",
    codeUrl: "https://github.com/majda03/Premium-vibe-Landing-Page",
  },
  "lumen-atelier": {
    number: "04",
    category: "Interior Design",
    title: "Lumen Atelier",
    intro:
      "An architectural portfolio with a custom draggable project gallery.",
    image: "images/lumen-atelier.jpeg",
    imageAlt: "Lumen Atelier interior design website",
    role: "Frontend Development · UI Design · Art Direction",
    stack: "HTML5 · CSS3 · JavaScript · Responsive Design · Motion",
    year: "2026",
    challenge:
      "Make the same gallery interaction feel natural with both mouse and touch input while preserving an image-led layout across screen sizes.",
    approach:
      "I built a four-card drag system with pointer and touch handling, connected it to progress feedback, and layered in parallax, cursor and reveal behavior across four breakpoints.",
    result:
      "An eight-section portfolio whose four-project gallery works across mouse and touch, supported by responsive layouts and custom interaction feedback.",
    features: [
      "Eight complete content sections",
      "Four draggable gallery projects",
      "Mouse and touch interaction support",
      "Four responsive breakpoints plus progress feedback",
    ],
    liveUrl: "https://majda03.github.io/LUMEN-Atelier/",
    codeUrl: "https://github.com/majda03/LUMEN-Atelier",
  },
  royal: {
    number: "05",
    category: "Luxury E-commerce Application",
    title: "Royal Cosmetics",
    intro:
      "A beauty commerce application built around discovery, persistent state and a complete simulated order journey.",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=86&w=1800",
    imageAlt: "Royal Cosmetics luxury e-commerce application",
    role: "Product Design · React Development · Frontend Architecture",
    stack:
      "React 19 · TypeScript · Context API · React Router · Local Storage · Responsive UI",
    year: "2026",
    challenge:
      "Keep catalogue discovery, two shared state systems, stock-aware cart calculations and checkout validation consistent across ten routed views.",
    approach:
      "I split the interface into 17 reusable components, used Cart and Wishlist contexts with local storage, lazy-loaded route pages and covered catalogue, filtering and delivery rules with Vitest.",
    result:
      "A source-verified React application with 10 route views, 17 reusable components, a 20-product catalogue, two shared contexts and five automated business-logic tests.",
    features: [
      "10 routed views including product, cart, checkout and order success",
      "17 reusable components and lazy-loaded route pages",
      "20 products with search, category, price and wishlist filtering",
      "Cart and Wishlist contexts persisted through local storage",
      "Five Vitest checks for catalogue, filters and 80 KM delivery logic",
      "Validated fields and a clearly simulated checkout flow",
    ],
    liveUrl: "https://final-royal-cosmetics-2.vercel.app/",
    codeUrl: "https://github.com/majda03/Webshop-for-cosmetics-product",
  },
  brandlab: {
    number: "06",
    category: "Brand Direction Application",
    title: "BrandLab AI",
    intro:
      "An application for generating, copying and saving reusable brand directions.",
    image: "images/brandlab-preview.jpeg",
    imageAlt: "BrandLab AI application interface",
    role: "Application Development · UI Design · Interaction Design",
    stack: "HTML5 · CSS3 · JavaScript · DOM · CSS Variables",
    year: "2026",
    challenge:
      "Turn four user decisions into a coherent concept, palette and reusable code while keeping generated directions easy to compare and revisit.",
    approach:
      "I mapped four decision inputs into dynamic copy and palette output, generated CSS variables, added one-click copy actions and persisted a maximum of six concepts in local storage.",
    result:
      "A working JavaScript tool with four decision inputs, reusable CSS output, palette copying and a six-concept saved history.",
    features: [
      "Four brand-direction inputs",
      "Generated palette and CSS variables",
      "One-click CSS and palette copying",
      "Up to six concepts persisted locally",
    ],
    // BRANDLAB
    liveUrl: "https://majda03.github.io/BrandLab-AI-App/",
    codeUrl: "https://github.com/majda03/BrandLab-AI-App",
  },
  cinevault: {
    number: "07",
    category: "Movie Discovery Application",
    title: "CineVault",
    intro:
      "A movie discovery application with search, filtering and persistent personal states.",
    image: "images/cinevault-preview1.png",
    imageAlt: "CineVault movie discovery application",
    role: "Application Development · Frontend Logic · UI Design",
    stack: "HTML5 · CSS3 · JavaScript · DOM · Local Storage",
    year: "2026",
    challenge:
      "Keep search, six genre filters, five sort states and two personal collections understandable while every view updates from the same 12-title dataset.",
    approach:
      "I centralized rendering and filtering logic, then used local storage for watchlist, watched and theme preferences so three user states survive between visits.",
    result:
      "A working 12-title application with six genres, five sort states, search, detail modals and three persisted preferences.",
    features: [
      "12 titles across six genres",
      "Five sort states including the default order",
      "Watchlist, watched and theme persistence",
      "Search, detail modal and dynamic rendering",
    ],
    // CINEVAULT
    liveUrl: "https://majda03.github.io/Cinema-applicaton-JavaScript-HTML-CSS/",
    codeUrl: "https://github.com/majda03/Cinema-applicaton-JavaScript-HTML-CSS",
  },
};

const caseStudyModal = document.querySelector("#case-study-modal");
const caseStudyDialog = caseStudyModal?.querySelector(".case-study-dialog");
const caseStudyCloseButtons = document.querySelectorAll(
  "[data-case-study-close]",
);
const caseStudyTriggers = document.querySelectorAll("[data-case-study]");

const caseStudyFields = {
  number: document.querySelector("#case-study-number"),
  category: document.querySelector("#case-study-category"),
  title: document.querySelector("#case-study-title"),
  intro: document.querySelector("#case-study-intro"),
  image: document.querySelector("#case-study-image"),
  role: document.querySelector("#case-study-role"),
  stack: document.querySelector("#case-study-stack"),
  year: document.querySelector("#case-study-year"),
  challenge: document.querySelector("#case-study-challenge"),
  approach: document.querySelector("#case-study-approach"),
  result: document.querySelector("#case-study-result"),
  features: document.querySelector("#case-study-features"),
  live: document.querySelector("#case-study-live"),
  code: document.querySelector("#case-study-code"),
  comingSoon: document.querySelector("#case-study-coming-soon"),
};

let caseStudyPreviousFocus = null;

const isUsableProjectUrl = (url) => {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
};

const setProjectLink = (element, url) => {
  if (!element) return false;

  const isUsable = isUsableProjectUrl(url);
  element.hidden = !isUsable;

  if (isUsable) {
    element.href = url.trim();
    element.target = "_blank";
    element.rel = "noopener noreferrer";
  } else {
    element.removeAttribute("href");
    element.removeAttribute("target");
    element.removeAttribute("rel");
  }

  return isUsable;
};

const renderCaseStudy = (project) => {
  if (!project) return;

  const textFields = [
    "number",
    "category",
    "title",
    "intro",
    "role",
    "stack",
    "year",
    "challenge",
    "approach",
    "result",
  ];

  textFields.forEach((field) => {
    if (caseStudyFields[field]) {
      caseStudyFields[field].textContent = project[field];
    }
  });

  if (caseStudyFields.image) {
    caseStudyFields.image.alt = project.imageAlt;
    const fallbackImage = createCaseStudyFallbackImage(project);

    caseStudyFields.image.onerror = () => {
      caseStudyFields.image.onerror = null;
      caseStudyFields.image.src = fallbackImage;
    };

    caseStudyFields.image.src = project.image || fallbackImage;
  }

  if (caseStudyFields.features) {
    caseStudyFields.features.replaceChildren();

    project.features.forEach((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      caseStudyFields.features.append(item);
    });
  }

  const hasLiveLink = setProjectLink(caseStudyFields.live, project.liveUrl);
  const hasCodeLink = setProjectLink(caseStudyFields.code, project.codeUrl);

  if (caseStudyFields.comingSoon) {
    caseStudyFields.comingSoon.hidden = hasLiveLink || hasCodeLink;
  }
};

const getCaseStudyFocusableElements = () => {
  if (!caseStudyModal) return [];

  return Array.from(
    caseStudyModal.querySelectorAll(
      [
        "button:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  ).filter((element) => element.offsetParent !== null && element.tabIndex >= 0);
};

const openCaseStudy = (projectKey) => {
  const project = portfolioProjects[projectKey];

  if (!project || !caseStudyModal) return;

  renderCaseStudy(project);
  setNavigationOpen(false);
  stopRoyalAutoplay();
  caseStudyPreviousFocus = document.activeElement;

  caseStudyModal.removeAttribute("inert");
  caseStudyModal.setAttribute("aria-hidden", "false");
  caseStudyModal.classList.add("is-open");
  document.body.classList.add("case-study-open");

  window.setTimeout(() => caseStudyDialog?.focus(), 40);
};

const closeCaseStudy = () => {
  if (!caseStudyModal) return;

  caseStudyModal.classList.remove("is-open");
  caseStudyModal.setAttribute("aria-hidden", "true");
  caseStudyModal.setAttribute("inert", "");
  document.body.classList.remove("case-study-open");

  window.setTimeout(() => caseStudyPreviousFocus?.focus(), 40);
  if (royalShowcaseIsVisible) {
    startRoyalAutoplay();
  }
};

caseStudyTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openCaseStudy(trigger.dataset.caseStudy);
  });
});

caseStudyCloseButtons.forEach((button) => {
  button.addEventListener("click", closeCaseStudy);
});

document.addEventListener("keydown", (event) => {
  if (!caseStudyModal?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeCaseStudy();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = getCaseStudyFocusableElements();
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});
