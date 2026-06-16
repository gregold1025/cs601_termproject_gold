import { useEffect, useState } from "react";
import "./HamburgerMenu.css";

// Top-right toggle that opens a slide-in nav panel.
export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`hamburger-menu__toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hamburger-menu__bar" />
        <span className="hamburger-menu__bar" />
        <span className="hamburger-menu__bar" />
      </button>

      {open && (
        <div
          className="hamburger-menu__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        id="site-menu"
        className={`hamburger-menu__panel${open ? " is-open" : ""}`}
        aria-label="Site navigation"
        aria-hidden={!open}
        // `inert` removes the panel from focus order when closed so
        // keyboard Tab can't land on the off-screen links. React 19
        // supports `inert` as a known boolean attribute.
        inert={!open}
      >
        <div className="hamburger-menu__brand" aria-hidden="true">
          <img
            className="hamburger-menu__brand-logo"
            src="/ug-logo-white.png"
            alt=""
          />
          <span className="hamburger-menu__brand-wordmark">
            <span>U</span>
            <span className="hamburger-menu__brand-letter--orange">G</span>
            <span>Playground</span>
          </span>
        </div>
        <ul className="hamburger-menu__links">
          <li>
            <a
              href="/about.html"
              className="hamburger-menu__link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              About ↗
            </a>
          </li>
          <li>
            <a
              href="/documentation.html"
              className="hamburger-menu__link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              Documentation ↗
            </a>
          </li>
        </ul>
        <div className="hamburger-menu__footer">
          &copy; Urban Griots Collaborative 2026
        </div>
      </nav>
    </>
  );
}
