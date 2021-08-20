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
  if (fontFamily !== FONT_DISPLAY && fontFamily !== FONT_TEXT) {
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
  let newLetterSpacing = {
    value: 0,
    unit: "PIXELS",
  }
  switch (fontFamily) {
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

async function traverse(nodes: any) {
  let count = {
    texts: 0, // Nodes with SF fonts
    others: 0, // Nodes without SF fonts
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

    let textNode = node as TextNode
    if (
      textNode.fontName === figma.mixed ||
      textNode.fontSize === figma.mixed ||
      textNode.letterSpacing === figma.mixed
    ) {
      // Check each character when text has mixed styles
      for (let i = 0; i < textNode.characters.length; i++) {
        // Load all current fonts first
        await figma.loadFontAsync(node.getRangeFontName(i, i + 1))
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
