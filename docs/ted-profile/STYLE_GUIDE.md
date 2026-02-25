# Style Guide: Grounded Sophistication

## Core Philosophy

This design system embodies **calm productivity**—the feeling of a clean workspace, clear priorities, and focused work. It rejects the noise of modern software in favor of functional restraint.

**One-line ethos:** Tools should feel like trusted companions, not demanding masters.

### Guiding Principles

1. **Restraint over abundance** — Every element earns its place. When in doubt, remove.
2. **Clarity over decoration** — Color has meaning. Blue means action. Green means done. Nothing is decorative.
3. **Timelessness over trends** — Design choices that age gracefully. Nothing that screams "2024."
4. **Quiet confidence** — No need to impress. The design simply is what it is.
5. **Respect for attention** — Never compete for the user's focus. Support their work, then disappear.
6. **Content over chrome** — Let the work breathe. Avoid boxing everything in containers.

### Emotional Targets

When users open this app, they should feel:

- Calm
- Capable
- Focused
- Unhurried

They should NOT feel:

- Overwhelmed
- Entertained
- Pressured
- Surveilled

---

## Critical: Avoid the Container Trap

**This is the most common mistake when implementing this design system.**

Modern UI toolkits make it easy to wrap everything in cards with borders and backgrounds. Resist this urge. The result is visual noise—a grid of boxes that feels like a dashboard, not a workspace.

### The Problem

❌ **Container-heavy design creates:**

- Visual clutter from repeated borders
- A "dashboard" or "admin panel" feel
- Competition for attention between boxes
- Loss of the calm, open feeling we're after

### The Solution

✅ **Use whitespace and typography to create hierarchy, not boxes.**

Think of a well-designed book or magazine. Content is organized through spacing, headings, and alignment—not by putting every paragraph in a bordered rectangle.

### When to Use Containers

Containers (bordered cards/boxes) should be **rare and purposeful**:

| Use a container when...                                | Don't use a container when... |
| ------------------------------------------------------ | ----------------------------- |
| The element is interactive (clickable card, input)     | Displaying a list of items    |
| You need to group controls that act together           | Showing statistics or metrics |
| The content is a distinct "object" (a project, a task) | Organizing sidebar navigation |
| Elevation/focus is semantically meaningful             | Wrapping sections of content  |

### Alternative Patterns

Instead of containers, use:

1. **Whitespace** — Generous margins between groups
2. **Typography weight** — Bold headings to introduce sections
3. **Subtle dividers** — A single 1px line, not a full box
4. **Background color shifts** — Slight tint change (Parchment → Linen) for regions
5. **Indentation** — Nest related content under headings

### Visual Example: Lists

```
❌ DON'T: Each item in a bordered card

┌─────────────────────┐
│ Task 1              │
│ Due tomorrow        │
└─────────────────────┘
┌─────────────────────┐
│ Task 2              │
│ Due next week       │
└─────────────────────┘

✅ DO: Clean list with spacing

Task 1
Due tomorrow

Task 2
Due next week
```

### Visual Example: Sidebar

```
❌ DON'T: Sidebar wrapped in a container, sections in sub-containers

┌──────────────────┐
│ ┌──────────────┐ │
│ │ Navigation   │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Today Stats  │ │
│ └──────────────┘ │
└──────────────────┘

✅ DO: Open sidebar with whitespace separation

Navigation
─────────
Home
Projects
Tasks

Today
─────────
3 active · 2 due
```

### Implementation Rule

**Before adding a border or background to any element, ask: "Can whitespace and typography do this job instead?" If yes, don't add the container.**

---

## Color System

### Philosophy

Colors have jobs. Blue means "action." Green means "done." Red means "attention." Everything else stays neutral. This isn't decoration—it's communication.

### Primary Accent

| Role             | Name      | Hex       | RGB                | Usage                                              |
| ---------------- | --------- | --------- | ------------------ | -------------------------------------------------- |
| **Accent**       | Blue      | `#4385BE` | rgb(67, 133, 190)  | Buttons, active nav, links, progress, focus states |
| **Accent Hover** | Deep Blue | `#3A75A8` | rgb(58, 117, 168)  | Hover states                                       |
| **Accent Light** | Sky       | `#E8F1F8` | rgb(232, 241, 248) | Selection backgrounds, subtle highlights           |

