"""Compare every page's text and render all pages for visual review."""
from pathlib import Path
import json
import re
import unicodedata
import pymupdf as fitz
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
source = fitz.open(root / 'Report.pdf')
result = fitz.open(root / 'dist' / 'main.pdf')
out = root / 'rendered'
out.mkdir(exist_ok=True)

def normalize(text):
    # PDF source omits some encoded spaces; compare all non-space characters
    # in content-stream order, retaining punctuation, digits and Vietnamese marks.
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text))

rows = []
for i, page in enumerate(source):
    a, b = normalize(page.get_text()), normalize(result[i].get_text())
    rows.append(dict(page=i+1, original_characters=len(a),
                     converted_characters=len(b), identical=a==b))
    for name, p in [('original', page), ('converted', result[i])]:
        pix = p.get_pixmap(matrix=fitz.Matrix(1.2,1.2), alpha=False)
        pix.save(out / f'{name}-{i+1:02}.png')

for start in range(0,len(source),20):
    sheet = Image.new('RGB',(1240,1600),'#cccccc')
    draw = ImageDraw.Draw(sheet)
    for offset in range(min(20,len(source)-start)):
        i = start+offset
        x,y = (offset%4)*310, (offset//4)*320
        draw.text((x+5,y+3),f'{i+1}: original | LaTeX',fill='black')
        for k,name in enumerate(['original','converted']):
            thumb = Image.open(out/f'{name}-{i+1:02}.png')
            thumb.thumbnail((151,295))
            sheet.paste(thumb,(x+2+k*154,y+22))
    sheet.save(out/f'comparison-{start+1:02}-{min(start+20,len(source)):02}.png')

summary = dict(original_pages=len(source), converted_pages=len(result),
               all_pages_identical=(len(source)==len(result) and all(r['identical'] for r in rows)),
               comparison='NFKC, whitespace removed; all other characters retained in PDF stream order',
               pages=rows)
(out/'verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
assert summary['all_pages_identical'], 'Text differs from supplied Report.pdf'
