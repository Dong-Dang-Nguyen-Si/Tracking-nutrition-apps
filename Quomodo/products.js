// Product knowledge base. Keyed by the YOLO class name from best.pt.
// Add more products here as you train new classes.
window.PRODUCTS = {
  "Celsius energy drink": {
    name: "Celsius Energy Drink",
    short: "Celsius",
    sub: "Celsius Holdings, Inc. · 355 mL can",
    iconText: "C",
    searchTerm: "Celsius energy drink",

    claims: [
      {
        claim: "\"Accelerates metabolism\" and \"burns body fat\"",
        verdict: "mixed", verdictLabel: "Misleading",
        text: "Celsius points to its own clinical studies, which it funded. Back in 2010 the ad watchdog NAD said the fat burn and calorie claims only hold up alongside exercise, and that ads must say so. In Oct 2026 new class actions argued the drink causes no meaningful fat loss without diet and exercise changes. Celsius disputes this.",
        src: "https://www.fooddive.com/news/celsius-class-action-lawsuit-health-washing-claims/873724/", srcLabel: "Food Dive, Nov 2026"
      },
      {
        claim: "\"No preservatives\"",
        verdict: "false", verdictLabel: "Dropped",
        text: "Cans contained citric acid, which plaintiffs argued works as a preservative. Celsius said it is there for flavour, but settled for $7.8M and agreed to remove the \"No Preservatives\" claim.",
        src: "https://www.mediapost.com/publications/article/381094/celsius-energy-drink-brand-agrees-to-pay-78m-for.html", srcLabel: "MediaPost"
      },
      {
        claim: "\"Zero sugar\"",
        verdict: "true", verdictLabel: "True",
        text: "There is no sugar. The sweetness comes from sucralose, an artificial sweetener, so zero sugar does not mean unsweetened.",
        src: null
      },
      {
        claim: "\"Essential energy\" / healthy fitness drink",
        verdict: "mixed", verdictLabel: "Needs context",
        text: "It does have added B vitamins and vitamin C, but it is a high caffeine drink. US cans have 200 mg (about two cups of coffee). Canadian cans are reformulated to stay under Health Canada's energy drink caffeine cap, so check your label. Not recommended for children, pregnant people or anyone sensitive to caffeine.",
        src: null
      }
    ],

    lawsuits: [
      {
        title: "Class actions over \"burns body fat\" marketing",
        when: "Filed Oct 2026 · Pending (N.D. Illinois and W.D. Washington)",
        badge: "info", badgeLabel: "Pending",
        text: "Say Celsius health-washes its drinks and powders with company-funded research.",
        src: "https://www.fooddive.com/news/celsius-class-action-lawsuit-health-washing-claims/873724/"
      },
      {
        title: "\"No preservatives\" class action",
        when: "Settled 2022 · $7.8M",
        badge: "false", badgeLabel: "Settled",
        text: "Combined California and New York cases over citric acid. Celsius paid and changed its labels without admitting wrongdoing.",
        src: "https://www.mediapost.com/publications/article/381094/celsius-energy-drink-brand-agrees-to-pay-78m-for.html"
      },
      {
        title: "Flo Rida breach of contract",
        when: "Jury verdict Jan 2023 · $82.6M, reduced on appeal Dec 2024",
        badge: "mixed", badgeLabel: "Lost",
        text: "Jury found Celsius broke its endorsement deal with the rapper. The appeals court agreed it was a breach but ordered damages recalculated, which could cut them by up to half.",
        src: "https://news.bloomberglaw.com/litigation/celsius-bests-flo-rida-in-ruling-reducing-82-6-million-verdict"
      },
      {
        title: "SEC accounting charges",
        when: "Settled 2025 · $3M",
        badge: "false", badgeLabel: "Settled",
        text: "The SEC said Celsius misaccounted for stock-based compensation. Celsius settled.",
        src: "https://law360.com/articles/2286004"
      }
    ],

    recalls: [
      {
        title: "Vodka seltzer packed in Celsius cans",
        when: "July 2025 · FDA recall notice",
        badge: "false", badgeLabel: "Recall",
        text: "A can supplier error meant High Noon vodka seltzer (4.5% alcohol) went out in cans printed as Celsius Astro Vibe Sparkling Blue Razz. Sold in FL, NY, OH, SC, VA and WI. No illnesses reported.",
        src: "https://www.wmbfnews.com/2025/07/30/recall-issued-after-some-celsius-energy-drinks-were-inadvertently-filled-with-high-noon-vodka-seltzer/"
      }
    ],

    shrinkflation: {
      title: "Shrinkflation check",
      when: "No verified reports found",
      badge: "true", badgeLabel: "Clear",
      text: "The standard can is still 12 fl oz (355 mL). We found no credible reports of Celsius shrinking can size while keeping the price."
    },

    // Company tree. "scanned" marks the product the user just scanned.
    tree: {
      n: "Celsius Holdings, Inc.", r: "Public company (NASDAQ: CELH) · Boca Raton, Florida", root: true,
      children: [
        { n: "CELSIUS", r: "Sparkling, Essentials, Hydration powders", scanned: true },
        { n: "Alani Nu", r: "Energy drinks · acquired Apr 2025 for $1.8B" },
        { n: "Rockstar Energy", r: "US & Canada rights · bought from PepsiCo, 2025" },
        { n: "Func Food", r: "Nordic distributor and brand owner" }
      ]
    },
    stakeholders: [
      { n: "PepsiCo, Inc.", r: "Owns about 11% · main distributor in US & Canada · holds board seats. $550M invested in 2022, $585M more in 2025." }
    ],
    treeSrc: "https://www.foodnavigator.com/Article/2025/09/03/celsius-buys-rockstar-energy-drink-from-pepsico/"
  }
};
