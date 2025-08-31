/* GSAP image "scrub" via mouse + scroll scale sections */
(() => {
  const hero = document.getElementById("hero");
  const img  = document.getElementById("heroImage");
  const bar  = document.getElementById("progressBar");

  // Build a timeline that we "scrub" with mouse position (0 -> 1)
  // We animate background X pan, subtle scale/rotate, and a slight filter change.
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

  tl.fromTo(img,
    {
      backgroundPositionX: "0%",
      scale: 1.0,
      rotate: -1.2,
      filter: "brightness(0.92) saturate(1.0)"
    },
    {
      backgroundPositionX: "100%",
      scale: 1.08,
      rotate: 1.2,
      filter: "brightness(1.02) saturate(1.15)"
    }
  );

  // Update progress bar
  const setProgress = (p) => {
    const clamped = Math.max(0, Math.min(1, p));
    tl.progress(clamped);
    bar.style.width = (clamped * 100).toFixed(3) + "%";
  };

  // Mouse & touch -> progress
  const handlePoint = (clientX) => {
    const rect = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setProgress(x / rect.width);
  };

  hero.addEventListener("mousemove", (e) => handlePoint(e.clientX));
  hero.addEventListener("pointerdown", (e) => handlePoint(e.clientX));
  hero.addEventListener("touchmove", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    handlePoint(t.clientX);
  }, { passive: true });

  // Initialize at center (so it isn't stuck at 0%)
  setProgress(0.5);

  // ---- ScrollScale sections ----
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray("[data-scale] .feature__inner").forEach((el, i) => {
    const startScale = 0.94 + i * 0.01;
    const endScale   = 1.03 + i * 0.02;

    gsap.fromTo(el,
      { scale: startScale, opacity: 0, y: 18 },
      {
        scale: endScale, opacity: 1, y: 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 78%",
          end: "top 20%",
          scrub: true,
          fastScrollEnd: true
        }
      }
    );
  });
})();