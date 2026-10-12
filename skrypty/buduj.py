#!/usr/bin/env python3
"""Build GitHub Pages + discover materialy. Standard library only.

RULES:
- materialy/<category>/<file> -> 1 project per supported file.
- materialy/<category>/<directory>/... -> 1 project for all files in directory.
- optional standalone metadata: <filename.ext>.json next to file.
- optional directory metadata: projekt.json in directory.
- no metadata needed for auto display. Downloads remain publicly accessible.
"""
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / '_site'
CATEGORY_MAP = {
    'grafiki': 'Grafiki',
    'teksty': 'Teksty',
    'dzwiek': 'Dźwięk i muzyka',
    'filmy': 'Filmy i animacje',
    'komiksy': 'Komiksy',
    'strony-www': 'Strony i aplikacje WWW',
    'gry': 'Gry',
    'techniczne-3d': 'Projekty techniczne i 3D',
    'analizy-prezentacje': 'Analizy i prezentacje',
}
KINDS = {
    'image': {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'},
    'audio': {'.mp3', '.wav', '.ogg', '.m4a'},
    'video': {'.mp4', '.webm'},
    'pdf': {'.pdf'},
    'text': {'.txt', '.md'},
    'html': {'.html', '.htm'},
    'other': {'.docx', '.pptx', '.xlsx', '.csv', '.zip', '.stl', '.step', '.stp', '.dxf', '.ino', '.css', '.js', '.py', '.ipynb', '.obj', '.gcode', '.glb', '.gltf', '.odt', '.odp', '.ods', '.json'},
}
TYPES = {ext: kind for kind, exts in KINDS.items() for ext in exts}
EXCLUDE = {'projekt.json', '.gitkeep', '.ds_store', 'thumbs.db'}


def classify(file):
    if file.name.lower() in EXCLUDE or file.name.startswith('.') or file.name.lower().endswith('.json.json'):
        return None
    if file.name.lower().endswith('.json') and file.suffix.lower() == '.json':
        # JSON only if it is a primary asset? Sidecar metadata always excluded.
        return None
    return TYPES.get(file.suffix.lower())


def presentable(name):
    s = Path(name).stem.replace('_', ' ').replace('-', ' ')
    return ' '.join(s.split()).strip().capitalize() or 'Nowy projekt'


def encoded_path(file):
    return '/'.join(quote(part, safe='') for part in file.relative_to(ROOT).parts)


def load_meta(path):
    if not path.exists():
        return {}
    try:
        value = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(value, dict):
            raise ValueError('Oczekiwano obiektu JSON')
        return value
    except (OSError, ValueError, UnicodeDecodeError) as e:
        print(f'BŁĄD: niepoprawny plik opisu {path.relative_to(ROOT)}: {e}', file=sys.stderr)
        sys.exit(2)


def commit_date(path):
    # Stable content dates: last commit affecting this file/folder.
    try:
        res = subprocess.run(['git','log','-1','--format=%cs','--',str(path.relative_to(ROOT))], cwd=ROOT,
                             capture_output=True, text=True, timeout=4, check=False)
        if res.returncode==0 and res.stdout.strip():
            return res.stdout.strip()
    except (OSError, ValueError, subprocess.TimeoutExpired):
        pass
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).date().isoformat()


def find_files(folder):
    return sorted((f for f in folder.rglob('*') if f.is_file() and classify(f)), key=lambda p:p.as_posix().lower())


def collect_file(file):
    return {'nazwa': file.name, 'sciezka': encoded_path(file), 'typ': classify(file), 'rozmiar': file.stat().st_size}


def valid_preview(meta, parent):
    name = meta.get('miniatura','')
    if not isinstance(name, str) or not name or name.startswith('/') or '..' in Path(name).parts:
        return None
    candidate = (parent/name).resolve()
    if not candidate.is_relative_to(ROOT.resolve()) or not candidate.is_file() or classify(candidate) != 'image':
        print(f'UWAGA: nie znaleziono miniatury {name} w {parent.relative_to(ROOT)}')
        return None
    return candidate


def make_project(category, subject, files, meta, directory=False):
    if not files and not meta.get('link'):
        return None
    project_path = subject.relative_to(ROOT).as_posix()
    parent = subject if directory else subject.parent
    thumb = valid_preview(meta, parent) or next((f for f in files if classify(f)=='image'), None)
    tools = meta.get('narzedzia', [])
    if isinstance(tools, str): tools=[t.strip() for t in tools.split(',') if t.strip()]
    if not isinstance(tools, list): tools=[]
    tools = [str(t)[:80] for t in tools if str(t).strip()][:12]
    return {
        'id': project_path,
        'kategoria': category,
        'tytul': str(meta.get('tytul') or presentable(subject.name))[:160],
        'opis': str(meta.get('opis') or 'Otwórz, aby zobaczyć materiały tej pracy.')[:1200],
        'szczegoly': str(meta.get('szczegoly') or '')[:10000],
        'narzedzia': tools,
        'prompt': str(meta.get('prompt') or '')[:15000],
        'refleksja': str(meta.get('refleksja') or '')[:10000],
        'data': str(meta.get('data') or commit_date(subject))[:10],
        'miniatura': encoded_path(thumb) if thumb else '',
        'link': str(meta.get('link') or '')[:1000],
        'pliki': [collect_file(f) for f in files],
        'folder': directory,
    }


def discover():
    output=[]
    for category in CATEGORY_MAP:
        base=ROOT/'materialy'/category
        if not base.exists(): continue
        for item in sorted(base.iterdir(),key=lambda f:f.name.lower()):
            if item.name.startswith('.'):continue
            if item.is_dir():
                files=find_files(item)
                meta=load_meta(item/'projekt.json')
                project=make_project(category,item,files,meta,True)
            elif item.is_file() and classify(item):
                meta=load_meta(item.parent/(item.name+'.json'))
                project=make_project(category,item,[item],meta,False)
            else:continue
            if project:output.append(project)
    return output


def build():
    output=discover()
    if OUTPUT.exists(): shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    for file in ['index.html','app.js','style.css','profil.json','.nojekyll']:
        shutil.copy2(ROOT/file,OUTPUT/file)
    for folder in ['materialy','assets','generator']:
        shutil.copytree(ROOT/folder, OUTPUT/folder, ignore=shutil.ignore_patterns('.DS_Store','__pycache__','.gitkeep'))
    data=OUTPUT/'dane';data.mkdir()
    (data/'katalog.json').write_text(json.dumps({'wersja':1,'projekty':output},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Gotowe: {len(output)} projektów; '+', '.join(f'{x["tytul"]} ({len(x["pliki"])} plików)' for x in output))
    print(f'Strona: {OUTPUT}')
    return output


if __name__=='__main__':build()