### Semantic Colors

| Role              | Name  | Hex       | RGB                | Usage                                              |
| ----------------- | ----- | --------- | ------------------ | -------------------------------------------------- |
| **Success**       | Green | `#7A8B3D` | rgb(122, 139, 61)  | Completed tasks, success states, "done" indicators |
| **Success Light** | Sage  | `#EEF2E5` | rgb(238, 242, 229) | Success backgrounds                                |
| **Warning**       | Amber | `#C9A035` | rgb(201, 160, 53)  | Cautions, approaching deadlines                    |
| **Warning Light** | Cream | `#FBF6E9` | rgb(251, 246, 233) | Warning backgrounds                                |
| **Error**         | Red   | `#C45C5C` | rgb(196, 92, 92)   | At risk, errors, destructive actions               |
| **Error Light**   | Blush | `#FAEAEA` | rgb(250, 234, 234) | Error backgrounds                                  |

### Neutrals

| Role               | Name     | Hex       | RGB                | Usage                                        |
| ------------------ | -------- | --------- | ------------------ | -------------------------------------------- |
| **Background**     | White    | `#FFFFFF` | rgb(255, 255, 255) | Primary background                           |
| **Surface**        | Gray 50  | `#F9F9F9` | rgb(249, 249, 249) | Subtle surface differentiation, hover states |
| **Border**         | Gray 200 | `#E5E5E5` | rgb(229, 229, 229) | Dividers, borders, separators                |
| **Border Dark**    | Gray 300 | `#D4D4D4` | rgb(212, 212, 212) | Emphasized borders, input borders            |
| **Text Primary**   | Gray 900 | `#1A1A1A` | rgb(26, 26, 26)    | Headings, body text                          |
| **Text Secondary** | Gray 500 | `#737373` | rgb(115, 115, 115) | Secondary text, labels, metadata             |
| **Text Tertiary**  | Gray 400 | `#A3A3A3` | rgb(163, 163, 163) | Placeholders, hints, disabled text           |

### Color Logic

| When you see... | It means...                                                     |
| --------------- | --------------------------------------------------------------- |
| Blue            | "Take action" — click this, this is active, this is interactive |
| Green           | "Complete" — this is done, this succeeded, check                |
| Red             | "Attention" — at risk, error, be careful                        |
| Amber           | "Heads up" — deadline approaching, caution                      |
| Gray            | "Information" — neutral, no special meaning                     |

### Color Usage Rules

- **Blue is for action.** Buttons, links, active states, progress indicators. If it's clickable or active, it's blue.
- **Green is earned.** It only appears when something is complete or successful. Not for decoration.
- **Red demands attention.** Use sparingly. "At risk" badges, errors, destructive confirmations.
- **Backgrounds are pure white.** Clean, simple, no warm tinting.
- **Text is near-black.** `#1A1A1A` for comfortable reading without harsh pure black.
- **One accent per element.** Don't combine blue and green on the same component.

---

## Typography

### Font Stack

**Primary:** Inter, system-ui, -apple-system, sans-serif **Monospace:** JetBrains Mono, SF Mono, Consolas, monospace

_Alternative options: IBM Plex Sans, Source Sans Pro, or native system fonts for performance._

### Type Scale

| Name           | Size             | Weight | Line Height | Letter Spacing | Usage                        |
| -------------- | ---------------- | ------ | ----------- | -------------- | ---------------------------- |
| **Display**    | 32px / 2rem      | 600    | 1.2         | 0              | Page titles, hero text       |
| **Heading 1**  | 24px / 1.5rem    | 600    | 1.3         | 0              | Section headers              |
| **Heading 2**  | 20px / 1.25rem   | 600    | 1.35        | 0              | Subsection headers           |
| **Heading 3**  | 16px / 1rem      | 600    | 1.4         | 0              | Card titles, labels          |
| **Body**       | 15px / 0.9375rem | 400    | 1.6         | 0              | Primary reading text         |
| **Body Small** | 14px / 0.875rem  | 400    | 1.5         | 0              | Secondary text, UI labels    |
| **Caption**    | 12px / 0.75rem   | 400    | 1.4         | 0              | Timestamps, hints, metadata  |
| **Mono**       | 14px / 0.875rem  | 400    | 1.5         | 0              | Code, IDs, technical content |

