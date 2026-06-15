/* =========================================================
   KAFOO RESPONSIVE OVERRIDE
   Force les sections à mieux exploiter les grands écrans
   et corrige les conteneurs trop étroits générés par défaut.
   ========================================================= */

@layer utilities {
  .max-w-7xl {
    max-width: min(94vw, 1680px) !important;
  }

  .max-w-6xl {
    max-width: min(94vw, 1500px) !important;
  }

  .max-w-5xl {
    max-width: min(94vw, 1400px) !important;
  }
}

@layer base {
  html,
  body,
  #root {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 100vh;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
  }

  body {
    background: #f5f7fb;
  }

  main {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  section {
    width: 100% !important;
  }
}

/* Hero plus large et mieux réparti */
@media (min-width: 1024px) {
  main > section:first-child > div {
    max-width: min(94vw, 1680px) !important;
    grid-template-columns: minmax(0, 1.15fr) minmax(420px, 0.85fr) !important;
    gap: 4rem !important;
  }
}

/* Très grands écrans */
@media (min-width: 1440px) {
  main > section:first-child > div {
    max-width: min(92vw, 1760px) !important;
  }

  main > section:first-child h1 {
    font-size: clamp(3.5rem, 4.4vw, 5.8rem) !important;
    line-height: 1.02 !important;
  }
}

/* Tablette */
@media (max-width: 1023px) {
  main > section:first-child > div {
    display: grid !important;
    grid-template-columns: 1fr !important;
    max-width: 92vw !important;
    text-align: center !important;
  }

  main > section:first-child h1,
  main > section:first-child p {
    margin-left: auto !important;
    margin-right: auto !important;
  }
}

/* Mobile */
@media (max-width: 640px) {
  main > section:first-child {
    padding-top: 0 !important;
  }

  main > section:first-child > div {
    max-width: 100% !important;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 2rem !important;
    padding-bottom: 3rem !important;
  }

  main > section:first-child h1 {
    font-size: clamp(2rem, 10vw, 3rem) !important;
    line-height: 1.08 !important;
  }

  main > section:first-child form {
    width: 100% !important;
  }

  .grid {
    min-width: 0 !important;
  }
}
