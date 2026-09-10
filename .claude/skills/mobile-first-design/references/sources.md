# Sources

The checklist quotes these documents. Where a threshold is the checklist's own, the
checklist says so next to the item.

| Source | Used for | Where | License |
|---|---|---|---|
| MDN, "Responsive design" (Learn web development, CSS layout) | Viewport meta, mobile-first media queries, fluid layouts, `max-width: 100%` on media, zoomable text, breakpoints in relative units | github.com/mdn/content, `files/en-us/learn_web_development/core/css_layout/responsive_design/index.md` | CC-BY-SA 2.5 |
| W3C, WCAG 2.2 Understanding SC 2.5.8 Target Size (Minimum) | 24 by 24 CSS px minimum, spacing exception, inline exception, reference to 2.5.5 (44 by 44) | github.com/w3c/wcag, `understanding/22/target-size-minimum.html` | W3C Document License |
| Google, web.dev "Learn Responsive Design" (Introduction, Interaction, Typography) | Viewport meta, pointer and hover media queries, larger targets help everyone, line length 45 to 75 characters, relative units for measure, `clamp()`, line height | github.com/GoogleChrome/web.dev, `src/site/content/en/learn/design/*/index.md` | CC-BY 4.0 (content) |
| thedaviddias, Front-End Checklist | Viewport, no zoom disabling, no horizontal scroll, readable font sizes, relative units, touch target size, orientation, `srcset`/`sizes`, lazy loading, correct image size, `<picture>` fallback, performance budgets, device testing, font loading | github.com/thedaviddias/Front-End-Checklist, README | MIT |
| Apple, Human Interface Guidelines, "Designing for iOS" and "Buttons" | Reach (middle and bottom of display), 44 pt buttons, 11 pt minimum text | Installed locally at `.claude/skills/apple-design-skill/references` | Apple (unofficial mirror) |
| Google, Core Web Vitals | LCP 2.5 s and CLS 0.1 thresholds | web.dev/vitals (not fetched; thresholds are widely published) | CC-BY 4.0 |

Fetched on 2026-09-10 through GitHub, because web.dev, developer.mozilla.org and w3.org were
not reachable from the build environment. The GitHub copies are the sources of those sites.

Not used: the GitHub topic page `github.com/topics/mobile-first-design`. It lists code
projects and templates (portfolios, shop clones, CSS frameworks), none of which is a
guideline, so there was nothing there to install.
