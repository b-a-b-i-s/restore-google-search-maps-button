const DEFAULT_MAPS_POSITION = 2;
const MARKER_ATTR = "data-restore-maps";

let mapsUrl = "";
let mapsPosition = DEFAULT_MAPS_POSITION;

// When Google auto-corrects a query ("These are results for X / Search instead for Y"),
// the results - and the map - are for X, so Maps should open X, not the typed text.
function getCorrectedQuery() {
  const correctedLink = document.querySelector("a#fprsl");
  if (!correctedLink) return null;
  try {
    const query = new URL(correctedLink.href, window.location.href).searchParams.get("q");
    if (query) return query;
  } catch {
    // fall through to the link text
  }
  return correctedLink.textContent.trim() || null;
}

function getSearchQuery() {
  return getCorrectedQuery() || new URLSearchParams(window.location.search).get("q");
}

function updateMapsUrl() {
  const searchQuery = getSearchQuery();
  mapsUrl = searchQuery ? "https://maps.google.com/maps?q=" + encodeURIComponent(searchQuery) : "";
}

function isMapsHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return url.hostname.startsWith("maps.google.") || url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}

// Keep Google's own click handlers (jsaction) from hijacking our links.
function isolateClicks(element) {
  ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart"].forEach((type) =>
    element.addEventListener(type, (event) => event.stopPropagation())
  );
}

// Point any element we created earlier at the current query (Google can change `q` without a reload).
function refreshOwnLinks() {
  document.querySelectorAll(`[${MARKER_ATTR}]`).forEach((el) => {
    const anchor = el.tagName === "A" ? el : el.querySelector("a");
    if (anchor && anchor.href !== mapsUrl) anchor.href = mapsUrl;
  });
}

/* ---------- Maps tab in the search navigation bar ---------- */

function findTabList() {
  // The selected tab ("All", "Images", ...) carries aria-current="page" - language independent.
  const current = document.querySelector('[role="list"] [role="listitem"] [aria-current="page"]');
  return current?.closest('[role="list"]') || document.querySelector('div.rQTE8b [role="list"]');
}

function getRegularTabs(list) {
  // Regular tabs are list items whose link is a direct child. This skips the
  // "AI Mode" pill (link is wrapped in an extra div) and the "More" dropdown (no link).
  // Note: the selected tab's link has no href.
  return Array.from(list.children).filter(
    (item) => item.matches('[role="listitem"]') && item.querySelector(":scope > a")
  );
}

function insertMapsButton() {
  if (document.querySelector(`[${MARKER_ATTR}="tab"]`)) return;

  const list = findTabList();
  if (!list) return;

  const tabs = getRegularTabs(list);
  if (tabs.length === 0) return;

  // Google already shows its own Maps tab - nothing to restore.
  if (tabs.some((item) => isMapsHref(item.querySelector(":scope > a").getAttribute("href") || ""))) return;

  const template = tabs.find((item) => !item.querySelector('[aria-current="page"]')) || tabs[0];
  const mapsTab = template.cloneNode(true);
  mapsTab.setAttribute(MARKER_ATTR, "tab");

  mapsTab.querySelectorAll("[aria-current]").forEach((el) => el.removeAttribute("aria-current"));
  mapsTab.querySelectorAll("[selected]").forEach((el) => el.removeAttribute("selected"));
  [mapsTab, ...mapsTab.querySelectorAll("*")].forEach((el) => {
    ["jsname", "jsaction", "jscontroller", "data-ved", "ping", "id"].forEach((attr) => el.removeAttribute(attr));
  });

  const anchor = mapsTab.querySelector(":scope > a");
  anchor.href = mapsUrl;
  isolateClicks(anchor);

  const label = anchor.querySelector(".R1QWuf") || anchor.querySelector("span") || anchor;
  label.textContent = "Maps";

  const index = Math.min(Math.max(mapsPosition, 1), tabs.length) - 1;
  tabs[index].after(mapsTab);
}

/* ---------- "Open in Maps" button on embedded maps ---------- */

function findMapContainers() {
  // Knowledge panel map: starts as a static image (div.V1GY4c) and is swapped for an
  // interactive map on interaction. Both live inside the same wrapper, so use that.
  const panelMaps = Array.from(document.querySelectorAll("div.V1GY4c")).map(
    (staticMap) => staticMap.closest(".ZqGZZ") || staticMap.parentElement
  );
  // Other interactive maps (e.g. local "Places" results) are role="region" containers
  // whose tiles are rendered as blob: images.
  const regions = Array.from(document.querySelectorAll('[role="region"]')).filter(
    (region) => region.querySelector('img[src^="blob:"]')
  );
  return [...panelMaps, ...regions].filter((container) => container && container.getBoundingClientRect().width > 0);
}

function createOpenInMapsButton() {
  const anchor = document.createElement("a");
  anchor.setAttribute(MARKER_ATTR, "shortcut");
  anchor.textContent = "Open in Maps";
  anchor.href = mapsUrl;
  Object.assign(anchor.style, {
    position: "absolute",
    top: "12px",
    left: "12px",
    zIndex: "10",
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid transparent",
    borderColor: "var(--Yi4Nb)",
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "20px",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });
  anchor.addEventListener("mouseenter", () => {
    anchor.style.backgroundColor = "rgba(9, 9, 9, 0.68)";
  });
  anchor.addEventListener("mouseleave", () => {
    anchor.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  });
  isolateClicks(anchor);
  return anchor;
}

function addMapsShortcut() {
  const HOST_ATTR = MARKER_ATTR + "-host";
  findMapContainers().forEach((container) => {
    // One button per map, even when a region sits inside an already-handled wrapper.
    if (container.closest(`[${HOST_ATTR}]`) || container.querySelector(`[${HOST_ATTR}]`)) return;
    container.setAttribute(HOST_ATTR, "");
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.append(createOpenInMapsButton());
  });
}

/* ---------- Wiring ---------- */

function setupMapsButton() {
  updateMapsUrl();
  if (!mapsUrl) return;
  refreshOwnLinks();
  insertMapsButton();
  addMapsShortcut();
}

let scheduled = false;
function scheduleSetup() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    setupMapsButton();
  }, 150);
}

function start() {
  chrome.storage.sync.get({ mapsPosition: DEFAULT_MAPS_POSITION }, (items) => {
    mapsPosition = parseInt(items.mapsPosition, 10) || DEFAULT_MAPS_POSITION;
    setupMapsButton();
    // Google renders the tab bar and maps progressively, so keep watching for them.
    new MutationObserver(scheduleSetup).observe(document.documentElement, { childList: true, subtree: true });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.mapsPosition) return;
    mapsPosition = parseInt(changes.mapsPosition.newValue, 10) || DEFAULT_MAPS_POSITION;
    document.querySelector(`[${MARKER_ATTR}="tab"]`)?.remove();
    setupMapsButton();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
