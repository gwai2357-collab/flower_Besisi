"""DOSSaemmul.ttf → src/fonts/DOSSaemmul.woff2 (한글 전체 + 영문·기본 문장부호만). 사용: python tools/make_font.py <DOSSaemmul.ttf 경로>   (pip install fonttools brotli)"""
import sys, pathlib
from fontTools.ttLib import TTFont
from fontTools import subset
src = sys.argv[1]; out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'fonts' / 'DOSSaemmul.woff2'
f = TTFont(src); cm = f.getBestCmap()
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
want = list(range(0x20, 0x7F)) + list(range(0xAC00, 0xD7A4)) + list(range(0x3131, 0x318F)) + [ord(c) for c in '·…‘’“”–—•']
s = subset.Subsetter(opts); s.populate(unicodes=[u for u in want if u in cm]); s.subset(f); subset.save_font(f, out, opts)
print(out, out.stat().st_size // 1024, 'KB')
