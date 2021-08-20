# Fix San Francisco

![](/cover.png?raw=true)

This plugin won't fix the city's problems, but it will automatically apply the [correct font variant and tracking](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/typography#tracking-values) for selected texts using the San Francisco typeface.

## Usage

1. Select a Frame or texts with `SF Pro Display` or `SF Pro Text` fonts.
2. Run `Fix San Francisco` from Plugins menu.

The plugin will find all relevant texts in your selections and apply the fix.

**Note:** Texts with text style will not be changed.

## Context

When texts with SF fonts are rendered on iOS, their variant and tracking (letter spacing) are adjusted based on their point size and the user's accessibility settings. In Figma, the tracking must be manually applied to get a more accurate representation. Hence, **Fix San Francisco** is here to automate this process for you ♥

Inspired by [Sketch-SF-UI-Font-Fixer](https://github.com/kylehickinson/Sketch-SF-UI-Font-Fixer).
