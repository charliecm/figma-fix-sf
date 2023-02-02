# Fix San Francisco

![](/cover.png?raw=true)

This plugin won't fix the city's problems, but it will automatically apply the [correct font variant and tracking](https://developer.apple.com/design/human-interface-guidelines/foundations/typography#tracking-values-ios) for selected texts using the San Francisco typeface.

## Usage

1. Select a Frame or texts with `SF Pro`, `SF Pro Display`, `SF Pro Text`, `SF Pro Rounded`, or `New York` font.
2. Run `Fix San Francisco` from Plugins menu.

The plugin will find all relevant texts in your selections and apply the fix.

**Note:** Texts with text style will not be changed.

**Note:** For New York, you must use the “New York” font and not the optical variants (“New York Small”, “New York Medium”, etc.) for the plugin to apply the appropriate tracking.

## Context

When texts with SF fonts are rendered on iOS, their variant and tracking (letter spacing) are adjusted based on their point size and the user's accessibility settings. In Figma, the tracking must be manually applied to get a more accurate representation. Hence, **Fix San Francisco** is here to automate this process for you ♥

Inspired by [Sketch-SF-UI-Font-Fixer](https://github.com/kylehickinson/Sketch-SF-UI-Font-Fixer).

## Development

Setup your environment by following the [Setup Guide](https://www.figma.com/plugin-docs/setup/).

To develop locally in [VSCode](https://code.visualstudio.com), hit ⌘⇧B and select `tsc: watch - tsconfig.json`.

To update [Figma API typings](https://www.figma.com/plugin-docs/api/typings/), run `npm i --save-dev @figma/plugin-typings`.