### Typography Rules

- **Headings use semibold (600), never bold (700).** Quieter emphasis.
- **Body text is 15px, not 14px or 16px.** Slightly larger for comfortable reading.
- **Line height is generous.** Text breathes. Minimum 1.5 for body text.
- **Letter spacing is normal everywhere.** Use default spacing for headings, body, labels, and metadata.
- **Avoid custom tracking/kerning overrides in UI classes unless explicitly approved as an exception.**
- **Avoid ALL CAPS except for very small labels.** It shouts.

---

## Spacing System

### Base Unit: 4px

All spacing derives from a 4px base unit.

| Token      | Value | Usage                             |
| ---------- | ----- | --------------------------------- |
| `space-1`  | 4px   | Tight gaps, inline spacing        |
| `space-2`  | 8px   | Related elements, icon-to-text    |
| `space-3`  | 12px  | Standard padding, compact layouts |
| `space-4`  | 16px  | Default component padding         |
| `space-5`  | 20px  | Medium gaps                       |
| `space-6`  | 24px  | Section padding                   |
| `space-8`  | 32px  | Large gaps, section breaks        |
| `space-10` | 40px  | Major section divisions           |
| `space-12` | 48px  | Page-level spacing                |
| `space-16` | 64px  | Hero spacing, major breaks        |

### Spacing Philosophy

- **Generous, but not wasteful.** Elements need room to breathe.
- **Consistent rhythm.** Stick to the scale. Don't invent values.
- **Proximity indicates relationship.** Related items are closer together.
- **Margins increase with hierarchy.** More space around more important elements.

---

## Layout

### Container Widths

| Name        | Max Width | Usage                                 |
| ----------- | --------- | ------------------------------------- |
| **Narrow**  | 640px     | Reading content, forms, focused tasks |
| **Default** | 800px     | Standard content areas                |
| **Wide**    | 1024px    | Dashboards, complex layouts           |
| **Full**    | 100%      | Edge-to-edge when needed              |

### Grid

- 12-column grid for complex layouts
- Single-column for reading/focused content
- Gutters: 24px (desktop), 16px (mobile)

### Layout Principles

- **Center the content, not the chrome.** Sidebars can extend, but content stays readable width.
- **Narrow is often better.** 65-75 characters per line for reading comfort.
- **Whitespace is a feature.** Empty space creates calm.
- **Asymmetry is acceptable.** Not everything needs to be centered.

---

## Components

### Buttons

**Button Philosophy**

Buttons should be quiet until they matter. The default state is subtle; prominence is earned by importance.

Most actions should use ghost or secondary buttons. Reserve filled buttons for truly critical moments (confirming a destructive action, completing a purchase, submitting a form).

For dense UI (toolbars, table rows, compact action areas), prefer **icon buttons** over **text-only buttons** when the meaning is clear. Icon buttons must have tooltips and accessible labels. Use text when clarity matters (primary actions, uncommon actions, or when multiple actions would be confusing as icons).

---

**Primary Button (Use Sparingly)**

_Only for critical actions: final confirmations, primary form submissions_

- Background: Blue (`#4385BE`)
- Text: White (`#FFFFFF`)
- Padding: 10px 16px
- Border radius: 6px
- Font: 14px, weight 500
- Hover: Deep Blue (`#3A75A8`)
- Transition: 150ms ease

---

**Default Button (Most Common)**

_The workhorse. Use for standard actions: "New project", "Add task", "Save"_

- Background: Transparent
- Border: 1px solid Gray 300 (`#D4D4D4`)
- Text: Gray 900 (`#1A1A1A`)
- Padding: 10px 16px
- Border radius: 6px
- Font: 14px, weight 500
- Hover: Background Gray 50 (`#F9F9F9`), Border darkens slightly

