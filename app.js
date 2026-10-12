/* PORTFOLIO AI 2.0
   Informacje o projektach powstają AUTOMATYCZNIE podczas GitHub Actions,
   na podstawie plików w folderze materialy/. Nie trzeba tu zmieniać nazw plików.
   Opisy opcjonalnie dodaje się przez generator/ jako projekt.json lub plik.ext.json.
*/
const CATEGORIES = [
  ['grafiki', 'Grafiki', '◈', '#eee7ff', '#6540aa'],
  ['teksty', 'Teksty', 'Aa', '#ebf0fd', '#385c98'],
  ['dzwiek', 'Dźwięk i muzyka', '♫', '#e9f6f5', '#297674'],
  ['filmy', 'Filmy i animacje', '▶', '#fce9ef', '#a74c72'],
  ['komiksy', 'Komiksy', '✳', '#fff0e5', '#a46835'],
  ['strony-www', 'Strony i aplikacje WWW', '</>', '#ebecff', '#5158a1'],
  ['gry', 'Gry', '✦', '#ebf5e8', '#427340'],
  ['techniczne-3d', 'Projekty techniczne i 3D', '3D', '#ebf0f5', '#4a6680'],
  ['analizy-prezentacje', 'Analizy i prezentacje', '▤', '#fff2dd', '#946324']
];
const CATEGORY_INFO = Object.fromEntries(CATEGORIES.map(c => [c[0], c]));
const $ = id => document.getElementById(id);
let projects = [], categorySelected = 'wszystkie', activeProject = null;
const base = new URL('./', document.baseURI);
const node = (tag, className, content) => { const n = document.createElement(tag); if(className) n.className = className; if(content !== undefined) n.textContent = content; return n; };
const urlFor = path => new URL(path, base).href;
const safeLink = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const formatSize = bytes => !bytes ? '' : bytes < 1024*1024 ? `${Math.max(1,Math.round(bytes/1024))} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`;
const basename = s => s.split('/').pop();
function setProfile(profile){
  $('hero-author').textContent=profile.imie || 'Autor portfolio';
  $('footer-author').textContent=profile.imie || 'Autor portfolio';
  $('hero-desc').textContent=profile.powitanie || 'Tu prezentuję efekty mojej pracy z AI.';
  $('about-description').textContent=profile.opis || '';
  $('about-field').textContent=profile.kierunek || '';
  $('skills-intro').textContent=profile.opis_umiejetnosci || '';
  document.title=(profile.imie ? profile.imie+' — ' : '')+'Moje portfolio AI';
  const interests=$('interests'); interests.replaceChildren();
  (Array.isArray(profile.zainteresowania)?profile.zainteresowania:[]).forEach(t=>interests.append(node('span','chip',String(t))));
  const list=$('skills-list');list.replaceChildren();
  (Array.isArray(profile.umiejetnosci)?profile.umiejetnosci:[]).forEach((t,i)=>{
    const item=node('div','skill');item.append(node('span','',String(i+1).padStart(2,'0')),node('h3','',String(t)));list.append(item);
  });
  if(profile.zdjecie && typeof profile.zdjecie==='string' && !profile.zdjecie.includes('..')){
    const img=node('img');img.alt='Zdjęcie autora portfolio';img.src= urlFor(profile.zdjecie);
    img.onload=()=>{$('avatar').replaceChildren(img);};
  }
  const gh=safeLink(profile.github||''); if(gh){$('github-link').href=gh;$('github-link').hidden=false;}
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email||'')){$('contact-link').href='mailto:'+encodeURIComponent(profile.email);$('contact-link').hidden=false;}
}
function createFilters(){
  const bar=$('filters');bar.replaceChildren();
  [['wszystkie','Wszystkie'], ...CATEGORIES.map(c=>[c[0],c[1]])].forEach(([key,label])=>{
    const btn=node('button','filter',label);btn.type='button';btn.setAttribute('aria-pressed',String(key===categorySelected));
    btn.addEventListener('click',()=>{categorySelected=key;render();});bar.append(btn);
  });
}
function placeholder(p){
  const c=CATEGORY_INFO[p.kategoria]||CATEGORY_INFO.grafiki;
  const box=node('div','thumb-blank');box.style.setProperty('--bg',c[3]);box.style.setProperty('--fg',c[4]);
  box.append(node('small','',c[1].toUpperCase()),node('b','',c[2]),node('span','','Projekt AI / portfolio'));return box;
}
function card(p){
  const root=node('article','project-card');
  const thumb=node('button','card-thumb');thumb.type='button';thumb.setAttribute('aria-label','Otwórz projekt '+p.tytul);
  if(p.miniatura){const img=node('img');img.src=urlFor(p.miniatura);img.alt='Miniatura projektu: '+p.tytul;img.loading='lazy';img.onerror=()=>thumb.replaceChildren(placeholder(p));thumb.append(img);}else thumb.append(placeholder(p));
  if(p.pliki?.length>1) thumb.append(node('span','thumb-count',p.pliki.length+' pliki'));
  thumb.addEventListener('click',()=>openProject(p));
  const body=node('div','card-body');
  body.append(node('span','card-category',CATEGORY_INFO[p.kategoria]?.[1]||p.kategoria),node('h3','',p.tytul),node('p','',p.opis||'Zobacz efekty tej pracy.'));
  const meta=node('div','card-meta');meta.append(node('span','',Array.isArray(p.narzedzia)?p.narzedzia.slice(0,2).join(' · '):''),node('span','',p.pliki?.length+' zał.'));
  const actions=node('div','card-footer');const details=node('button','btn secondary','Zobacz projekt →');details.type='button';details.addEventListener('click',()=>openProject(p));actions.append(details);
  if(p.pliki?.length===1){const dl=node('a','btn subtle','Pobierz ↓');dl.href=urlFor(p.pliki[0].sciezka);dl.download=basename(p.pliki[0].sciezka);dl.setAttribute('aria-label','Pobierz '+p.pliki[0].nazwa);actions.append(dl);}
  body.append(meta,actions);root.append(thumb,body);return root;
}
function render(){
  const text=$('search').value.trim().toLocaleLowerCase('pl');
  let list=projects.filter(p=>(categorySelected==='wszystkie'||p.kategoria===categorySelected)&&(!text||[p.tytul,p.opis,(p.narzedzia||[]).join(' ')].join(' ').toLocaleLowerCase('pl').includes(text)));
  if($('sort').value==='name') list.sort((a,b)=>a.tytul.localeCompare(b.tytul,'pl'));
  else if($('sort').value==='category') list.sort((a,b)=>a.kategoria.localeCompare(b.kategoria,'pl')||a.tytul.localeCompare(b.tytul,'pl'));
  else list.sort((a,b)=>(b.data||'').localeCompare(a.data||'')||a.tytul.localeCompare(b.tytul,'pl'));
  $('project-grid').replaceChildren(...list.map(card));$('empty').hidden=!!list.length;
  $('count').textContent=`Wyświetlane projekty: ${list.length} / ${projects.length}`;
  document.querySelectorAll('.filter').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent=== (categorySelected==='wszystkie'?'Wszystkie':CATEGORY_INFO[categorySelected]?.[1]))));
}
function mediaFile(file){
  const wrap=node('div','media-item');const url=urlFor(file.sciezka);const kind=file.typ;
  if(kind==='image'){
    const a=node('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.title='Otwórz obraz w pełnym rozmiarze';
    const img=node('img');img.src=url;img.alt=file.nazwa;img.loading='lazy';a.append(img);wrap.append(a);
  } else if(kind==='audio'){
    const audio=node('audio');audio.controls=true;audio.preload='none';audio.src=url;wrap.append(audio);
  } else if(kind==='video'){
    const video=node('video');video.controls=true;video.preload='metadata';video.src=url;wrap.append(video);
  } else if(kind==='pdf'){
    const obj=node('iframe');obj.src=url;obj.title='Podgląd dokumentu '+file.nazwa;obj.loading='lazy';wrap.append(obj);
  } else if(kind==='text'){
    const pre=node('pre','', 'Wczytywanie tekstu…');const textwrap=node('div','media-item text-item');textwrap.append(pre);
    fetch(url).then(r=>{if(!r.ok)throw Error('Brak dostępu');return r.text();}).then(t=>{pre.textContent=t.slice(0,20000)+(t.length>20000?'\n\n[Podgląd skrócony — pobierz pełny plik]':'');}).catch(()=>{pre.textContent='Nie można otworzyć podglądu tekstu. Pobierz plik.';});
    return textwrap;
  } else {
    const pl=node('div','media-placeholder');pl.append(node('span','media-icon',kind==='html'?'⌘':'⬇'),node('span','',kind==='html'?'Strona WWW / pliki projektu':'Plik dostępny do pobrania'));wrap.append(pl);
  }
  wrap.append(node('div','media-label',file.nazwa));return wrap;
}
function addDetail(parent,title,value,asCode=false){if(!value)return;const section=node('section','details-block');section.append(node('h3','',title),node(asCode?'pre':'p','',String(value)));parent.append(section);}
function openProject(p, fromHash=false){
  activeProject=p;$('dialog-category').textContent=CATEGORY_INFO[p.kategoria]?.[1]||p.kategoria;
  $('dialog-title').textContent=p.tytul;$('dialog-description').textContent=p.opis||'';
  $('dialog-tags').replaceChildren(...(p.narzedzia||[]).map(n=>node('span','chip',n)));
  const media=$('dialog-media');media.replaceChildren();
  const preview=(p.pliki||[]).filter(f=>['image','audio','video','pdf','text'].includes(f.typ)).slice(0,12);
  preview.forEach(f=>media.append(mediaFile(f)));
  media.hidden=preview.length===0;
  const more=$('dialog-more');more.replaceChildren();addDetail(more,'O projekcie',p.szczegoly);addDetail(more,'Prompt / polecenie',p.prompt,true);addDetail(more,'Czego się nauczyłem?',p.refleksja);
  const files=$('dialog-files');files.replaceChildren();
  if(p.pliki?.length||p.link){files.append(node('h3','','Pliki i odnośniki'));}
  (p.pliki||[]).forEach(f=>{const row=node('div','download-entry');row.append(node('span','',`${f.nazwa}${f.rozmiar?' · '+formatSize(f.rozmiar):''}`));const a=node('a','',f.typ==='html'?'Uruchom ↗':'Pobierz ↓');a.href=urlFor(f.sciezka);a.target='_blank';a.rel='noopener noreferrer';if(f.typ!=='html')a.download=f.nazwa;row.append(a);files.append(row);});
  const external=safeLink(p.link||'');if(external){const row=node('div','download-entry');row.append(node('span','','Link do projektu / dużego pliku'));const a=node('a','','Otwórz ↗');a.href=external;a.target='_blank';a.rel='noopener noreferrer';row.append(a);files.append(row);}
  const dialog=$('project-dialog');if(!dialog.open)dialog.showModal();document.body.style.overflow='hidden';
  if(!fromHash)history.replaceState(null,'',location.pathname+location.search+'#projekt='+encodeURIComponent(p.id));
}
function closeProject(){if($('project-dialog').open)$('project-dialog').close();}
function handleHash(){const match=location.hash.match(/^#projekt=(.+)$/);if(!match){closeProject();return;}try{const id=decodeURIComponent(match[1]);const p=projects.find(x=>x.id===id);if(p)openProject(p,true);}catch{}}
async function init(){
  $('year').textContent=new Date().getFullYear();createFilters();
  $('search').addEventListener('input',render);$('sort').addEventListener('change',render);
  $('dialog-close').addEventListener('click',closeProject);$('dialog-back').addEventListener('click',closeProject);
  $('project-dialog').addEventListener('close',()=>{document.body.style.overflow='';if(location.hash.startsWith('#projekt='))history.replaceState(null,'',location.pathname+location.search+'#projekty');});
  $('project-dialog').addEventListener('click',e=>{if(e.target===$('project-dialog'))closeProject();});
  $('share-button').addEventListener('click',async()=>{if(!activeProject)return;const href=new URL(location.pathname+location.search+'#projekt='+encodeURIComponent(activeProject.id),location.href).href;try{await navigator.clipboard.writeText(href);$('share-button').textContent='Skopiowano ✓';setTimeout(()=>{$('share-button').textContent='Kopiuj link do projektu ↗';},2000);}catch{prompt('Skopiuj adres projektu:',href);}});
  window.addEventListener('hashchange',handleHash);
  try{const response=await fetch(urlFor('profil.json'),{cache:'no-cache'});if(response.ok)setProfile(await response.json());}catch(e){console.warn('Nie można wczytać profilu:',e);}
  try{
    const response=await fetch(urlFor('dane/katalog.json'),{cache:'no-cache'});if(!response.ok)throw Error('Brak katalogu (HTTP '+response.status+')');
    const catalog=await response.json();projects=Array.isArray(catalog.projekty)?catalog.projekty:[];
    $('counter-projects').textContent=projects.length;$('counter-categories').textContent=new Set(projects.map(p=>p.kategoria)).size;
    $('counter-files').textContent=projects.reduce((sum,p)=>sum+(p.pliki?.length||0),0);
    render();handleHash();
  }catch(e){$('count').textContent='Nie udało się załadować katalogu';$('load-error').hidden=false;$('load-error').textContent='Nie udało się odczytać spisu projektów. Upewnij się, że GitHub Pages publikuje za pomocą GitHub Actions, a w zakładce Actions ostatnia publikacja zakończyła się pomyślnie. Przy otwieraniu index.html bezpośrednio z dysku przeglądarka może blokować odczyt danych. Szczegóły: '+e.message;}
}
init();
