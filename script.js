const container = document.querySelector("#container");

const patternInput = document.querySelector("#pattern");
const fontSizeInput = document.querySelector("#font-size");
const fontColorInput = document.querySelector("#font-color");
const bgColorInput = document.querySelector("#bg-color");
const rotationInput = document.querySelector("#rotation");
const lineHeightInput = document.querySelector("#line-height");
const letterSpacingInput = document.querySelector("#letter-spacing");
const fontFamilyInput = document.querySelector("#font-family");
const spicyInput = document.querySelector("#spicy");
const satisfyInput = document.querySelector("#satisfy");
const colorizeInput = document.querySelector("#colorize");

const randomizeBtn = document.querySelector("#randomize");
const previousBtn = document.querySelector("#go-back");
const nextBtn = document.querySelector("#go-forward");
const toggleControlsBtn = document.querySelector("#toggle-controls");
const audio = document.querySelector("#audio");

// Default config (examples)
let config = {
  linePattern: "_._.—.—.",
  fontSize: 30,
  color: "#ffd700",
  backgroundColor: "#0a0a0a",
  rotation: 45,
  lineHeight: 1,
  fontFamily: "Shadows Into Light",
  letterSpacing: 4,
  spicy: true,
  satisfy: false,
};

const availableFonts = [
  "Major Mono Display",
  "Shadows Into Light",
  "Syne Mono",
  "VT323",
];

// Keeps track of the patterns generated during
// the session and the current history "page"
let history = [];
let currentHistory = 0;

// Define listeners actions
// [<inputEl>, <config prop to change with the new value>]
const listeners = [
  [patternInput, "linePattern"],
  [fontSizeInput, "fontSize"],
  [fontColorInput, "color"],
  [bgColorInput, "backgroundColor"],
  [rotationInput, "rotation"],
  [lineHeightInput, "lineHeight"],
  [letterSpacingInput, "letterSpacing"],
  [fontFamilyInput, "fontFamily"],
  [spicyInput, "spicy"],
  [satisfyInput, "satisfy"],
  [colorizeInput, "colorize"],
];

// Min/max values according to device type
// Ensures a better experience
const rangeInputsValues = {
  fontSize: [fontSizeInput, { mobile: [20, 50], desktop: [30, 80] }],
  letterSpacing: [letterSpacingInput, { mobile: [10, 50], desktop: [10, 100] }], // px, will be divided by 10
  lineHeight: [lineHeightInput, { mobile: [10, 13], desktop: [10, 15] }], // Will be divided by 10
};

// Transform HSL color to HEX
// From https://stackoverflow.com/a/44134328
function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Update the config hash
function updateHistoryHash() {
  const configCopy = { ...config };
  window.location.hash = btoa(encodeURIComponent(JSON.stringify(configCopy)));
}

// Push current pattern to history
function pushToHistory() {
  const maxHistoryLength = 100;
  history.splice(0, history.length - maxHistoryLength);

  history.push({ ...config });
  localStorage.setItem("patternMachineHistory", JSON.stringify(history));
  currentHistory = history.length - 1;
  updateHistoryHash();
}

function goTo(historyIndex) {
  const historicConfig = history[historyIndex];
  config = { ...historicConfig };
  draw();
  updateHistoryHash();
}

function goBack() {
  currentHistory--;

  if (currentHistory < 0) {
    currentHistory = 0;
    return;
  }

  goTo(currentHistory);
}

function goForward() {
  currentHistory++;

  if (currentHistory > history.length - 1) {
    currentHistory = history.length - 1;
    return;
  }

  goTo(currentHistory);
}

// Update inputs
function updateInputs() {
  for (listener of listeners) {
    const [inputEl, configKey] = listener;
    if (inputEl.type === "checkbox") {
      inputEl.checked = config[configKey];
    } else {
      inputEl.value = config[configKey];
    }
  }
}

