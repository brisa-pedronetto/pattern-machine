// DOM elements
let container,
  patternInput,
  fontSizeInput,
  fontColorInput,
  bgColorInput,
  rotationInput,
  lineHeightInput,
  letterSpacingInput,
  fontFamilyInput,
  packsInput,
  spicyInput,
  satisfyInput,
  randomizeBtn,
  copyUrlBtn,
  optionsBtn,
  historyBtn,
  toggleControlsBtn,
  audio;

// Configuration
let config, availableFonts, availablePacks, rangeInputsValues, listeners;

// Keeps track of the menu page being displayed
let currentMenu = "";

// Keeps track of the patterns generated during
// the session and the current history "page"
let history = [];
let currentHistory = 0;

// Support canvas used to calculate letter width
const canvas = document.createElement("canvas");
const canvasContext = canvas.getContext("2d");

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

// Make a shareable URL for the current patter
function getShareableURL() {
  const configCopy = { ...config };
  return (
    window.location.href + btoa(encodeURIComponent(JSON.stringify(configCopy)))
  );
}

// Update history view
function updateHistoryView() {
  const historyContainer = document.querySelector("#history-container");
  historyContainer.innerHTML = "";

  const historyCopy = history.slice(0);
  historyCopy
    .reverse()
    .slice(1, 20)
    .forEach((historyItem) => {
      const itemEl = document.createElement("div");
      itemEl.classList.add("item");
      const innerEl = document.createElement("div");
      innerEl.classList.add("inner");

      itemEl.addEventListener("click", function () {
        config = { ...historyItem };
        draw();
      });

      const customConfig = { ...historyItem };
      customConfig.containerScale = 2.5;
      customConfig.repeatAmount = 30;
      customConfig.lineHeight = 10;
      customConfig.letterSpacing = 10;
      customConfig.fontSize = 30;
      customConfig.satisfy = false;

      itemEl.appendChild(innerEl);
      historyContainer.appendChild(itemEl);

      draw(innerEl, customConfig);
    });
}