---

**Ghost Button**

_For tertiary actions, navigation, less important options_

- Background: Transparent
- Border: None
- Text: Gray 500 (`#737373`)
- Padding: 8px 12px
- Hover: Text Gray 900 (`#1A1A1A`), subtle background tint

---

**Text Link Button**

_Inline actions that feel like links_

- Background: None
- Border: None
- Text: Blue (`#4385BE`)
- Padding: 4px 0
- Hover: Underline, Deep Blue (`#3A75A8`)

---

**Destructive Button**

_For dangerous/irreversible actions_

- Background: Red (`#C45C5C`)
- Text: White (`#FFFFFF`)
- Padding: 10px 16px
- Hover: Darker red (`#B04A4A`)

---

**Button Hierarchy in Practice**

```
Page with a form:
- [Cancel] ← Ghost button
- [Save draft] ← Default button
- [Submit] ← Primary button (only for final submission)

Header/toolbar actions:
- [+ New project] ← Default button (outline, NOT filled blue)
- [Search] ← Default button (outline)
- [Filter] ← Default button (outline) or ghost
- [Settings] ← Icon button (ghost)

Destructive confirmation modal:
- [Keep it] ← Default button
- [Delete permanently] ← Destructive button (red)
```

**Button Sizing**

Buttons should feel light, not chunky:

- Height: 36px for standard buttons, 32px for compact/toolbar contexts
- Padding: 8px 14px (standard), 6px 12px (compact)
- Touch target: Maintain 44px clickable area even if visual is smaller (use padding/margin)
- Font: 13px-14px, weight 500

**Button Rules**

- Buttons are quiet. No shadows, no gradients.
- **"New [thing]" buttons are Default (outline), not Primary (filled).**
- Primary (filled blue) is reserved for final confirmations only.
- Red buttons only for destructive confirmations.
- Prefer icon buttons (with tooltips) for compact/toolbar actions; avoid text-only buttons in cramped spaces when an icon can communicate clearly.
- Icon-only buttons are borderless (ghost): use a subtle hover background and a clear focus ring.
- Icon-only buttons need tooltips and 44px minimum touch target.

### Dialogs & Confirmations (No Browser Popups)

**Never use browser-native dialogs** (`window.alert`, `window.confirm`, `window.prompt`). They are inconsistent, block the UI thread, can’t be styled/accessibility-tuned to our system, and break the “calm productivity” feel.

**Rule:** All confirmations, warnings, and prompts must be rendered as **in-app UI dialogs** (modal/dialog/sheet) using our component system (e.g., shadcn/ui `Dialog` / `AlertDialog` patterns).

**Guidelines**

- Use an in-app dialog for destructive/irreversible actions (matches the “Destructive confirmation modal” button hierarchy above).
- Keep copy short and specific: title = what’s happening; body = what will be lost/changed.
- Default focus should be safe (Cancel/Close). Use filled blue only for final confirmations; use red only for destructive confirms.

### Cards (Use Sparingly)

**Remember: Cards are not the default. See "Avoid the Container Trap" above.**

When a container IS appropriate (interactive clickable items, distinct objects):

- Background: White (`#FFFFFF`) or transparent
- Border: 1px solid Stone (`#E8E6E1`) — or NO border if grouping is clear from context
- Border radius: 6px
- Padding: 16px
- Shadow: None by default
- Hover (if interactive): Subtle shadow `0 2px 8px rgba(44, 44, 43, 0.06)`, or border darkens

**Card Alternatives**

Often you don't need a card at all:

| Instead of...           | Try...                           |
| ----------------------- | -------------------------------- |
| Card for each list item | Simple rows with hover highlight |
| Card for a stat         | Just the number with a label     |
| Card wrapping a section | A heading + whitespace           |
| Card in sidebar         | Nothing—let content stand alone  |

### Inputs

