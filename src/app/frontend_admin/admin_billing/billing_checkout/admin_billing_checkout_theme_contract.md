# billing_checkout theme contract

This capability consumes the host's light retail theme through Tailwind semantic tokens. It owns no global colors or theme definitions.

Required tokens: `brand`, `brand-hover`, `page`, `card`, `subtle`, `sidebar`, `primary`, `secondary`, `on-primary`, `border`, `focus`, `success`, `success-bg`, `warning`, `warning-bg`, `danger`, `danger-bg`, `on-danger`, `accent`, `accent-text`, `muted-inverse`, `backdrop`; shadows `card` and `dialog`.

Mappings live in `src/app/globals.css` under `@theme inline`. `text-primary` is foreground; `bg-page` is the page surface. Preserve focus-visible styles, roughly 44px targets, contained table overflow and reduced-motion behavior. UI uses no raw hex/RGB colors or inline style objects. Printing styles are supplied globally for the receipt portal. Device, print and assistive-technology certification is not claimed.
