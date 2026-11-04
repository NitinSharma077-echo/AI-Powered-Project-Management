import { useEffect } from "react";

/**
 * Adds the `is-in` class to every [data-reveal] element once it scrolls
 * into view, which is what the CSS transitions key off. Elements are
 * unobserved after revealing so nothing re-animates on the way back up.
 *
 * Honours prefers-reduced-motion by revealing everything immediately.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll("[data-reveal]"));

    if (nodes.length === 0) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // No IntersectionObserver (or motion is unwanted): show the content
    // rather than leaving it stuck at opacity 0.
    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          // Stagger siblings so a row of cards arrives in sequence.
          const delay = Number(entry.target.dataset.revealDelay || 0);

          window.setTimeout(() => {
            entry.target.classList.add("is-in");
          }, delay);

          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);
}

/**
 * Writes scroll progress and pointer offset onto the given element as CSS
 * custom properties, so the parallax maths lives in CSS rather than here.
 *
 * --sy  scroll offset in px, for drifting layers
 * --mx / --my  pointer offset from centre, -1..1
 */
export function useParallax(ref) {
  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;

    function write(sy, mx, my) {
      node.style.setProperty("--sy", `${sy}px`);
      node.style.setProperty("--mx", mx.toFixed(3));
      node.style.setProperty("--my", my.toFixed(3));
    }

    let pointerX = 0;
    let pointerY = 0;

    function schedule() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        write(window.scrollY, pointerX, pointerY);
      });
    }

    function handlePointer(event) {
      const rect = node.getBoundingClientRect();

      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;

      schedule();
    }

    window.addEventListener("scroll", schedule, { passive: true });
    node.addEventListener("pointermove", handlePointer);

    return () => {
      window.removeEventListener("scroll", schedule);
      node.removeEventListener("pointermove", handlePointer);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [ref]);
}