// Get a random number between a mininum and maximum value
function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Get a random HSL value, with lightness tone control
function getRandomColor(lightnessMode) {
  const lightness =
    lightnessMode === "dark"
      ? getRandomInRange(5, 20)
      : getRandomInRange(50, 80);
  return hslToHex(
    getRandomInRange(0, 255),
    getRandomInRange(0, 100),
    lightness
  );
}

/* Future implementation
// Get a random gradient
function getRandomGradient(lightnessMode) {
  const hue = getRandomInRange(0, 255);
  const saturation = getRandomInRange(0, 100);
  const color1 = hslToHex(hue, saturation, getRandomInRange(5, 15));
  const color2 = hslToHex(hue, saturation, getRandomInRange(25, 30));
  return `linear-gradient(30deg, ${color1}, ${color2}`;
}
*/

// Get a string with random patterns to compose a pattern
function getRandomPattern() {
  const allowedChars = '_!"#&()*+,-./:;<=>?ƒ„…†‡ˆ‹“”•–—˜›œö~^´``';
  const charsLength = allowedChars.length;
  return (
    [...Array(getRandomInRange(2, 5))]
      .map(() => allowedChars[getRandomInRange(0, charsLength - 1)])
      .join("") + " "
  );
}

// Chagne the container contents
function draw() {
  container.style.fontSize = config.fontSize + "px";
  container.style.color = config.color;

  container.style.backgroundColor = config.backgroundColor;
  document.body.style.backgroundColor = config.backgroundColor;
  // container.style.backgroundImage = config.backgroundColor; // Use gradient in the future?

  container.style.transform = `rotate(${config.rotation}deg) scale(2.5)`;
  container.style.letterSpacing = config.letterSpacing + "px";
  container.style.lineHeight = config.lineHeight / 10;
  container.style.fontFamily = config.fontFamily;

  // Clear container
  container.innerHTML = "";

  if (config.spicy || config.satisfy || config.colorize) {
    const fullStr = config.linePattern.repeat(500);
    const chars = fullStr.split("");

    chars.forEach((char) => {
      const wrapperEl = document.createElement("span");
      wrapperEl.style.display = `inline-block`;

      // Add some CSS animations and
      // play a nice song to go along 🎹
      if (config.satisfy) {
        // For more satisfaction, randomize the rotation direction
        wrapperEl.classList.add(["right", "left"][getRandomInRange(0, 2)]);

        container.classList.add("satisfy");
        audio.play();
      } else {
        container.classList.remove("satisfy");
        audio.pause();
      }

      let randomColors;
      if (config.colorize) {
        // Random colors!
        const transitionDuration = [500, 700, 1200][getRandomInRange(0, 3)]; // ms
        wrapperEl.style.color = getRandomColor();
        wrapperEl.style.transition = `color ${transitionDuration}ms linear`;

        randomColors = setInterval(() => {
          wrapperEl.style.color = getRandomColor();
        }, transitionDuration);
      } else {
        clearInterval(randomColors);
        wrapperEl.style.transition = null;
      }

      if (config.spicy) {
        // Rotate most characters in some direction
        const spicyEl = document.createElement("span");
        spicyEl.style.display = `inline-block`;
        spicyEl.style.transform = `rotateZ(${
          [0, 45, 90, 135][getRandomInRange(0, 4)]
        }deg)`;
        spicyEl.innerHTML = char;
        wrapperEl.appendChild(spicyEl);
      } else {
        wrapperEl.innerHTML = char;
      }

      container.appendChild(wrapperEl);
    });
  } else {
    container.innerHTML = config.linePattern.repeat(500);
  }

  updateInputs();
}

// Check wether this is a mobile device
function isMobile() {
  return window.innerWidth <= 1024;
}

