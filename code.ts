/**
 * Fix San Francisco
 * Fixes texts with SF typeface according to Apple's official tracking table:
 * https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/typography/#font-usage-and-tracking
 */

const FONT_DISPLAY = "SF Pro Display"
const FONT_TEXT = "SF Pro Text"

const SIZE_MIN = 6
const SIZE_MAX = 79
const SIZE_SWAP = 20
const TRACKING_UNIT = 1000

// Fills missing font size values inbetween defined values
function fillTracking(
  dict: { [key: number]: number },
  min: number,
  max: number
) {
  let value = 0
  for (let i = min; i < max; i++) {
    if (i in dict) {
      value = dict[i]
      continue
    }
    dict[i] = value
  }
  return dict
}

const TRACKING_DISPLAY = fillTracking(
  {
    20: 19,
    21: 17,
    22: 16,
    24: 15,
    25: 14,
    27: 13,
    30: 12,
    33: 11,
    40: 10,
    44: 9,
    48: 8,
    50: 7,
    53: 6,
    56: 5,
    60: 4,
    65: 3,
    69: 2
  },
  SIZE_SWAP,
  SIZE_MAX
)

const TRACKING_TEXT = fillTracking(
  {
    6: 41,
    8: 26,
    9: 19,
    10: 12,
    11: 6,
    12: 0,
    13: -6,
    14: -11,
    15: -16,
    16: -20,
    17: -24,
    18: -25,
    19: -26
  },
  SIZE_MIN,
  SIZE_SWAP
)

async function traverse(nodes: any) {
  let modifiedCount = 0

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if ("children" in node) {
      modifiedCount += await traverse(node.children)
    }
    if (node.type !== "TEXT") continue
    if (node.textStyleId) continue

    let isModified = false
    let fontFamily = (node.fontName as FontName).family
    const fontSize = node.fontSize as number
    const letterSpacing = node.letterSpacing

    if (fontFamily !== FONT_DISPLAY && fontFamily !== FONT_TEXT) continue

    if (fontFamily === FONT_DISPLAY && fontSize < SIZE_SWAP) {
      fontFamily = FONT_TEXT
      isModified = true
    }

    if (fontFamily === FONT_TEXT && fontSize >= SIZE_SWAP) {
      fontFamily = FONT_DISPLAY
      isModified = true
    }

    // Load and assign font family
    const fontName = {
      family: fontFamily,
      style: (node.fontName as FontName).style
    }
    await figma.loadFontAsync(fontName)
    node.fontName = fontName

    // Set tracking
    switch (fontFamily) {
      case FONT_DISPLAY:
        if (fontSize >= SIZE_MAX) {
          node.letterSpacing = {
            value: 0,
            unit: "PIXELS"
          }
          break
        }
        node.letterSpacing = {
          value:
            (fontSize * TRACKING_DISPLAY[Math.floor(fontSize)]) / TRACKING_UNIT,
          unit: "PIXELS"
        }
        break
      case FONT_TEXT:
        node.letterSpacing = {
          value:
            (fontSize *
              TRACKING_TEXT[Math.max(SIZE_MIN, Math.floor(fontSize))]) /
            TRACKING_UNIT,
          unit: "PIXELS"
        }
        break
    }

    // Check if text node is modified
    if (JSON.stringify(node.letterSpacing) !== JSON.stringify(letterSpacing))
      isModified = true
    if (isModified) modifiedCount++
  }

  return modifiedCount
}

async function run() {
  const modifiedCount = await traverse(figma.currentPage.selection)
  figma.closePlugin(
    modifiedCount
      ? `Updated ${modifiedCount} texts with SF typeface.`
      : "No texts were updated."
  )
}

run()
