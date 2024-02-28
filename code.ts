/**
 * Fix San Francisco
 * Fixes texts with SF typeface according to Apple's official tracking table:
 * https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/typography/#font-usage-and-tracking
 */

const FONT_DEFAULT = "SF Pro"
const FONT_TEXT = "SF Pro Text"
const FONT_DISPLAY = "SF Pro Display"
const FONT_ROUNDED = "SF Pro Rounded"
const FONT_NEW_YORK = "New York"

const SIZE_MIN = 6
const SIZE_MAX = 80
const SIZE_MAX_ROUNDED = 80
const SIZE_MAX_NEW_YORK = 261
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

const TRACKING_DEFAULT = fillTracking(
  {
    6: 41,
    7: 34,
    8: 26,
    9: 19,
    10: 12,
    11: 6,
    12: 0,
    13: -6,
    14: -11,
    15: -16,
    16: -20,
    17: -26,
    18: -25,
    19: -24,
    20: -23,
    21: -18,
    22: -12,
    23: -4,
    24: 3,
    25: 6,
    26: 8,
    27: 11,
    28: 14,
    31: 13,
    33: 12,
    35: 11,
    36: 10,
    41: 9,
    44: 8,
    49: 7,
    52: 6,
    58: 5,
    60: 4,
    66: 3,
    68: 2,
    76: 1,
    80: 0
  },
  SIZE_MIN,
  SIZE_MAX
)

const TRACKING_TEXT = fillTracking(
  {
    6: 41,
    7: 34,
    8: 26,
    9: 19,
    10: 12,
    11: 6,
    12: 0,
    13: -6,
    14: -11,
    15: -16,
    16: -20,
    17: -26,
    18: -25,
    19: -24,
  },
  SIZE_MIN,
  SIZE_SWAP
)

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
    36: 10,
    41: 9,
    44: 8,
    49: 7,
    52: 6,
    56: 5,
    60: 4,
    66: 3,
    68: 2,
    76: 1,
  },
  SIZE_SWAP,
  SIZE_MAX
)

const TRACKING_ROUNDED = fillTracking(
  {
    6: 87,
    7: 80,
    8: 72,
    9: 65,
    10: 58,
    11: 52,
    12: 46,
    13: 40,
    14: 35,
    15: 30,
    16: 26,
    17: 22,
    18: 21,
    19: 20,
    20: 18,
    21: 17,
    22: 16,
    24: 15,
    25: 14,
    28: 13,
    30: 12,
    35: 11,
    37: 10,
    43: 9,
    44: 8,
    50: 7,
    51: 6,
    58: 4,
    64: 3,
    66: 2,
    76: 1,
  },
  SIZE_MIN,
  SIZE_MAX_ROUNDED
)

const TRACKING_NEW_YORK = fillTracking(
  {
    6: 40,
    7: 32,
    8: 25,
    9: 20,
    10: 16,
    11: 11,
    12: 6,
    13: 4,
    14: 2,
    15: 0,
    16: -2,
    17: -4,
    18: -6,
    19: -8,
    20: -10,
    23: -11,
    26: -12,
    31: -13,
    34: -14,
    54: -15,
    70: -16,
    180: -17,
    220: -18,
  },
  SIZE_MIN,
  SIZE_MAX_NEW_YORK
)

enum TextOutcome {
  Modified,
  Unmodified,
  Unsupported,
}

