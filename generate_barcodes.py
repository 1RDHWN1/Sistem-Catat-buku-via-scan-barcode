from pathlib import Path


BAR_PATTERNS = [
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
]


BOOKS = {
    "BK001": "Matematika",
    "BK002": "IPA",
    "BK003": "Bahasa Indonesia",
    "BK004": "Informatika",
    "BK005": "Sejarah Indonesia",
}


def code128_b_values(text):
    values = [104]

    for character in text:
        code = ord(character)
        if code < 32 or code > 127:
            raise ValueError(f"Karakter tidak didukung Code 128 B: {character!r}")
        values.append(code - 32)

    checksum = values[0]
    for index, value in enumerate(values[1:], start=1):
        checksum += value * index

    values.append(checksum % 103)
    values.append(106)
    return values


def render_svg(code, title, module_width=2, bar_height=82, quiet_zone=20):
    values = code128_b_values(code)
    patterns = [BAR_PATTERNS[value] for value in values]
    module_count = sum(sum(int(width) for width in pattern) for pattern in patterns)
    width = (module_count * module_width) + (quiet_zone * 2)
    height = bar_height + 48
    x = quiet_zone
    rects = []

    for pattern in patterns:
        black = True
        for width_units in pattern:
            bar_width = int(width_units) * module_width
            if black:
                rects.append(
                    f'<rect x="{x}" y="12" width="{bar_width}" height="{bar_height}" />'
                )
            x += bar_width
            black = not black

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="Barcode {code}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <g fill="#000000">
    {"".join(rects)}
  </g>
  <text x="{width / 2}" y="{bar_height + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700">{code}</text>
  <text x="{width / 2}" y="{bar_height + 46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12">{title}</text>
</svg>
"""


def render_printable_page(items):
    cards = []

    for code, title in items.items():
        cards.append(
            f"""<article class="card">
      <img src="{code}.svg" alt="Barcode {code}" />
      <div>
        <strong>{code}</strong>
        <span>{title}</span>
      </div>
    </article>"""
        )

    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Barcode Buku Perpustakaan</title>
    <style>
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        background: #f4f6f8;
        color: #202124;
        font-family: Arial, sans-serif;
      }}
      main {{
        width: min(980px, calc(100% - 28px));
        margin: 0 auto;
        padding: 24px 0;
      }}
      h1 {{ margin: 0 0 16px; font-size: 28px; }}
      .grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }}
      .card {{
        border: 1px solid #d9dee8;
        border-radius: 8px;
        background: #ffffff;
        padding: 14px;
        page-break-inside: avoid;
      }}
      img {{ width: 100%; height: auto; display: block; }}
      strong, span {{ display: block; text-align: center; }}
      strong {{ margin-top: 8px; font-size: 18px; }}
      span {{ color: #626975; }}
      @media print {{
        body {{ background: #ffffff; }}
        main {{ width: 100%; padding: 0; }}
        .card {{ box-shadow: none; }}
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>Barcode Buku Perpustakaan</h1>
      <section class="grid">
        {"".join(cards)}
      </section>
    </main>
  </body>
</html>
"""


def main():
    output_dir = Path("web-barcode") / "barcodes"
    output_dir.mkdir(parents=True, exist_ok=True)

    for code, title in BOOKS.items():
        (output_dir / f"{code}.svg").write_text(
            render_svg(code, title), encoding="utf-8"
        )

    (output_dir / "printable-barcodes.html").write_text(
        render_printable_page(BOOKS), encoding="utf-8"
    )

    print(f"Generated {len(BOOKS)} barcode SVG files in {output_dir}")


if __name__ == "__main__":
    main()
