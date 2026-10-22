# See Padel: Training Sessions section

A dedicated "Training Sessions" section for the See Padel landing page (Sherifawad-crtv/see-padel), built in the site's own design language.

Apply it from a checkout of see-padel:

    git apply --index training-section.patch

What it adds
- `#training` section between "Inside SEE" and "How it works": blue noise panel (same pattern as Shareable Highlights) with two real app screens, then three numbered steps (Build your list / Place your cones / See where it landed) and feature tags.
- 4 new images in `assets/`: 3 real PWA screens inside the iPhone mockup (with an iOS status bar and the page content set below the Dynamic Island) and the bare `iphone-frame.webp`.
- "Training" link in the header nav, the floating menu and the footer; a "What are Training Sessions?" FAQ; the floating menu button now turns white over the new blue panel.
- Responsive rules for mobile in `styles.css`.
