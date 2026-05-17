# Design System Strategy: The Culinary Curator

This design system is built to transform a simple utility—deciding what to eat—into a high-end, editorial experience. We are moving away from the "generic app" aesthetic of thin lines and flat boxes, moving instead toward a tactile, layered environment that feels as appetizing as a well-plated meal.

## 1. Creative North Star: "The Digital Curator"
The core philosophy is **Organic Editorialism**. We treat the mobile screen like a premium food magazine. We break the rigid, centered grid of standard apps by using intentional asymmetry, overlapping elements (e.g., a dish image breaking the boundary of a card), and a high-contrast typography scale that prioritizes "Display" moments for flavor and "Body" moments for clarity.

## 2. Color & Surface Architecture
The palette is rooted in warmth, designed to trigger appetite and comfort.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define boundaries, you must use background color shifts or tonal transitions.
- Use `surface-container-low` (#f6efeb) sections sitting on a `surface` (#fcf5f1) background. 
- Separation is achieved through white space (`spacing-6` or higher) rather than a 1px line.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
- **Base Layer:** `surface` (#fcf5f1)
- **Secondary Sectioning:** `surface-container` (#eee7e2)
- **Elevated Interactive Elements:** `surface-container-lowest` (#ffffff)
- **Example:** A white card (`surface-container-lowest`) should sit atop a subtle `surface-container-low` background to create a soft, natural lift.

### The "Glass & Gradient" Rule
For floating elements like the "Spin" button or navigation bars, use **Glassmorphism**.
- Apply a semi-transparent `primary-container` (#ff7949) with a 20px backdrop-blur. 
- **Signature Texture:** Apply a subtle linear gradient to main CTAs (from `primary` #a63300 to `primary-container` #ff7949) at a 135° angle. This adds "soul" and depth that a flat hex code cannot provide.

---

## 3. Typography
We use a dual-font system to balance playfulness with editorial authority.

*   **Display & Headline (Plus Jakarta Sans):** These are your "flavor" fonts. Use `display-lg` for big, bold meal names. The rounded nature of the font communicates friendliness, but the tight letter-spacing in larger sizes keeps it feeling premium.
*   **Body & Labels (Be Vietnam Pro):** This is your "functional" font. It provides high legibility for ingredients, cooking times, and instructions.
*   **The Hierarchy Goal:** Create a massive contrast between the meal title (`display-md`) and the metadata (`label-md`). This "Big-Small" relationship is the hallmark of high-end design.

---

## 4. Elevation & Depth
We eschew traditional material shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a perceived lift.
*   **Ambient Shadows:** If a card must "float" (e.g., during a drag-and-drop spin), use an extra-diffused shadow: `box-shadow: 0 24px 48px rgba(166, 51, 0, 0.06);`. Note the tint: we use a low-opacity version of the `primary` color, never pure black/grey.
*   **The "Ghost Border" Fallback:** If a container lacks contrast against its background, use a **Ghost Border**: `outline-variant` (#b2aca9) at 15% opacity. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary:** Uses the "Signature Texture" gradient. Padding: `spacing-3` (top/bottom) and `spacing-6` (sides). Radius: `DEFAULT` (1rem/16px).
*   **Secondary:** `surface-container-high` (#e8e1dc) with `on-surface` (#312e2c) text. No border.
*   **Tertiary:** Ghost style. No background, `primary` (#a63300) text, bold weight.

### Cards (The "Meal Plate")
*   **Construction:** Use `surface-container-lowest` (#ffffff). 
*   **Constraint:** No dividers. Use `spacing-4` (1.4rem) between the header and the description.
*   **Visual Interest:** Allow images to "bleed" to the edges or overlap the card radius slightly to break the container's boxy feel.

### Selection Chips
*   **Unselected:** `surface-container` (#eee7e2) with `on-surface-variant` text.
*   **Selected:** `primary` (#a63300) background with `on-primary` (#ffefeb) text. 
*   **Shape:** Use `rounded-full` for chips to contrast against the `16px` cards.

### The "Spin" Interactive (Custom Component)
*   The randomizer should use `Glassmorphism`. A blur-behind container with a `surface-container-lowest` white core. This makes the "spinning" content feel like it's happening behind a frosted lens, adding a sense of mystery and high-end polish.

---

## 6. Do's and Don'ts

### Do
*   **Use Asymmetry:** Place a "Time to Cook" label in a non-standard corner to create visual interest.
*   **Embrace White Space:** Use the `spacing-8` (2.75rem) token liberally between sections to let the design "breathe."
*   **Color as Information:** Use `secondary` (#a03834) sparingly for nutritional warnings or "Hot" tags.

### Don't
*   **No 1px Lines:** Do not use dividers between list items. Use a 12px vertical gap instead.
*   **No Pure Black:** Never use #000000 for text. Always use `on-background` (#312e2c).
*   **No Rigid Grids:** Avoid making every card the same height. Let the content dictate the height to create a staggered, editorial "masonry" look.