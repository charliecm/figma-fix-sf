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
  let count = {
    texts: 0, // Nodes with SF fonts
    others: 0, // Nodes without SF fonts
    modified: 0 // Nodes with modification
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if ("children" in node) {
      const { texts, modified, others } = await traverse(node.children)
      count.texts += texts
      count.modified += modified
      count.others += others
    }
    if (node.type !== "TEXT" || node.textStyleId) {
      count.others++
      continue
    }

    let isModified = false
    let fontFamily = (node.fontName as FontName).family
    const fontSize = node.fontSize as number
    const letterSpacing = node.letterSpacing

    if (fontFamily !== FONT_DISPLAY && fontFamily !== FONT_TEXT) {
      count.others++
      continue
    }
    count.texts++

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
    if (isModified) count.modified++
  }

  return count
}

async function run() {
  const count = await traverse(figma.currentPage.selection)
  let message = ""
  if (count.modified === 1) {
    message = "Updated 1 text with SF fonts ✅"
  } else if (count.modified) {
    message = `Updated ${count.modified} texts with SF fonts ✅`
  } else if (count.texts && count.others) {
    message = "Texts in selection with SF fonts are already fixed 👍"
  } else if (count.texts === 1 && !count.others) {
    message = "Text is already fixed 👍"
  } else if (count.texts) {
    message = "Selected texts with SF fonts are already fixed 👍"
  } else {
    message =
      "Please select texts with 'SF Pro Display' or 'SF Pro Text' fonts."
  }
  figma.closePlugin(message)
}

run()
