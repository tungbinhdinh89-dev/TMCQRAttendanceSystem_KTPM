"""Reconstruct the supplied PDF as editable Unicode LaTeX and TikZ paths.

Run from the workspace root with PYTHONPATH=report/.tools.
No page images or source-PDF inclusion are used in the resulting document.
"""
from pathlib import Path
import math
import json
import re
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
doc = fitz.open(ROOT / 'Report.pdf')
(ROOT / 'pages').mkdir(exist_ok=True)
(ROOT / 'figures' / 'original').mkdir(exist_ok=True)

def num(x):
    return f'{x:.5f}'.rstrip('0').rstrip('.') or '0'

def point(p):
    return f'({num(p.x)},{num(p.y)})'

def color(c):
    if c is None:
        return 'black'
    if len(c) == 1:
        c = c * 3
    return '{rgb,1:red,'+num(c[0])+';green,'+num(c[1])+';blue,'+num(c[2])+'}'

def escape(s):
    replacements = {'\\': r'\textbackslash{}', '{': r'\{', '}': r'\}',
                    '%': r'\%', '#': r'\#', '&': r'\&', '_': r'\_',
                    '$': r'\$', '^': r'\textasciicircum{}', '~': r'\textasciitilde{}',
                    '≤': r'\ensuremath{\leq}', '×': r'\ensuremath{\times}'}
    return ''.join(replacements.get(c, c) for c in s)

def family(font):
    if font.startswith('VNBX'):
        return r'\ReportBold'
    if font.startswith('VNTI') or font.startswith('CMMI'):
        return r'\ReportItalic'
    if font.startswith('VNTT'):
        return r'\ReportMono'
    return r'\ReportRoman'

manifest = []
for pi, page in enumerate(doc):
    out = [f'% Trang {pi+1} của Report.pdf. Chữ UTF-8 và nét vẽ TikZ có thể chỉnh sửa.',
           r'\begin{ReportPage}']
    # Keep all non-text artwork as native editable TikZ, including table rules.
    for path in page.get_drawings():
        opts = ['line width='+num(path.get('width') or 0)+'bp',
                'line cap='+{0:'butt',1:'round',2:'rect'}.get(max(path.get('lineCap') or (0,)), 'butt'),
                'line join='+{0:'miter',1:'round',2:'bevel'}.get(int(path.get('lineJoin') or 0),'miter')]
        if 's' in path['type']:
            opts += ['draw='+color(path.get('color')), 'draw opacity='+num(path.get('stroke_opacity',1))]
        if 'f' in path['type']:
            opts += ['fill='+color(path.get('fill')), 'fill opacity='+num(path.get('fill_opacity',1))]
        if path.get('even_odd'):
            opts.append('even odd rule')
        dash = re.search(r'\[([^]]+)\]', path.get('dashes') or '')
        if dash and dash.group(1).strip():
            vals = [float(v) for v in dash.group(1).split()]
            opts.append('dash pattern='+' '.join(('on ' if i%2==0 else 'off ')+num(v)+'bp' for i,v in enumerate(vals)))
        pieces = []
        last = None
        for item in path['items']:
            if item[0] == 're':
                rect = item[1]
                pieces.append(point(rect.tl)+' rectangle '+point(rect.br))
                last = None
            elif item[0] in ('l','c'):
                start = item[1]
                if last is None or abs(start-last)>0.001:
                    pieces.append(point(start))
                if item[0] == 'l':
                    pieces.append('-- '+point(item[2]))
                    last = item[2]
                else:
                    pieces.append('.. controls '+point(item[2])+' and '+point(item[3])+' .. '+point(item[4]))
                    last = item[4]
        if path.get('closePath'):
            pieces.append('-- cycle')
        if pieces:
            out.append('\\path['+','.join(opts)+'] '+' '.join(pieces)+';')
    # Only actual embedded raster assets (the university logo) remain images.
    for im in page.get_image_info(xrefs=True):
        xref = im['xref']
        target = ROOT / 'figures' / 'original' / f'image-{xref}.png'
        if not target.exists():
            pix = fitz.Pixmap(doc,xref)
            img = doc.extract_image(xref)
            if img.get('smask'):
                pix = fitz.Pixmap(pix,fitz.Pixmap(doc,img['smask']))
            pix.save(target)
        x0,y0,x1,y1 = im['bbox']
        out.append(f'\\node[anchor=north west,inner sep=0pt] at ({num(x0)},{num(y0)}) '
                   '{\\includegraphics[width='+num(x1-x0)+'bp,height='+num(y1-y0)+'bp]{figures/original/'+target.name+'}};')
    page_text = []
    for block in page.get_text('rawdict')['blocks']:
        if 'lines' not in block:
            continue
        out.append('% --- Khối văn bản ---')
        for line in block['lines']:
            spans = line['spans']
            previous = None
            for span in spans:
                recovered = []
                for char in span['chars']:
                    if (previous and line['dir'] == (1.0, 0.0)
                            and not previous['c'].isspace() and not char['c'].isspace()
                            and char['bbox'][0]-previous['bbox'][2] > span['size']*0.13):
                        recovered.append(' ')
                    recovered.append(char['c'])
                    previous = char
                span['text'] = ''.join(recovered)
            page_text.append(''.join(s['text'] for s in spans))
            # Merge adjacent spans of identical style so complete text lines
            # stay readable in the source. Preserve changes in bold/italic.
            groups = []
            for span in spans:
                key = (span['font'],round(span['size'],4),span['color'])
                if groups and groups[-1]['key']==key:
                    groups[-1]['text'] += span['text']
                    groups[-1]['bbox'] |= fitz.Rect(span['bbox'])
                else:
                    groups.append(dict(key=key,text=span['text'],bbox=fitz.Rect(span['bbox']),origin=span['origin']))
            dx,dy = line['dir']
            angle = -math.degrees(math.atan2(dy,dx))
            for group in groups:
                text = group['text']
                if not text.strip():
                    continue
                font,size,c = group['key']
                x,y = group['origin']
                box = group['bbox']
                # Project bbox extent onto the text direction.
                width = box.width if abs(dy)<0.001 else max(0.1,box.width*abs(dx)-box.height*abs(dy))
                rgb = ((c>>16&255)/255,(c>>8&255)/255,(c&255)/255)
                opts = 'anchor=base west,inner sep=0pt,outer sep=0pt'
                if abs(angle)>0.001:
                    opts += ',rotate='+num(angle)
                out.append('\\node['+opts+'] at ('+num(x)+','+num(y)+') '
                    '{\\ReportText{'+num(width)+'}{'+num(size)+'}{'+family(font)+'}{'+','.join(num(v) for v in rgb)+'}{'+escape(text)+'}};')
    out += [r'\end{ReportPage}', '']
    (ROOT/'pages'/f'page-{pi+1:02}.tex').write_text('\n'.join(out),encoding='utf-8')
    manifest.append({'page':pi+1,'lines':page_text})

(ROOT/'.tools'/'content-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
main = ['% !TeX program = lualatex',
        '% Toàn bộ nội dung Report.pdf; không dùng pdfpages hoặc ảnh chụp trang.',
        r'\documentclass{article}',r'\input{reproduction-preamble.tex}',r'\begin{document}']
for i in range(len(doc)):
    main.append('\\input{pages/page-'+f'{i+1:02}'+'}')
main += [r'\end{document}','']
(ROOT/'main.tex').write_text('\n'.join(main),encoding='utf-8')
print(f'Converted {len(doc)} pages; {sum(len(m["lines"]) for m in manifest)} editable text lines.')