- Background: White (`#FFFFFF`)
- Border: 1px solid Gray 300 (`#D4D4D4`)
- Border radius: 6px
- Padding: 10px 12px
- Font size: 15px
- Focus: Border Blue (`#4385BE`), subtle shadow `0 0 0 3px rgba(67, 133, 190, 0.1)`
- Placeholder: Gray 400 (`#A3A3A3`)

### Dropdowns

All dropdown controls should use the same collapsed visual language as the Assistant thread picker.

- Default height (single-line items): 40px
- Taller height (only when subtext is shown): 48px (`h-12`)
- Background: White (`#FFFFFF`)
- Border: None by default
- Border radius: 12px (`rounded-xl`)
- Text: 13px, medium weight, Gray 900 (`#1A1A1A`)
- Secondary metadata text: Gray 500 (`#737373`) only when explicitly needed
- Chevron: right-aligned, subtle gray
- Hover: Gray 50 (`#FAFAFA`)
- Focus: Blue ring (`#4385BE`) with soft outer glow
- Disabled: reduced opacity + not-allowed cursor
- Menu items should use the same calm row treatment as the Assistant thread picker (clean rows, subtle selected background, no decorative styling)
- Do not add subtext to dropdown items unless it provides real context value
- Multi-select dropdown rows should use the same item styling as single-select rows (same rounded row shape, selected-state background, right-side checkmark)
- For long option lists (for example Solution pickers), include a search field at the top of the menu
- Search fields in dropdown menus should use the same neutral input treatment (`#FAFAFA` background, rounded corners, blue focus ring)

Implementation note:

- Use the shared `ArtifactSelect` component for dropdowns so menu rows match the Assistant model/thread selector style.
- Enable `searchable` for high-volume selects (solutions, long user lists, etc.) so users can filter options quickly.
- Use the `rich` density only for dropdowns that intentionally render item subtext.
- Do not introduce one-off select styles unless a control has a clear, documented exception.

### Task Checkboxes — Use Circles

**Task checkboxes are circles, not squares.** This is intentional—circles feel softer and more inviting. See Things 3, Todoist, and Linear for reference.

**Unchecked state:**

- Shape: Circle (border-radius: 50%)
- Size: 18-20px diameter
- Border: 1.5px solid Gray 300 (`#D4D4D4`)
- Fill: Transparent
- Hover: Border turns Blue (`#4385BE`)

**Checked state:**

- Fill: Green (`#7A8B3D`)
- Border: Green (`#7A8B3D`)
- Icon: White checkmark, centered
- Transition: 150ms ease

```css
/* Task checkbox - CIRCLE */
.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 50%; /* Circle, not square */
  border: 1.5px solid #d4d4d4;
  background: transparent;
  transition: all 150ms ease;
}

.task-checkbox:hover {
  border-color: #4385be;
}

.task-checkbox[data-checked="true"] {
  background: #7a8b3d;
  border-color: #7a8b3d;
}
```

### Form Checkboxes — Use Rounded Squares

For settings panels, filters, and form fields (not task lists), use small rounded squares:

- Shape: Rounded square (border-radius: 3px)
- Size: 16px
- Same color behavior as task checkboxes

### Toggles

- Track: Gray 200 (`#E5E5E5`) when off, Blue (`#4385BE`) when on
- Knob: White with subtle shadow
- Size: 20px height, 36px width
- Border radius: Full (pill shape)
- Transition: 150ms ease

### Progress Bars

- Track: Gray 200 (`#E5E5E5`)
- Fill: Blue (`#4385BE`) — blue because progress = active work
- Height: 4px
- Border radius: 2px

---

## Iconography

### Style

- **Stroke-based, not filled.** Light, airy, minimal.
- **1.5px or 2px stroke weight.** Consistent across all icons.
- **Rounded caps and joins.** Softer feel.
- **24px default size.** Scale to 16px, 20px, or 32px as needed.

### Recommended Icon Sets

- Lucide (primary recommendation)
- Heroicons (outline variant)
- Phosphor (light weight)
- Feather Icons

### Icon Rules

- Icons are secondary to text. They support, not replace.
- Maintain consistent stroke weight across all icons.
- Icon color matches text hierarchy (primary, secondary, tertiary).
- Interactive icons get hover state (color shift to Blue).