function copyToClipboard(text) {
  const el = document.createElement("input");
  el.value = text;
  el.style = { position: "absolute", opacity: "0" };
  document.body.appendChild(el), el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

// Push current pattern to history
function pushToHistory() {
  const maxHistoryLength = 100;
  history.splice(0, history.length - maxHistoryLength);

  // Avoid duplicates
  const hasDuplicate = history.reduce(function (hasDuplicate, historyItem) {
    if (hasDuplicate) return true;

    let identicalDatapoints = 0;
    for (configKey in config) {
      if (historyItem[configKey] === config[configKey]) {
        identicalDatapoints++;
      }
    }

    // If more than 5 data points (e.g. linePatter, letterSpacing, etc)
    // are identical, do not push this one to the history
    if (identicalDatapoints > 5) return true;

    return false;
  }, false);

  if (hasDuplicate) return;

  history.push({ ...config, satisfy: false });
  localStorage.setItem("patternMachineHistory", JSON.stringify(history));
  currentHistory = history.length - 1;

  if (currentMenu === "history") updateHistoryView();
}

// Navigate menu pages
function goToMenu(activeMenu) {
  // Clear active state
  const menuEls = controls.querySelectorAll(".menu-item");
  menuEls.forEach((menuEl) => menuEl.classList.remove("active"));

  if (activeMenu === "history") updateHistoryView();
  currentMenu = activeMenu;

  const activeEl = controls.querySelector("." + activeMenu);
  activeEl.classList.add("active");
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

// Check wether this is a mobile device
function isMobile() {
  return window.innerWidth <= 1024;
}

// Get a random number between a mininum and maximum value
function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

/* Future implementation (gradients)
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
  allowedChars =
    availablePacks[
      config.activePack ? config.activePack : Object.keys(availablePacks)[0]
    ];

  const charsLength = allowedChars.length;
  return [...Array(getRandomInRange(2, 5))]
    .map(() => allowedChars[getRandomInRange(0, charsLength - 1)])
    .join("");
}

// Chagne the container contents
function draw(customContainer, customConfig) {
  // Set local Container
  const lContainer = customContainer ? customContainer : container;
  // Set local Config
  const lConfig = customConfig ? customConfig : config;

  lContainer.style.fontSize = lConfig.fontSize + "px";
  lContainer.style.color = lConfig.color;

  lContainer.style.backgroundColor = lConfig.backgroundColor;
  lContainer.parentElement.style.backgroundColor = lConfig.backgroundColor;
  // lContainer.style.backgroundImage = lConfig.backgroundColor; // Use gradient in the future?

  const containerScale = lConfig.containerScale ? lConfig.containerScale : 1;
  lContainer.style.transform = `translate(-50%, -50%) scale(${containerScale}) rotateZ(${lConfig.rotation}deg)`;
  lContainer.style.letterSpacing = lConfig.letterSpacing + "px";
  lContainer.style.lineHeight = lConfig.lineHeight / 10;
  lContainer.style.fontFamily = lConfig.fontFamily;

  // Clear lContainer
  lContainer.innerHTML = "";

  // Calculate line height
  const lineHeight = (lConfig.lineHeight / 10) * lConfig.fontSize;

  // Calculate average character width for this pattern
  canvasContext.font = `${lConfig.fontSize}px ${lConfig.fontFamily}`;
  const charWidthSum = lConfig.linePattern
    .split("")
    .reduce(function (sum, char) {
      const metrics = canvasContext.measureText(char);
      return metrics.width + sum;
    }, 0);
  const charWidth = Math.ceil(
    charWidthSum / lConfig.linePattern.length + lConfig.letterSpacing
  );

  // Calculate total number of lines
  const lineCount = Math.ceil(container.offsetHeight / lineHeight);

  // Calculate how many characters each line will have
  const charsPerLine = Math.ceil(container.offsetWidth / charWidth);

  // Calculate how many characters the container will have, in total
  const totalChars = lineCount * charsPerLine;

  // Define amount of time to repeat this pattern in order to fill the container
  const repeatAmountCalc = Math.ceil(totalChars / lConfig.linePattern.length);

  if (lConfig.spicy || lConfig.satisfy || lConfig.colorize) {
    const repeatAmount = lConfig.repeatAmount
      ? lConfig.repeatAmount
      : repeatAmountCalc;
    const fullStr = lConfig.linePattern.repeat(repeatAmount);
    const chars = fullStr.split("");

    const spanTemplate = document.createElement("span");
    spanTemplate.style.display = `inline-block`;

    chars.forEach((char, charIndex) => {
      const wrapperEl = spanTemplate.cloneNode();
      wrapperEl.classList.add("char");

      if (char === " ") {
        wrapperEl.style.width = `${lConfig.fontSize}px`;
      }

      // Add some CSS animations and
      // play a nice song to go along 🎹
      if (lConfig.satisfy) {
        // For more satisfaction, randomize the rotation direction
        wrapperEl.classList.add(["right", "left"][getRandomInRange(0, 1)]);
        wrapperEl.style.opacity = "0.7";

        lContainer.classList.add("satisfy");
        audio.play();
        audio.volume = 0.4;
      } else {
        lContainer.classList.remove("satisfy");
        wrapperEl.style.opacity = null;
        audio.pause();
      }

      let randomColors;
      if (lConfig.colorize) {
        // Random colors!
        const transitionDuration = [500, 700, 1200][getRandomInRange(0, 2)]; // ms
        wrapperEl.style.color = getRandomColor();
        wrapperEl.style.transition = `color ${transitionDuration}ms linear`;

        randomColors = setInterval(() => {
          wrapperEl.style.color = getRandomColor();
        }, transitionDuration);
      } else {
        clearInterval(randomColors);
        wrapperEl.style.transition = null;
      }

      if (lConfig.spicy) {
        // Get a nice big pot
        const spicyEl = spanTemplate.cloneNode();

        // Add the main ingredients
        spicyEl.innerHTML = char;

        // Do some prepping...
        spicyEl.style.display = `inline-block`;
        spicyEl.style.transition = `transform 0.3s ease`;

        // Add spices 🌶

        // First some rotation
        let rotationIndex;
        if (charIndex % 4 === 0) rotationIndex = 3;
        else if (charIndex % 3 === 0) rotationIndex = 2;
        else if (charIndex % 2 === 0) rotationIndex = 1;
        else rotationIndex = 0;

        // Then a bit of skewing
        const skewDeg = [15, "-15"][getRandomInRange(0, 1)];

        // Mix everything...
        spicyEl.style.transform = `rotateZ(${
          [0, 45, 90, 135][rotationIndex]
        }deg) rotateY(${
          [0, 30, "-30"][getRandomInRange(0, 2)]
        }deg) skew(${skewDeg}deg, ${skewDeg}deg)`;

        // Yum-my
        wrapperEl.appendChild(spicyEl);
      } else {
        wrapperEl.innerHTML = char;
      }

      lContainer.appendChild(wrapperEl);
    });
  } else {
    const text = lConfig.linePattern.repeat(repeatAmountCalc);
    const finalText = text.replace(
      / /g,
      `<span style="display:inline-block; width: ${
        lConfig.fontSize + lConfig.letterSpacing
      }px"></span>`
    );
    lContainer.innerHTML = finalText;
  }

  updateInputs();

  // Clear hash
  // TODO Find a better place for this
  window.location.hash = "";
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
  const rotation = [20, 45, 65, 135, 155][getRandomInRange(0, 4)];

  let fontFamily;
  if (options.skipFontRand) {
    fontFamily = config.fontFamily;
  } else {
    fontFamily = availableFonts[getRandomInRange(0, availableFonts.length - 1)];
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
    if (count > 10) {
      clearInterval(presentationInt);

      setTimeout(function () {
        controls.classList.toggle("hide");
      }, 1000);
    }
  }, 200);
}

// Setup the ranges
function setupRanges() {
  for (const rangeInputType in rangeInputsValues) {
    const [input, values] = rangeInputsValues[rangeInputType];
    input.min = isMobile() ? values.mobile[0] : values.desktop[0];
    input.max = isMobile() ? values.mobile[1] : values.desktop[1];
  }
}

// Recover history
function recoverHistory() {
  // Try to recover the history from localStorage
  try {
    const localHistoryStr = localStorage.getItem("patternMachineHistory");
    if (localHistoryStr) {
      const historyArr = JSON.parse(localHistoryStr);
      history = [...historyArr];
    }
  } catch {
    throw "Error on history recovery";
  }
}

// Define what should happen on the first screen
// (Show presentation or pre-defined pattern)
function defineFirstScreen() {
  // If a config is available via the hash, use it
  if (window.location.hash) {
    try {
      const hashValue = window.location.hash.slice(
        1,
        window.location.hash.length
      );
      hashConfig = JSON.parse(decodeURIComponent(atob(hashValue)));
      config = { ...hashConfig };
      draw();
      pushToHistory();

      setTimeout(function () {
        controls.classList.toggle("hide");
      }, 200);
    } catch {
      doPresentation();
      throw "Malformed config string";
    }
  } else {
    // Showcase a few examples of patterns
    doPresentation();
  }
}

// Setup the input listeners
function setupInputListeners() {
  let drawTimeout;

  for (listener of listeners) {
    const [inputEl, configKey] = listener;
    // Draw whenever the user alters the input
    inputEl.addEventListener("input", function (e) {
      if (e.target.type === "checkbox") {
        config[configKey] = inputEl.checked;
      } else {
        config[configKey] = inputEl.value;
      }

      // Debounce draw
      clearTimeout(drawTimeout);
      drawTimeout = setTimeout(function () {
        draw();
      }, 1000);
    });

    // Only push to history once the change is done
    inputEl.addEventListener("change", function (e) {
      if (e.target.id === packsInput.id) {
        randomize();
      } else {
        pushToHistory();
      }
    });
  }
}

// Set up the available fonts
function setupFonts() {
  // Add Google Fonts
  const linkFontsEl = document.createElement("link");
  linkFontsEl.rel = "stylesheet";
  const fonts = availableFonts.reduce(
    (final, font) => final + "&family=" + font.replace(/ /g, "+"),
    ""
  );
  linkFontsEl.href = `https://fonts.googleapis.com/css2?display=swap${fonts}`;
  document.head.appendChild(linkFontsEl);

  // Populate Fonts input
  for (font of availableFonts) {
    const option = document.createElement("option");
    option.value = font;
    option.innerHTML = font;
    fontFamilyInput.appendChild(option);
  }
}

// Set up the event listeners
function setupClickEventListeners() {
  // Randomize button listener
  randomizeBtn.addEventListener("click", function (e) {
    randomize();
  });

  // Options button listener
  optionsBtn.addEventListener("click", function (e) {
    goToMenu("config");
  });

  // History button listener
  historyBtn.addEventListener("click", function (e) {
    goToMenu("history");
  });

  // Make clicking the container randomize
  container.addEventListener("click", function (e) {
    randomize();
  });

  // Copy URL button
  copyUrlBtn.addEventListener("click", function (e) {
    const shareableURL = getShareableURL();
    copyToClipboard(shareableURL);
    alert("The link to this pattern has been copied to the clipboard 👍");
  });

  // Controls visibility
  toggleControlsBtn.addEventListener("click", function (e) {
    e.target.classList.toggle("rotate");
    controls.classList.toggle("hide");
  });
}

// Populate packs
function populatePacks() {
  // Populate packs input
  for (packName in availablePacks) {
    const option = document.createElement("option");
    option.value = packName;
    option.innerHTML = packName;
    packsInput.appendChild(option);
  }
}

// Set up container properties
function setupContainer() {
  // Find container hypotenuse length
  const hypotenuseLength = Math.ceil(
    Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))
  );

  // Use the hypotenuse ot define the container size
  container.style.width = hypotenuseLength + "px";
  container.style.height = hypotenuseLength + "px";
}

// Initialize
function init() {
  // Default config (examples)
  config = {
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
    activePack: "Favs",
  };

  // Define DOM elements
  container = document.querySelector("#container");
  controls = document.querySelector("#controls");

  patternInput = document.querySelector("#pattern");
  fontSizeInput = document.querySelector("#font-size");
  fontColorInput = document.querySelector("#font-color");
  bgColorInput = document.querySelector("#bg-color");
  rotationInput = document.querySelector("#rotation");
  lineHeightInput = document.querySelector("#line-height");
  letterSpacingInput = document.querySelector("#letter-spacing");
  fontFamilyInput = document.querySelector("#font-family");
  packsInput = document.querySelector("#packs");
  spicyInput = document.querySelector("#spicy");
  satisfyInput = document.querySelector("#satisfy");
  colorizeInput = document.querySelector("#colorize");

  randomizeBtn = document.querySelector("#randomize");
  copyUrlBtn = document.querySelector("#copy-url");
  optionsBtn = document.querySelector("#options");
  historyBtn = document.querySelector("#history");
  toggleControlsBtn = document.querySelector("#toggle-controls");

  audio = document.querySelector("#audio");

  // Thanks Google Fonts
  availableFonts = [
    "Major Mono Display",
    "Shadows Into Light",
    "Syne Mono",
    "VT323",
  ];

  availablePacks = {
    Favs: "░█▄•!=,¦•(ö≈┬",
    Ellegant: "░░█▄▌•",
    Slim: '_!"#*+,-/¦<=>†‡‹“”–—˜›^´``',
    Curvy: "&().?ƒ„ˆ‹“”•›œ?ö~^º ",
    Wise: "αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙",
    Arkitekt: "╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌",
  };

  // Min/max values according to device type
  // Ensures a better experience for specific screens
  rangeInputsValues = {
    fontSize: [fontSizeInput, { mobile: [40, 100], desktop: [60, 150] }],
    letterSpacing: [
      letterSpacingInput,
      { mobile: [50, 100], desktop: [70, 140] },
    ], // px, will be divided by 10
    lineHeight: [lineHeightInput, { mobile: [11, 14], desktop: [15, 25] }], // Will be divided by 10
  };

  // Define listeners actions
  // [<inputEl>, <config prop to change with the new value>]
  listeners = [
    [patternInput, "linePattern"],
    [fontSizeInput, "fontSize"],
    [fontColorInput, "color"],
    [bgColorInput, "backgroundColor"],
    [rotationInput, "rotation"],
    [lineHeightInput, "lineHeight"],
    [letterSpacingInput, "letterSpacing"],
    [fontFamilyInput, "fontFamily"],
    [packsInput, "activePack"],
    [spicyInput, "spicy"],
    [satisfyInput, "satisfy"],
    [colorizeInput, "colorize"],
  ];

  // Recover history
  recoverHistory();

  // Setup the range inputs values
  setupRanges();
  window.addEventListener("resize", setupRanges);

  // Set up the input listeners
  setupInputListeners();

  // Setup the "click" event listeners
  setupClickEventListeners();

  // Setup the Google fonts
  setupFonts();

  // Add the available packs to menu
  populatePacks();

  // Setup container properties
  setupContainer();
  window.addEventListener("resize", setupContainer);

  // Do presentation or show pre-defined pattern
  defineFirstScreen();
}

window.onload = init;
