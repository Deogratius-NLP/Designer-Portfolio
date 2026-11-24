# Deogratius Kashumba — Portfolio

A responsive, single-page designer portfolio based on the supplied Portfolio.pdf and artwork in `Downloads/designs - Copy`.

## Run locally

Open `index.html` directly in a browser, or serve this folder with any static web server. No build step or package install is required.

## GitHub Pages

Publish from the root of the `main` branch using **Settings → Pages → Deploy from a branch**. The site uses relative asset paths so it also works at a project URL such as `https://username.github.io/portfolio-designer/`.

## Project structure

- `index.html` — page content and project cards
- `styles.css` — responsive layout, effects, and motion styling
- `script.js` - scroll controlled gallery, design manager, and pointer-reactive software tiles
- `assets/work/` — copies of the supplied design images
- `assets/background/2222.png` - wide desktop background image
- `assets/background/portrait-source.jpg` — portrait crop sourced from the supplied portfolio PDF
- `assets/audio/you-raise-me-up-60s.mp3` — a 60-second clip of the supplied Josh Groban recording with the quiet lead-in trimmed

## Managing designs

Press Ctrl+Shift+M (or Cmd+Shift+M on Mac) to open the private design manager. The first use asks you to create a passphrase; later uses require it. Add image files, reorder cards with drag and drop or the arrow buttons, and remove uploaded designs. Uploads are resized and saved in this browser so they remain available on this device. The passphrase hides the editor in this browser; it is not server authentication. Visitors can change only their own browser's saved view. This static site does not send changes to a web server, so designs need to be added to the site files separately before publishing them for other visitors.

The soundtrack starts on page load and loops when the browser permits audible autoplay. If audible autoplay is blocked, the page stays silent.

The footer includes email and WhatsApp links for the supplied contact details.