---

## Motion & Animation

### Timing

| Name        | Duration | Easing      | Usage                                |
| ----------- | -------- | ----------- | ------------------------------------ |
| **Instant** | 0ms      | —           | State changes with no transition     |
| **Fast**    | 100ms    | ease-out    | Micro-interactions, hovers           |
| **Default** | 150ms    | ease-out    | Button presses, toggles              |
| **Medium**  | 250ms    | ease-in-out | Panels, modals appearing             |
| **Slow**    | 350ms    | ease-in-out | Page transitions, complex animations |

### Animation Principles

- **Subtle over dramatic.** Animation serves function, not entertainment.
- **Fast feedback.** Interactive elements respond immediately.
- **No bouncing, no elastic effects.** Mature, restrained motion.
- **Reduce motion for accessibility.** Respect `prefers-reduced-motion`.

### Specific Animations

- **Hover:** Color transition, 100ms
- **Focus:** Border/shadow transition, 150ms
- **Modal/Panel:** Fade + subtle scale (0.98 → 1), 250ms
- **Page transition:** Fade, 200ms
- **Loading:** Subtle pulse or gentle spinner, never aggressive

---

## Shadows & Depth

### Shadow Scale

| Level      | Value                            | Usage                               |
| ---------- | -------------------------------- | ----------------------------------- |
| **None**   | —                                | Default state for most elements     |
| **Subtle** | `0 1px 3px rgba(0, 0, 0, 0.04)`  | Slight lift, hover states           |
| **Low**    | `0 2px 8px rgba(0, 0, 0, 0.06)`  | Cards, dropdowns                    |
| **Medium** | `0 4px 16px rgba(0, 0, 0, 0.08)` | Modals, popovers                    |
| **High**   | `0 8px 32px rgba(0, 0, 0, 0.12)` | Floating panels, important overlays |

### Shadow Philosophy

- **Shadows are rare.** Flat design with selective depth.
- **Warm shadows only.** Never pure black.
- **Elevation = importance.** Higher shadows for more critical UI.
- **Prefer borders over shadows when possible.** Cleaner, lighter.

---

## Imagery & Illustration

### Photography Style (if used)

- Natural lighting, soft and diffused
- Muted, desaturated color grading
- Subject matter: workspaces, nature, books, hands working
- Avoid: stock photo energy, forced smiles, blue-tinted tech aesthetic
- Inspiration: Kinfolk magazine, Cereal magazine

### Illustration Style (if used)

- Line-based, minimal fills
- Single accent color (Olive) plus neutrals
- Organic shapes over geometric
- Hand-drawn quality, slight imperfection is acceptable
- Avoid: gradients, 3D effects, isometric tech illustrations

### Empty States

- Gentle, minimal illustrations
- Supportive messaging, never scolding
- Example: A simple line drawing of a notebook with text "Nothing here yet"

---

## Voice & Tone

### Writing Principles

- **Clear over clever.** Say what you mean.
- **Brief over verbose.** Respect attention.
- **Warm over formal.** Human, not corporate.
- **Confident over apologetic.** No "Oops!" or "Sorry!"
- **Active over passive.** "Save changes" not "Changes will be saved"

### UI Copy Examples

| Context      | ❌ Avoid                                             | ✅ Prefer                        |
| ------------ | ---------------------------------------------------- | -------------------------------- |
| Empty state  | "Oops! Looks like you haven't created anything yet!" | "No items yet"                   |
| Success      | "Awesome! You did it!"                               | "Saved"                          |
| Error        | "Something went wrong :("                            | "Couldn't save. Try again."      |
| Loading      | "Hang tight, we're working on it!"                   | "Loading..." or simply a spinner |
| Confirmation | "Are you super sure you want to delete this?"        | "Delete this item?"              |

### Punctuation & Formatting

- Sentence case for headings, not Title Case
- No periods on single-sentence labels or buttons
- No exclamation points (rare exceptions for genuine celebration)
- Use numerals (1, 2, 3) not words (one, two, three)

---

## Accessibility

