# Restore Google Search Maps Button

A Chrome extension that brings back the **Maps** tab on Google Search and adds an **Open in Maps** button to the maps that Google shows in search results.

[Chrome Web Store](https://chromewebstore.google.com/detail/iglddmpkpmdmhbafkkpcpcddkplfongi)

## Features

- **Maps tab**: adds a `Maps` tab to the tab bar under the search box (`All`, `Images`, `News`, …). It opens your current search in Google Maps (`https://maps.google.com/maps?q=<query>`).
  - The tab finds its place from the selected tab rather than from the tab names, so it works whatever language Google is shown in.
  - It skips the `AI Mode` and `More` entries.
  - If Google already shows its own Maps tab, the extension leaves it alone.
- **Open in Maps button**: adds a button to the top-left corner of:
  - the map in the info panel for a place (for example, searching `eiffel tower`). The button works both before and after the map becomes draggable.
  - the `Places` map in local searches (for example, `pizza near syntagma athens`).
- **Clickable map image**: on older layouts where the map is a still image, the image itself links to Google Maps.
- **Configurable position**: click the extension icon to choose where the Maps tab goes. The value `N` puts it after the Nth regular tab. The default of `2` gives `All, Images, Maps, …`.
- The extension keeps watching the page while it loads, so it catches parts that Google draws late or redraws. Each element is added only once.

The extension only runs on `/search` pages of the Google domains listed in `manifest.json`. Its only permission is `storage`, which it uses to save the tab position.

## Project structure

```
manifest.json          Extension manifest (MV3): content script, popup, matched Google domains
src/addMapsBtn.js      Content script: Maps tab, Open in Maps button, map image link
src/popup.html/.js     Popup / options page for the Maps tab position
src/materialize.min.js Popup UI library
images/                Extension icons
.github/workflows/     Release pipeline (Chrome Web Store + GitHub release)
CHANGELOG.md           Release notes
```

## Testing locally

1. Open `chrome://extensions` and turn on **Developer mode** (top-right).
2. Click **Load unpacked** and select the repository folder (the one that contains `manifest.json`).
   - If the Web Store version is installed too, turn it off so the two don't both add buttons.
3. Open a Google search and check the following:

   | Search | What to check |
   | --- | --- |
   | `https://www.google.com/search?q=eiffel+tower` | The `Maps` tab appears after `Images`. The info-panel map shows **Open in Maps**, and the button stays after you drag the map. |
   | `https://www.google.com/search?q=pizza+near+syntagma+athens` | The `Places` map shows **Open in Maps**. |
   | Any search with `&hl=el` (or another language) | The `Maps` tab is still added in the right position. |
   | Popup → change position → Save | The tab moves without a page reload. |

   Each `Maps` link and button should open Google Maps with your search.
4. After editing the code, click the **reload** icon on the extension's card in `chrome://extensions`, then refresh the Google tab.

### Debugging

- Content-script errors appear in the Google tab's DevTools console and on the extension's card (**Errors**).
- Everything the extension adds has a `data-restore-maps` attribute (`tab`, `shortcut` or `image`). In the DevTools console, `document.querySelectorAll('[data-restore-maps]')` shows what was added.
- Google changes its markup often. When something breaks, compare the live DOM against the selectors in `src/addMapsBtn.js`:
  - `[role="list"]` and `[aria-current="page"]`: the tab bar
  - `div.V1GY4c` and `.ZqGZZ`: the info-panel map
  - `[role="region"]` containing `img[src^="blob:"]`: the interactive maps

## Publishing

Publishing runs automatically from [`.github/workflows/publish.yml`](.github/workflows/publish.yml) when a tag matching `v*.*.*` is pushed. The workflow:

1. zips the repository with `git archive` (`.gitattributes` leaves out the `.git*` files and `.github/`)
2. uploads and publishes the zip to the Chrome Web Store with [`mnao305/chrome-extension-upload`](https://github.com/mnao305/chrome-extension-upload)
3. creates a GitHub release with `extension.zip` attached

### Release steps

1. Update `version` in `manifest.json`. The Chrome Web Store rejects a version that isn't higher than the published one.
2. Move the `[Unreleased]` notes in `CHANGELOG.md` under the new version and date.
3. Commit, then tag and push:

   ```sh
   git commit -am "Bump to version X.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```

4. Follow the run in the repository's **Actions** tab. After upload, the Chrome Web Store review usually takes from a few hours to a few days.

### Required repository secrets

Set these under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `CLIENT_ID` | OAuth client ID from a Google Cloud project that has the **Chrome Web Store API** enabled |
| `CLIENT_SECRET` | The secret for that OAuth client |
| `REFRESH_TOKEN` | Refresh token for the developer account that owns the extension, with the `https://www.googleapis.com/auth/chromewebstore` scope |

See Google's [Chrome Web Store API guide](https://developer.chrome.com/docs/webstore/using-api) for how to create these. The extension ID (`iglddmpkpmdmhbafkkpcpcddkplfongi`) is set in the workflow, and the `key` in `manifest.json` keeps the same ID when the extension is loaded unpacked.

### Manual publish

To publish without the workflow, build the same zip locally and upload it in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole):

```sh
git archive --format=zip --output=extension.zip HEAD
```

`extension.zip` is listed in `.gitignore`, so it is never committed.