async function applyToRange(
  node: TextNode,
  start: number,
  end: number
): Promise<TextOutcome> {
  const fontName = node.getRangeFontName(start, end)
  const fontSize = node.getRangeFontSize(start, end)
  const letterSpacing = node.getRangeLetterSpacing(start, end)
  if (
    fontName === figma.mixed ||
    fontSize === figma.mixed ||
    letterSpacing === figma.mixed
  )
    // Ignore mixed range
    return

  let isModified = false
  let fontFamily = fontName.family
  if (fontFamily !== FONT_DEFAULT && fontFamily !== FONT_DISPLAY && fontFamily !== FONT_TEXT && fontFamily !== FONT_ROUNDED && fontFamily !== FONT_NEW_YORK) {
    // Font family is not supported
    return TextOutcome.Unsupported
  }

  if (fontFamily === FONT_DISPLAY && fontSize < SIZE_SWAP) {
    // Switch to Text variation if text is small
    fontFamily = FONT_TEXT
    isModified = true
  }

  if (fontFamily === FONT_TEXT && fontSize >= SIZE_SWAP) {
    // Switch to Display variation if text is larger
    fontFamily = FONT_DISPLAY
    isModified = true
  }

  // Load and assign font family
  const newFontName = {
    family: fontFamily,
    style: fontName.style,
  }
  await figma.loadFontAsync(newFontName)
  node.setRangeFontName(start, end, newFontName)

  // Apply tracking
  const newLetterSpacing = {
    value: 0,
    unit: "PIXELS",
  }
  switch (fontFamily) {
    case FONT_DEFAULT:
      if (fontSize >= SIZE_MAX) {
        newLetterSpacing.value = 0
        break
      }
      newLetterSpacing.value =
        (fontSize * TRACKING_DEFAULT[Math.floor(fontSize)]) / TRACKING_UNIT
      break
    case FONT_DISPLAY:
      if (fontSize >= SIZE_MAX) {
        newLetterSpacing.value = 0
        break
      }
      newLetterSpacing.value =
        (fontSize * TRACKING_DISPLAY[Math.floor(fontSize)]) / TRACKING_UNIT
      break
    case FONT_TEXT:
      newLetterSpacing.value =
        (fontSize * TRACKING_TEXT[Math.max(SIZE_MIN, Math.floor(fontSize))]) /
        TRACKING_UNIT
      break
    case FONT_ROUNDED:
      if (fontSize >= SIZE_MAX_ROUNDED) {
        newLetterSpacing.value = 0
        break
      }
      newLetterSpacing.value =
        (fontSize * TRACKING_ROUNDED[Math.max(SIZE_MIN, Math.floor(fontSize))]) /
        TRACKING_UNIT
      break
    case FONT_NEW_YORK:
      if (fontSize >= SIZE_MAX_NEW_YORK) {
        newLetterSpacing.value = 0
        break
      }
      newLetterSpacing.value =
        (fontSize * TRACKING_NEW_YORK[Math.max(SIZE_MIN, Math.floor(fontSize))]) /
        TRACKING_UNIT
      break
  }
  node.setRangeLetterSpacing(start, end, newLetterSpacing as LetterSpacing)

  // Check if tracking has been modified
  if (
    newLetterSpacing.value.toPrecision(2) !==
      letterSpacing.value.toPrecision(2) ||
    newLetterSpacing.unit !== letterSpacing.unit
  )
    isModified = true

  return isModified ? TextOutcome.Modified : TextOutcome.Unmodified
}

async function traverse(nodes: readonly SceneNode[]) {
  const count = {
    texts: 0, // Nodes with supported fonts
    others: 0, // Nodes without supported fonts
    modified: 0, // Nodes with modification
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

    const textNode = node as TextNode
    if (
      textNode.fontName === figma.mixed ||
      textNode.fontSize === figma.mixed ||
      textNode.letterSpacing === figma.mixed
    ) {
      // Check each character when text has mixed styles
      for (let i = 0; i < textNode.characters.length; i++) {
        // Load all current fonts first
        await figma.loadFontAsync(node.getRangeFontName(i, i + 1) as FontName)
      }
      let isModified = false
      let isUnmodified = false
      for (let i = 0; i < textNode.characters.length; i++) {
        switch (await applyToRange(textNode, i, i + 1)) {
          case TextOutcome.Modified:
            isModified = true
            break
          case TextOutcome.Unmodified:
            isUnmodified = true
            break
          case TextOutcome.Unsupported:
            break
        }
      }
      if (isModified) count.modified++
      else if (isUnmodified) count.texts++
      else count.others++
    } else {
      // Check entire text
      switch (await applyToRange(textNode, 0, textNode.characters.length)) {
        case TextOutcome.Modified:
          count.modified++
          break
        case TextOutcome.Unmodified:
          count.texts++
          break
        case TextOutcome.Unsupported:
          count.others++
          break
        default:
          break
      }
    }
  }

  return count
}

async function run() {
  const count = await traverse(figma.currentPage.selection)
  let message = ""
  if (count.modified === 1) {
    message = "Updated 1 text ✅"
  } else if (count.modified) {
    message = `Updated ${count.modified} texts ✅`
  } else if (count.texts && count.others) {
    message = "Texts in selection are already fixed 👍"
  } else if (count.texts === 1 && !count.others) {
    message = "Text is already fixed 👍"
  } else if (count.texts) {
    message = "Selected texts are already fixed 👍"
  } else {
    message =
      "Please select texts with 'SF Pro', 'SF Pro Display', 'SF Pro Text', 'SF Pro Rounded', or 'New York' font."
  }
  figma.closePlugin(message)
}

run()