### Requirements

- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus states:** Visible on all interactive elements
- **Touch targets:** Minimum 44px × 44px
- **Motion:** Respect `prefers-reduced-motion`
- **Screen readers:** Proper semantic HTML, ARIA labels where needed

### Inclusive Design Principles

- Don't rely on color alone to convey meaning
- Provide text alternatives for icons
- Ensure keyboard navigation works throughout
- Test with actual assistive technologies

---

## Dark Mode (Optional)

If implementing dark mode:

| Role            | Light Mode | Dark Mode                     |
| --------------- | ---------- | ----------------------------- |
| Background      | `#FFFFFF`  | `#1A1A1A`                     |
| Surface         | `#F9F9F9`  | `#262626`                     |
| Border          | `#E5E5E5`  | `#3A3A3A`                     |
| Text Primary    | `#1A1A1A`  | `#F5F5F5`                     |
| Text Secondary  | `#737373`  | `#A3A3A3`                     |
| Accent (Blue)   | `#4385BE`  | `#5A9BD4` (slightly brighter) |
| Success (Green) | `#7A8B3D`  | `#9AAB5D` (slightly brighter) |

**Dark mode principles:**

- True dark grays, not blue-tinted
- Reduce contrast slightly (not pure white on pure black)
- Accent colors may need brightness adjustment for visibility

---

## Reference Touchstones

### Apps to Study

- **Linear** — Clean, fast, excellent use of blue for action states. Circle checkboxes. The gold standard for this aesthetic.
- **Things 3** — Circle checkboxes, warmth, craft, tactile delight. Study their checkbox interaction.
- **Todoist** — Circle checkboxes, clean task lists
- **iA Writer** — Container-free design. Pure typography and whitespace.
- **Notion** (sidebar only) — Clean navigation patterns
- **Superhuman** — Speed, keyboard-first, clean density

### What to Learn From Each

| App       | Take This                                  | Leave This              |
| --------- | ------------------------------------------ | ----------------------- |
| Linear    | Blue accent, circle checkboxes, speed      | Can feel too dense      |
| Things 3  | Circle checkboxes, completion animations   | Card-heavy project view |
| Todoist   | Circle checkboxes, list styling            | Can feel cluttered      |
| iA Writer | Typography-driven hierarchy, no containers | —                       |
| Notion    | Flexibility patterns                       | Visual complexity       |

### Physical Objects

- A clean white notebook with quality paper
- Muji stationery
- Dieter Rams designs for Braun
- A minimal desk with good light
- Apple product packaging

### Spaces

- A bright, minimal home office
- A well-lit coworking space with clean desks
- A quiet coffee shop with white walls
- Apple Store interior

### Publications

- Kinfolk magazine
- Cereal magazine
- The New York Times (typography)
- Monocle (editorial design)

---

## Do's and Don'ts

### Do

- ✅ Leave generous whitespace
- ✅ Use color meaningfully (blue = action, green = done, red = attention)
- ✅ Trust typography to create hierarchy
- ✅ Make interactions feel instant and responsive
- ✅ Write concise, clear UI copy
- ✅ Test on real devices and with real users
- ✅ When in doubt, simplify
- ✅ Use whitespace to separate content, not boxes
- ✅ Let lists breathe without wrapping each item
- ✅ **Use circles for task checkboxes (not squares)**
- ✅ **Keep buttons light and refined (36px height, not chunky)**

### Don't

- ❌ Add elements "just in case"
- ❌ Use color decoratively (every color should mean something)
- ❌ Add shadows or depth unnecessarily
- ❌ Use exclamation points or emoji in UI copy
- ❌ Animate things for the sake of animation
- ❌ Sacrifice clarity for cleverness
- ❌ Copy trends without understanding them
- ❌ **Wrap everything in bordered containers/cards**
- ❌ **Put boxes inside boxes (nested containers)**
- ❌ **Add borders just because "it looks more designed"**
- ❌ **Use green for anything except completion/success**
- ❌ **Use filled blue buttons for routine actions like "New project"**
- ❌ **Make buttons too tall or chunky (no 44px+ button heights)**
- ❌ **Use square checkboxes for task lists**

