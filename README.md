# SirFay Wardrobe

Shopping list for SirFay: https://oldtalez.github.io/sirfay-wardrobe/ (opens offline after the first visit).

- `index.html`: the app. It loads `data.json` (the list) and `photos/<id>.json` (each item's photos).
- Phones with a GitHub key (Add, "Save changes to the website") save ticks, prices, items and photos here by
  themselves; everyone else gets them the next time they open the link. Changes merge item by item, newest wins.

A copy of these files is kept in the vault at `Mackenzie Enterprise/SirFay Wardrobe/` and updated from here every
15 minutes by the "Vault repo sync" task (see `Company/Tools/repo-sync/README.md` in the vault). Don't edit that copy;
change the wardrobe from the website or in this repo.
