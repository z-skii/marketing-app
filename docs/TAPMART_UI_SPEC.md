# TapMart UI specification

Reverse engineered from `docs/design-references/tapmart-primary-reference.png`
(the phone screens are drawn at about 388 px wide, so the image pixels map
roughly one to one onto CSS pixels). These values are the single source of
truth and live in `src/app/globals.css` (`@theme` tokens and the primitive
classes) and `src/components/v2/ui.tsx`. Content changes by screen; this
system does not.

## Colour

| Token | Value | Sampled from |
| --- | --- | --- |
| Background (`paper`) | `#12161a` | the canvas behind the rows |
| Chrome (`paper-deep`) | `#0f1418` | the bottom bar |
| Surface 1 (`surface`) | `#1b2124` | rows, cards, the 3D model card |
| Surface 2 (`surface-2`) | `#23282c` | raised controls, secondary buttons |
| Surface 3 (`surface-3`) | `#2b3135` | icon squares, tags |
| Primary text (`ink`) | `#f2f4f5` | the name, row titles |
| Secondary text (`ink-soft`) | `#a6adb3` | "Creator · Car Enthusiast", row subtitles |
| Muted text (`ink-faint`) | `#7f878e` | stat labels, captions, chevrons |
| Signal lime (`signal`) | `#c4f25a` | the button, the dots, the active tab |
| Lime tint | lime at 16% over surface | the "Ready for Ads" pill |
| Border (`rule`) | `#262c30`, used as a hairline only | separators |
| Top edge light | `rgba(255,255,255,0.045)` inset | the light along the top of every row |
| Success (`rise`) | `#7fd48f` (text), lime dot for status | the green wallet square |
| Warning (`warn`) | `#f2c45c` | the rating star, the megaphone |
| Error (`alert`) | `#ff7a70` | not in the reference; kept for errors |

## Radius

| Element | Radius |
| --- | --- |
| Rows | 16px |
| Cards | 18px |
| Buttons | 14px (small buttons and inputs 12px) |
| Icon squares | 12px |
| Pills, tags, status chips | full |
| Sheets | 22px |

## Sizes and spacing

| Measure | Value |
| --- | --- |
| Top bar | 52px, wordmark centred, 24px icons |
| Bottom bar | 64px plus the safe area, 24px icons, 12px labels |
| Mobile horizontal padding | 16px |
| Section gap | 24 to 28px |
| Row | 72px tall, 16px horizontal padding, 44px icon square, 14px gap |
| Gap between rows | 10px |
| Card internal padding | 16px |
| Vehicle card on the profile | about 150px tall, text top left, car right, caption bottom centre |
| Primary button | 48px tall (54px for the one large CTA at the bottom of a screen) |
| Icons | 24px in chrome, 22px in rows, Phosphor regular; fill only for the active tab |
| Chevron | 18px, muted |
| Status dot | 8px lime |
| Avatar on a profile | 96px |

## Typography (Inter)

| Role | Size / weight |
| --- | --- |
| Name on a profile | 26px / 700 |
| Screen title | 22 to 24px / 600 |
| Stat value, money on a row | 20px / 600 |
| Row title, section label | 17px / 600 |
| Body, identity line, status text | 15px / 400 |
| Metadata, stat label | 14px / 400 secondary |
| Caption, tab label | 12px / 500 |
| Money hero on Earnings | 40px / 600 lime |

No uppercase labels, no mono labels, no display headings above 26px inside the app.

## Lime

Primary CTA, active navigation, important money, ready or connected status
dots, the T of the wordmark, the verified check. Nothing else.

## Motion

Rows and cards rise in once (6px, 420ms). Buttons press to 0.99. Hover lift
only on pointer devices. Videos preview muted. Nothing loops.
