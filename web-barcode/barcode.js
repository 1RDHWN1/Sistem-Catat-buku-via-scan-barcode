(function () {
  const defaultBookDatabase = {
    BK001: "Matematika",
    BK002: "IPA",
    BK003: "Bahasa Indonesia",
    BK004: "Informatika",
    BK005: "Sejarah Indonesia",
  };

  const code128Patterns = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213",
    "122312", "132212", "221213", "221312", "231212", "112232", "122132",
    "122231", "113222", "123122", "123221", "223211", "221132", "221231",
    "213212", "223112", "312131", "311222", "321122", "321221", "312212",
    "322112", "322211", "212123", "212321", "232121", "111323", "131123",
    "131321", "112313", "132113", "132311", "211313", "231113", "231311",
    "112133", "112331", "132131", "113123", "113321", "133121", "313121",
    "211331", "231131", "213113", "213311", "213131", "311123", "311321",
    "331121", "312113", "312311", "332111", "314111", "221411", "431111",
    "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114",
    "413111", "241112", "134111", "111242", "121142", "121241", "114212",
    "124112", "124211", "411212", "421112", "421211", "212141", "214121",
    "412121", "111143", "111341", "131141", "114113", "114311", "411113",
    "411311", "113141", "114131", "311141", "411131", "211412", "211214",
    "211232", "2331112",
  ];

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function canEncodeCode128(text) {
    return /^[ -~]+$/.test(text);
  }

  function getCode128Values(text) {
    const values = [104];

    for (const character of text) {
      const code = character.charCodeAt(0);
      if (code < 32 || code > 127) {
        throw new Error(`Karakter tidak didukung Code 128 B: ${character}`);
      }
      values.push(code - 32);
    }

    let checksum = values[0];
    values.slice(1).forEach((value, index) => {
      checksum += value * (index + 1);
    });

    values.push(checksum % 103);
    values.push(106);
    return values;
  }

  function renderCode128Svg(code, title = "", options = {}) {
    const moduleWidth = options.moduleWidth || 2;
    const barHeight = options.barHeight || 82;
    const quietZone = options.quietZone || 20;
    const values = getCode128Values(code);
    const patterns = values.map((value) => code128Patterns[value]);
    const moduleCount = patterns.reduce(
      (total, pattern) => total + [...pattern].reduce((sum, width) => sum + Number(width), 0),
      0
    );
    const width = moduleCount * moduleWidth + quietZone * 2;
    const height = barHeight + 48;
    let x = quietZone;
    let rects = "";

    patterns.forEach((pattern) => {
      let black = true;
      [...pattern].forEach((widthUnit) => {
        const barWidth = Number(widthUnit) * moduleWidth;
        if (black) {
          rects += `<rect x="${x}" y="12" width="${barWidth}" height="${barHeight}" />`;
        }
        x += barWidth;
        black = !black;
      });
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Barcode ${escapeXml(code)}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <g fill="#000000">${rects}</g>
  <text x="${width / 2}" y="${barHeight + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(code)}</text>
  <text x="${width / 2}" y="${barHeight + 46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12">${escapeXml(title)}</text>
</svg>`;
  }

  window.defaultBookDatabase = defaultBookDatabase;
  window.canEncodeCode128 = canEncodeCode128;
  window.renderCode128Svg = renderCode128Svg;
})();
