
"use strict";

// A small, deliberate interaction layer. No scroll hijacking or looping effects.
const navButton = document.querySelector(".v3-menu");
const nav = document.querySelector(".v3-nav");

function closeNav() {
  if (!navButton || !nav) return;
  navButton.setAttribute("aria-expanded", "false");
  navButton.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("is-open");
}
if (nav && navButton) {
  navButton.addEventListener("click", () => {
    const open = navButton.getAttribute("aria-expanded") !== "true";
    navButton.setAttribute("aria-expanded", String(open));
    navButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const wasOpen = nav.classList.contains("is-open");
      closeNav();
      if (wasOpen) navButton.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!nav.contains(event.target) && !navButton.contains(event.target)) closeNav();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeNav();
  }, {passive:true});
}

// Text and project cards appear once. On reduced motion or older browsers,
// all content is visible without animations.
const animated = Array.from(document.querySelectorAll("[data-v3-reveal]"));
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
if (motionQuery.matches || !("IntersectionObserver" in window)) {
  animated.forEach((node) => node.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.add("is-visible");
      observer.unobserve(target);
    });
  }, {threshold: 0.08, rootMargin: "0px 0px -5% 0px"});
  animated.forEach((node) => revealObserver.observe(node));
}

// Real enquiry form; display an honest error instead of claiming a message
// was sent when the external provider rejects it.
const enquiry = document.querySelector("#project-enquiry");
if (enquiry) {
  const submit = enquiry.querySelector('button[type="submit"]');
  const status = enquiry.querySelector(".v3-form__status");
  enquiry.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!enquiry.reportValidity()) return;
    if (enquiry.querySelector('[name="_gotcha"]')?.value) return;
    submit.disabled = true;
    const label = submit.innerHTML;
    submit.textContent = "Sending…";
    status.hidden = false;
    status.textContent = "Sending your enquiry…";
    try {
      const response = await fetch(enquiry.action, {
        method: "POST",
        body: new FormData(enquiry),
        headers: {Accept: "application/json"}
      });
      if (!response.ok) throw new Error("Form provider rejected the request");
      enquiry.reset();
      status.textContent = "Thank you. Your message has been sent.";
    } catch {
      status.innerHTML = 'Something went wrong. Please email me at <a href="mailto:majda.tech10@gmail.com">majda.tech10@gmail.com</a>.';
    } finally {
      submit.disabled = false;
      submit.innerHTML = label;
    }
  });
}
