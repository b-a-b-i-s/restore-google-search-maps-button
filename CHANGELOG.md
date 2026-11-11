# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2026-11-11

### Changed

- Clicking the map no longer opens Google Maps; only the `Open in Maps` button does

## [1.1.3] - 2026-11-11

### Fixed

- Fix GitHub actions auto publish

## [1.1.2] - 2026-11-11

### Fixed

- Maps tab was inserted inside the `AI Mode` pill instead of among the regular tabs, after Google's tab bar markup changed
- `Open in Maps` link was placed on the photo collage instead of the map; it is now added to the knowledge panel map (static and interactive) and to the local `Places` map
- Elements rendered after page load are now picked up, and the popup's default position matches the one the content script uses

## [1.1.1] - 2025-12-13

### Changed

- Change `Open in Maps` link colors to be the same with others elements on the map

## [1.1.0] - 2025-12-13

### Added

- Add underline when hover over the `Open in Maps` link