---

## Implementation Checklist

When building a new screen or component, verify:

- [ ] Colors are from the defined palette
- [ ] Color usage follows meaning: blue=action, green=done, red=attention
- [ ] Typography follows the scale
- [ ] Spacing uses the 4px grid
- [ ] Interactive elements have visible focus states (blue)
- [ ] Copy is concise and follows voice guidelines
- [ ] Animations are subtle and respect reduced motion
- [ ] Component works at mobile and desktop sizes
- [ ] Contrast ratios meet accessibility requirements
- [ ] **No unnecessary containers/cards—whitespace creates hierarchy**
- [ ] **Task checkboxes are circles (border-radius: 50%), not squares**
- [ ] **Checkboxes turn green when checked (completion state)**
- [ ] **"New project" and similar actions use outline buttons, not filled blue**
- [ ] **Buttons are 36px height or less (not chunky)**
- [ ] **No nested containers (boxes inside boxes)**

---

## Prompt for AI Image Generators

Use this prompt as a starting point for generating UI mockups:

```
A minimal, clean UI design for a productivity app. Pure white background, blue accent color (#4385BE) for buttons, links, active states, and progress. Green (#7A8B3D) only for checkmarks and completion states. Clean sans-serif typography, generous whitespace. NO bordered cards or containers around content sections—use whitespace and typography to create hierarchy instead. Aesthetic inspired by Linear and iA Writer. Feels like a well-organized document, not a dashboard. Calm, intellectual, timeless, quietly confident. No gradients, no 3D effects. Let content breathe.
```

---

## Prompt for Coding Agents

When implementing this design system:

```
Follow these design principles:

1. COLOR SYSTEM:
   - Background: Pure white (#FFFFFF)
   - Text: Near-black (#1A1A1A) for primary, gray (#737373) for secondary
   - Blue (#4385BE): Action color — links, active nav, progress bars, focus states
   - Green (#7A8B3D): Completion color — checked boxes, success states, "done" indicators
   - Red (#C45C5C): Attention color — errors, "at risk" badges, destructive actions
   - Borders: Light gray (#E5E5E5)

2. TYPOGRAPHY: Use Inter or system fonts. Body text 15px with 1.6 line height. Headings use semibold (600), never bold.

3. SPACING: All spacing based on 4px grid. Be generous with whitespace. Use whitespace to separate sections—NOT borders or containers.

4. CRITICAL - AVOID CONTAINERS: Do NOT wrap content sections in bordered cards or boxes. Use whitespace and typography to create hierarchy. Lists should be simple rows, not cards. Sidebars should be open, not boxed.

5. BUTTONS - CRITICAL:
   - "New project", "Add", "Save" = OUTLINE buttons (gray border, transparent background), NOT filled blue
   - Primary (filled blue) is ONLY for final confirmations like "Confirm purchase" or "Submit form"
   - Button height: 36px standard, 32px for compact/toolbar. NOT 44px (that's touch target, not visual size)
   - Padding: 8px 14px. Keep buttons light and refined, not chunky.
   - Red filled buttons only for destructive confirmations

6. TASK CHECKBOXES - CIRCLES NOT SQUARES:
   - Task checkboxes must be CIRCLES (border-radius: 50%), not rounded squares
   - Size: 18-20px diameter
   - Unchecked: 1.5px gray border, transparent fill
   - Hover: Border turns blue
   - Checked: Green fill with white checkmark
   - Reference: Things 3, Todoist, Linear

7. SEMANTIC COLOR LOGIC:
   - Blue = "do something" (interactive)
   - Green = "done" (completion)
   - Red = "careful" (attention/danger)

8. INPUTS: Gray borders, blue focus ring. Padding 10px 12px (not too tall).

9. MOTION: Transitions are 150ms ease-out. Respect prefers-reduced-motion.

10. PHILOSOPHY: Clean, quiet, functional. Buttons should feel light, not chunky. The design should feel like a well-organized document, not a dashboard.
```

---

_Last updated: January 2025_ _Version: 1.1_
