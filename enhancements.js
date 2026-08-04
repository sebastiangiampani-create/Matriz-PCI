(()=>{
const FORMATS=['Nivel','Laboratorio','Taller','Seminario','Proyecto','Módulo','Espacio integrado','Ateneo','Clínica','Observatorio','Otro'];
const TERM_AREAS=new Set(['Artes','Tecnologías']);
const $=id=>document.getElementById(id);
function current(){try{return window.app?.current||window.eval('app').current}catch{return null}}
function state(){try{return window.app||window.eval('app')}catch{return null}}
function persist(){try{localStorage.setItem('pciAppV2',JSON.stringify(state()))}catch{}}
function ensureData(){const s=state();if(!s?.areas)return;Object.values(s.areas).forEach(a=>(a.groups||[]).forEach(g=>{if(g.format==null)g.format='';if(g.term==null)g.term=''}));persist()}
function termOptions(v){return '<option value="">Seleccionar cuatrimestre</option>'+Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${String(v)===String(n)?'selected':''}>Cuatrimestre ${n}</option>`).join('')}
function formatOptions(v){const known=FORMATS.includes(v)?v:(v?'Otro':'');return '<option value="">Seleccionar formato</option>'+FORMATS.map(x=>`<option ${known===x?'selected':''}>${x}</option>`).join('')}
function enhanceCards(){const area=current(),s=state();if(!area||!s?.areas?.[area])return;ensureData();document.querySelectorAll('#groups .group').forEach((card,i)=>{const g=s.areas[area].groups[i];if(!g)return;const editor=card.querySelector('.editor');if(!editor||editor.querySelector('.extra-format'))return;
const box=document.createElement('div');box.className='extra-format';box.innerHTML=`<label class="label">Formato pedagógico</label><select class="format-select">${formatOptions(g.format)}</select><div class="custom-wrap" style="display:${g.format&&!FORMATS.includes(g.format)?'block':'none'}"><label class="label">Otro formato</label><input class="group-name custom-format" value="${String(g.format&&!FORMATS.includes(g.format)?g.format:'').replace(/"/g,'&quot;')}" placeholder="Ej.: Proyecto interdisciplinario"></div>${TERM_AREAS.has(area)?`<label class="label">Cuatrimestre de implementación</label><select class="term-select">${termOptions(g.term)}</select>`:''}`;
editor.appendChild(box);
const fs=box.querySelector('.format-select'),cw=box.querySelector('.custom-wrap'),ci=box.querySelector('.custom-format');fs.onchange=()=>{if(fs.value==='Otro'){cw.style.display='block';g.format=ci.value||'Otro'}else{cw.style.display='none';g.format=fs.value}persist()};if(ci)ci.oninput=()=>{g.format=ci.value;persist()};const ts=box.querySelector('.term-select');if(ts)ts.onchange=()=>{g.term=ts.value;persist()};
});}
function addMapButton(){const actions=document.querySelector('.top .actions');if(!actions||$('pciMapButton'))return;const b=document.createElement('button');b.id='pciMapButton';b.className='btn primary';b.textContent='Mapa completo';b.onclick=()=>{persist();window.open('trayectoria-pci.html?v=all-schools-1','_blank')};actions.insertBefore(b,actions.lastElementChild||null)}
function decorateSummary(){document.querySelectorAll('#sumBody .summary').forEach((card,i)=>{if(card.querySelector('.format-summary'))return;const area=current(),s=state(),g=s?.areas?.[area]?.groups?.[i];if(!g)return;const p=document.createElement('p');p.className='format-summary';p.innerHTML=`<b>Formato:</b> ${g.format||'No especificado'}${g.term?` · <b>Cuatrimestre:</b> ${g.term}`:''}`;card.insertBefore(p,card.querySelector('ul'))})}
const obs=new MutationObserver(()=>{addMapButton();enhanceCards();decorateSummary()});obs.observe(document.documentElement,{subtree:true,childList:true});
addMapButton();ensureData();setTimeout(enhanceCards,800);
})();