// Randomize all parameters :)
function randomize(options) {
  if (!options) options = {};

  // Background color
  const backgroundColor = getRandomColor("dark");
  // const backgroundColor = getRandomGradient(); // Future?

  // Text color
  const color = getRandomColor("light");

  // Font range
  const fontSizeRange = isMobile()
    ? rangeInputsValues.fontSize[1].mobile
    : rangeInputsValues.fontSize[1].desktop;
  const fontSize = getRandomInRange(...fontSizeRange);

  // Line pattern (characters)
  const linePattern = getRandomPattern();

  // Line height
  const lineHeightRange = isMobile()
    ? rangeInputsValues.lineHeight[1].mobile
    : rangeInputsValues.lineHeight[1].desktop;
  const lineHeight = getRandomInRange(...lineHeightRange);

  // Letter spacing
  const letterSpacingRange = isMobile()
    ? rangeInputsValues.letterSpacing[1].mobile
    : rangeInputsValues.letterSpacing[1].desktop;
  const letterSpacing = getRandomInRange(...letterSpacingRange);

  // Container rotation
  const rotation = [0, 45, 90, 135][getRandomInRange(0, 5)];

  let fontFamily;
  if (options.skipFontRand) {
    fontFamily = config.fontFamily;
  } else {
    fontFamily = availableFonts[getRandomInRange(0, availableFonts.length)];
  }

  config = {
    ...config,
    backgroundColor,
    color,
    fontSize,
    linePattern,
    rotation,
    lineHeight,
    letterSpacing,
    fontFamily,
  };

  updateInputs();
  draw();
  pushToHistory();
}

// Showcase a few examples of patterns
function doPresentation() {
  const options = {
    skipFontRand: true,
  };

  let count = 0;

  const presentationInt = setInterval(function () {
    count++;
    randomize(options);
    draw();
    if (count > 10) clearInterval(presentationInt);
  }, 200);
}

// Initialize
function init() {
  try {
    const localHistoryStr = localStorage.getItem("patternMachineHistory");
    if (localHistoryStr) {
      const historyArr = JSON.parse(localHistoryStr);
      history = [...historyArr];
    }
  } catch {
    throw "Error on history recovery";
  }

  if (window.location.hash) {
    // If a config is available at the start, use it
    try {
      const hashValue = window.location.hash.slice(
        1,
        window.location.hash.length
      );

      hashConfig = JSON.parse(decodeURIComponent(atob(hashValue)));
      config = { ...hashConfig };

      draw();
      pushToHistory();
    } catch {
      doPresentation();
      throw "Malformed config string";
    }
  } else {
    // Showcase a few examples of patterns
    doPresentation();
  }

  // Setup the ranges
  function setupRanges() {
    for (const rangeInputType in rangeInputsValues) {
      const [input, values] = rangeInputsValues[rangeInputType];
      input.min = isMobile() ? values.mobile[0] : values.desktop[0];
      input.max = isMobile() ? values.mobile[1] : values.desktop[1];
    }
  }
  setupRanges();
  window.addEventListener("resize", setupRanges);

  // Setup input listeners
  for (listener of listeners) {
    const [inputEl, configKey] = listener;

    // Draw whenever the user alters the input
    inputEl.addEventListener("input", function (e) {
      if (e.target.type === "checkbox") {
        config[configKey] = inputEl.checked;
      } else {
        config[configKey] = inputEl.value;
      }

      draw();
    });

    // Only push to history once the change is done
    inputEl.addEventListener("change", function (e) {
      pushToHistory();
    });
  }

  // Add Google Fonts
  const linkFontsEl = document.createElement("link");
  linkFontsEl.rel = "stylesheet";
  const fonts = availableFonts.reduce(
    (final, font) => final + "&family=" + font.replace(/ /g, "+"),
    ""
  );
  linkFontsEl.href = `https://fonts.googleapis.com/css2?display=swap${fonts}`;
  document.head.appendChild(linkFontsEl);

  // Randomize button listener
  randomizeBtn.addEventListener("click", function (e) {
    randomize();
  });

  // Make clicking the container randomize
  container.addEventListener("click", function (e) {
    randomize();
  });

  // History button listeners
  previousBtn.addEventListener("click", function (e) {
    goBack();
  });
  nextBtn.addEventListener("click", function (e) {
    goForward();
  });

  // Controls visibility
  toggleControlsBtn.addEventListener("click", function (e) {
    e.target.parentNode.classList.toggle("hide");
  });
}

window.onload = init;
