// js/skins-design.js — skins: mini-ontwerper (nieuwe eigen skin of kopie, live voorbeeld op een kaart, opslaan als gebruikersskin, exporteren)
(function(PK){
/* =====================================================================
   MINI-ONTWERPER · zaadje van de editor van laag 3. Bewerkt alleen `design` (poorten, kleuren, haptiek, knoppen); bij een kopie blijven CSS, assets en verschijningen van het origineel behouden.
   Model D = {dev, cardId, name, author, design (skin-niveau), aps[] (verschijningen met eigen design-overschrijving), dflt, tab}. Tab 0 = skin-niveau (geldt voor alle verschijningen).
   Voorbeeld: een tijdelijke skin PK.SK.draft (id <apparaat>.draft-preview) op de gekozen kaart; Sluiten zet de vorige skin van die kaart terug. Een draft komt nooit in song of werkruimte.
   ===================================================================== */
let D=null;
const clone=o=>JSON.parse(JSON.stringify(o));
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
const slug=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
const EXTRA={compact:{id:'compact',name:'Compact',when:{maxWidth:360}},full:{id:'full',name:'Full',when:{minWidth:361}}};
const draftId=()=>D.dev.toLowerCase()+'.draft-preview';
const card=()=>D&&PK.Host.devices.get(D.cardId);
const isPristine=a=>a.id==='standard'&&!a.design&&!a.css&&!Object.keys(a.assets||{}).length&&!a.when;
const visAps=()=>D.aps.filter((a,i)=>!(i===0&&isPristine(a)));
const ctxDesign=()=>D.tab===0?D.design:(visAps()[D.tab-1].design||(visAps()[D.tab-1].design={}));
const ctxAp=()=>D.tab===0?null:visAps()[D.tab-1];
function getv(g,k){ const x=D.tab===0?D.design:(ctxAp().design||{}); return x[g]&&x[g][k]; }
function setv(g,k,v){ const d=ctxDesign(); if(v===''||v==null){ if(d[g]){ delete d[g][k]; if(!Object.keys(d[g]).length) delete d[g]; } } else { d[g]=d[g]||{}; d[g][k]=v; }
  if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
function getc(k){ const x=D.tab===0?D.design:(ctxAp().design||{}); return x.colors&&x.colors.custom&&x.colors.custom[k]; }
function setc(k,v){ const d=ctxDesign(); d.colors=d.colors||{}; d.colors.custom=d.colors.custom||{}; if(v) d.colors.custom[k]=v; else delete d.colors.custom[k]; if(!Object.keys(d.colors.custom).length) delete d.colors.custom; if(!Object.keys(d.colors).length) delete d.colors; if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
const effScheme=()=>getv('colors','scheme')||(D.tab>0&&D.design.colors&&D.design.colors.scheme)||'workspace';
const effColour=k=>getc(k)||(D.tab>0&&D.design.colors&&D.design.colors.custom&&D.design.colors.custom[k])||null;

// ---- bouwen en voorbeeld ----
function build(preview){ const name=D.name.trim()||'Untitled', id=preview?draftId():D.dev.toLowerCase()+'.'+(slug(name)||'custom'), today=new Date(), pad=n=>String(n).padStart(2,'0');
  const hasCtl=(D.design.controls&&D.design.controls.length)||D.aps.some(a=>a.design&&a.design.controls&&a.design.controls.length);
  const hasMet=(D.design.meters&&D.design.meters.length)||D.aps.some(a=>a.design&&a.design.meters&&a.design.meters.length);
  const hasSec=(D.design.sections&&D.design.sections.length)||D.design.size||D.aps.some(a=>a.design&&((a.design.sections&&a.design.sections.length)||a.design.size));
  const j={format:'patchkamer-skin',formatVersion:1,skinsContract:hasSec?'0.5':hasMet?'0.4':hasCtl?'0.3':'0.2',id,device:D.dev,name:name.slice(0,60),version:D.version||'1.0.0'};
  if(D.author.trim()) j.author=D.author.trim().slice(0,100); j.created=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  if(D.dflt) j.default=D.dflt; if(Object.keys(D.design).length) j.design=clone(D.design);
  j.appearances=D.aps.map(a=>{ const o={id:a.id,name:a.name}; if(a.description) o.description=a.description; if(a.when) o.when=clone(a.when); o.css=a.css||''; if(a.assets&&Object.keys(a.assets).length) o.assets=clone(a.assets); if(a.design&&Object.keys(a.design).length) o.design=clone(a.design); return o; });
  return j; }
function preview(){ const r=card(); if(!r) return; try{ const sk=PK.skValidate(build(true),'preview',[]); PK.SK.draft={skin:sk,file:'',origin:'draft'};
    const ap=D.tab===0?(D.dflt||D.aps[0].id):ctxAp().id; PK.skinSet(D.cardId,sk.id,ap); }catch(e){ PK.status(e.message,true); } ctlStat(); }

// ---- formulier ----
const portsDef=()=>{ const d=PK.Host.latest(D.dev); return !!(d&&d.ui&&d.ui.jacks); };
function selRow(box,label,g,k,opts,hint,disabled){ const row=el('div','dz-row'), lb=el('label',null,label), sel=document.createElement('select'); sel.className='small'; sel.setAttribute('aria-label',label);
  if(D.tab>0){ const o=el('option',null,PK.pkt('m.dz_zoals_skin')); o.value=''; sel.appendChild(o); }
  opts.forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; sel.appendChild(o); }); const cur=getv(g,k); sel.value=cur||(D.tab>0?'':opts[0][0]); sel.disabled=!!disabled;
  sel.onchange=()=>{ const v=sel.value, dflt=opts[0][0]; if(D.tab===0&&v===dflt) setv(g,k,''); else setv(g,k,v); if(g==='colors'&&k==='scheme'){ if(v==='custom') prefill(); paint(); } preview(); };
  row.append(lb,sel); box.appendChild(row); if(hint) box.appendChild(el('div','dz-hint',hint)); return sel; }
// uitgangswaarden voor eigen kleuren: wat de kaart nu toont
function prefill(){ const r=card(); if(!r) return; const pr=document.createElement('span'); pr.style.cssText='position:absolute;visibility:hidden;width:0;height:0'; r.el.appendChild(pr);
  const rd=v=>{ pr.style.color=''; pr.style.color='var('+v+')'; const m=/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(pr).color); return m?PK.cpHex([+m[1],+m[2],+m[3]]):null; };
  const map={bg:'--card',surface:'--card-2',text:'--fg',muted:'--muted',accent:'--sel',line:'--line'}; for(const k in map){ if(!effColour(k)){ const h=rd(map[k]); if(h) setc(k,h); } } pr.remove(); }
function colourRows(box){ const bgOf=()=>effColour('bg'); let openKey=null, pk=null, pkRow=null;
  PK.SK_COLOUR_KEYS.forEach(k=>{ const row=el('div','dz-row'), lb=el('label',null,PK.pkt('m.dz_c_'+k)), cell=el('div','dz-col'), sw=el('button','dz-sw'), hx=el('span','dz-hint'), clr=el('button','small','×');
    sw.type='button'; clr.type='button'; sw.setAttribute('aria-label',PK.pkt('m.dz_c_'+k)); clr.title=PK.pkt('m.dz_c_leeg'); clr.setAttribute('aria-label',PK.pkt('m.dz_c_leeg'));
    const paintSw=()=>{ const v=effColour(k); sw.style.background=v||''; sw.classList.toggle('empty',!v); sw.classList.toggle('on',openKey===k); hx.textContent=v||PK.pkt('m.dz_c_werkruimte'); clr.hidden=!getc(k); };
    sw.onclick=()=>{ if(pk){ pk.destroy(); pk=null; } const was=openKey; openKey=was===k?null:k; box.querySelectorAll('.dz-sw').forEach(b=>b.classList.remove('on'));
      if(openKey){ pk=PK.colourPicker({value:effColour(k)||'#808080',label:PK.pkt('m.dz_c_'+k),against:(k==='text'||k==='muted'||k==='accent')?bgOf:null,min:3,onChange:h=>{ setc(k,h); paintSw(); preview(); },onCommit:h=>{ setc(k,h); paintSw(); preview(); contrastNote(); }}); row.after(pk.el); pkRow=row; sw.classList.add('on'); if(!effColour(k)){ setc(k,pk.get()); paintSw(); preview(); } } paintSw(); };
    clr.onclick=()=>{ setc(k,''); paintSw(); preview(); contrastNote(); }; cell.append(sw,hx,clr); row.append(lb,cell); box.appendChild(row); paintSw(); });
  const note=el('div','dz-warn'); note.setAttribute('role','status'); box.appendChild(note);
  function contrastNote(){ const t=effColour('text'), b=effColour('bg'); const q=t&&b?PK.cpContrast(t,b):null; note.textContent=q&&q<3?PK.pkt('m.dz_contrast',q.toFixed(1)):''; const miss=PK.SK_COLOUR_KEYS.filter(k=>!effColour(k)); if(!note.textContent&&miss.length) { note.className='dz-hint'; note.textContent=PK.pkt('m.dz_c_ontbreekt',miss.map(k=>PK.pkt('m.dz_c_'+k)).join(', ')); } else note.className='dz-warn'; }
  contrastNote(); }
function paint(){ const box=PK.$('skDesign'); if(!box||!D) return; box.innerHTML=''; const r=card(), dv=PK.Host.latest(D.dev), pkt=PK.pkt;
  const h=el('h3',null,pkt('m.dz_titel',dv?dv.name:D.dev)); box.appendChild(h);
  box.appendChild(el('div','note',pkt('m.dz_uitleg',r?r.def.name:'')));
  const nm=el('div','dz-row'), nl=el('label',null,pkt('m.dz_naam')), ni=document.createElement('input'); ni.type='text'; ni.maxLength=60; ni.value=D.name; ni.setAttribute('aria-label',pkt('m.dz_naam')); ni.oninput=()=>{ D.name=ni.value; sv.disabled=ex.disabled=!D.name.trim(); }; nm.append(nl,ni); box.appendChild(nm);
  const au=el('div','dz-row'), al=el('label',null,pkt('m.dz_auteur')), ai=document.createElement('input'); ai.type='text'; ai.maxLength=100; ai.value=D.author; ai.setAttribute('aria-label',pkt('m.dz_auteur')); ai.oninput=()=>{ D.author=ai.value; aw.hidden=!!D.author.trim(); }; au.append(al,ai); box.appendChild(au);
  const aw=el('div','dz-hint',pkt('m.dz_auteur_leeg')); aw.hidden=!!D.author.trim(); box.appendChild(aw);
  // verschijningen
  const tabs=el('div','dz-tabs'); tabs.setAttribute('role','group'); tabs.setAttribute('aria-label',pkt('m.sk_verschijning'));
  const aps=visAps(), tb=(label,i,rm)=>{ const b=el('button','small'+(D.tab===i?' on':''),label); b.type='button'; b.setAttribute('aria-pressed',String(D.tab===i)); b.onclick=()=>{ D.tab=i; paint(); preview(); }; tabs.appendChild(b); if(rm){ const x=el('button','small','×'); x.type='button'; x.title=pkt('m.dz_verschijning_weg'); x.setAttribute('aria-label',pkt('m.dz_verschijning_weg')+' '+label); x.onclick=()=>{ D.aps=D.aps.filter(a=>a!==rm); if(D.tab>aps.length-1) D.tab=0; paint(); preview(); }; tabs.appendChild(x); } };
  tb('Standard',0); aps.forEach((a,i)=>tb(a.name,i+1,(!a.css&&!Object.keys(a.assets||{}).length&&EXTRA[a.id])?a:null));
  const free=Object.keys(EXTRA).filter(k=>!D.aps.some(a=>a.id===k)); if(free.length){ const add=document.createElement('select'); add.className='small'; add.setAttribute('aria-label',pkt('m.dz_verschijning_toevoegen')); const o0=el('option',null,pkt('m.dz_verschijning_toevoegen')); o0.value=''; add.appendChild(o0); free.forEach(k=>{ const o=el('option',null,EXTRA[k].name); o.value=k; add.appendChild(o); });
    add.onchange=()=>{ if(!add.value) return; D.aps.push({...clone(EXTRA[add.value]),css:'',assets:{}}); D.tab=visAps().length; paint(); preview(); }; tabs.appendChild(add); }
  box.appendChild(tabs);
  const ap=ctxAp(); box.appendChild(el('div','dz-hint',ap?(ap.when?pkt('m.dz_when_hint',ap.name,PK_when(ap.when)):pkt('m.dz_tab_alleen')):pkt('m.dz_tab_skin')));
  // poorten
  box.appendChild(el('h4',null,pkt('m.dz_poorten')));
  selRow(box,pkt('m.dz_modus'),'ports','mode',[['default',pkt('m.dz_p_default')],['always',pkt('m.dz_p_always')],['hover',pkt('m.dz_p_hover')],['strip',pkt('m.dz_p_strip')],['bar',pkt('m.dz_p_bar')]],null,portsDef());
  if(portsDef()) box.appendChild(el('div','dz-warn',pkt('m.sk_jacks_paneel')));
  // kleuren
  box.appendChild(el('h4',null,pkt('m.dz_kleuren')));
  selRow(box,pkt('m.dz_schema'),'colors','scheme',[['workspace',pkt('m.dz_s_workspace')],['custom',pkt('m.dz_s_custom')]]);
  if(effScheme()==='custom') colourRows(box);
  // haptiek
  box.appendChild(el('h4',null,pkt('m.dz_haptiek')));
  const lv=[['off',pkt('m.dz_h_off')],['light',pkt('m.dz_h_light')],['medium',pkt('m.dz_h_medium')],['strong',pkt('m.dz_h_strong')]];
  selRow(box,pkt('m.dz_h_click'),'haptics','click',lv); selRow(box,pkt('m.dz_h_turn'),'haptics','turn',lv); selRow(box,pkt('m.dz_h_slide'),'haptics','slide',lv);
  box.appendChild(el('div','dz-hint',typeof navigator.vibrate==='function'?pkt('m.dz_h_ok'):pkt('m.dz_h_nee')));
  // knoppen
  box.appendChild(el('h4',null,pkt('m.dz_knoppen')));
  selRow(box,pkt('m.dz_k_stijl'),'knobs','style',[['workspace',pkt('m.dz_k_workspace')],['rotary',pkt('m.dz_k_rotary')],['slider',pkt('m.dz_k_slider')]]);
  selRow(box,pkt('m.dz_k_maat'),'knobs','size',[['m','M'],['s','S'],['l','L']]);
  box.appendChild(el('div','dz-hint',pkt('m.dz_k_hint',r?PK.knobCount(r):0)));
  controlsSection(box); metersSection(box); sectionsSection(box);
  const btns=el('div','dz-btns'), sv=el('button','small',pkt('m.dz_opslaan')), ex=el('button','small',pkt('m.dz_exporteren')), cl=el('button','small',pkt('m.dz_sluiten'));
  sv.type=ex.type=cl.type='button'; sv.disabled=ex.disabled=!D.name.trim(); sv.onclick=save; ex.onclick=exportIt; cl.onclick=()=>skDesignClose(); btns.append(sv,ex,cl); box.appendChild(btns);
  const st=el('div','dz-hint'); st.id='dzStatus'; st.setAttribute('role','status'); box.appendChild(st); }

// ---- Regelaars (skins 0.3, design.controls): lijst regels; de laatste passende regel wint; alleen gezicht, maat, lengte, dikte, duim, kleur en waardeweergave, nooit verbergen of waarde zetten ----
const getCtl=()=>(ctxDesign().controls||[]);
function setCtl(a){ const d=ctxDesign(); if(a.length) d.controls=a; else delete d.controls; if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
function ctlStat(){ const r=card(), n=PK.$('dzCtlStat'); if(n){ const st=r?PK.regStats(r):{n:0,m:0}; n.textContent=PK.pkt('m.dz_r_stat',st.n,st.m); } const sc=PK.$('dzSecStat'); if(sc){ const st=r?PK.secStats(r):{n:0,m:0}; sc.textContent=PK.pkt('m.dz_s_stat',st.n,st.m); } const m=PK.$('dzMetStat'); if(m){ const st=r?PK.meterStats(r):{n:0,m:0}; m.textContent=PK.pkt('m.dz_m_stat',st.n,st.m); } }
function controlsSection(box){ const pkt=PK.pkt, r=card(), reg=r?PK.regList(r).filter(x=>x.role!=='meter'):[]; box.appendChild(el('h4',null,pkt('m.dz_regelaars')));
  box.appendChild(el('div','dz-hint',pkt('m.dz_r_uitleg')));
  box.appendChild(el('div','dz-hint',reg.length?pkt('m.dz_r_hint',reg.length):pkt('m.dz_r_geen')));
  const stat=el('div','dz-hint'); stat.id='dzCtlStat'; stat.setAttribute('role','status'); box.appendChild(stat);
  if(reg.length){ const dt=el('details','dz-reg'), sm=el('summary',null,pkt('m.dz_r_tabel')), tb=document.createElement('table'); tb.className='dz-regtab';
    const th=document.createElement('tr'); ['id','m.dz_r_rol','m.dz_r_groep','m.dz_r_label','m.dz_r_gezicht'].forEach(k=>th.appendChild(el('th',null,k==='id'?'id':pkt(k)))); tb.appendChild(th);
    reg.forEach(x=>{ const tr=document.createElement('tr'); [x.id,x.role,x.group||'-',x.label||'-',x.face].forEach(v=>tr.appendChild(el('td',null,String(v)))); tb.appendChild(tr); }); dt.append(sm,tb); box.appendChild(dt); }
  const roles=[...new Set(reg.map(x=>x.role))], groups=[...new Set(reg.map(x=>x.group).filter(Boolean))];
  const list=el('div','dz-rules'); box.appendChild(list);
  const draw=()=>{ list.innerHTML=''; const rules=getCtl();
    rules.forEach((ru,i)=>{ const row=el('div','dz-rule'), head=el('div','dz-rhead');
      const ms=document.createElement('select'); ms.className='small'; ms.setAttribute('aria-label',pkt('m.dz_r_match')); const mo=[['*',pkt('m.dz_r_alle')],...roles.map(x=>['role:'+x,pkt('m.dz_r_rol_x',x)]),...groups.map(x=>['group:'+x,pkt('m.dz_r_groep_x',x)]),...reg.map(x=>[x.id,x.id+(x.label?' · '+x.label:'')])];
      if(!mo.some(o=>o[0]===ru.match)) mo.push([ru.match,ru.match]); mo.forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; ms.appendChild(o); }); ms.value=ru.match;
      ms.onchange=()=>{ ru.match=ms.value; preview(); };
      const mv=(d)=>{ const a=getCtl(), j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; draw(); preview(); };
      const up=el('button','small','↑'), dn=el('button','small','↓'), rm=el('button','small','×'); [up,dn,rm].forEach(b=>b.type='button');
      up.title=up.ariaLabel=pkt('m.dz_r_omhoog'); dn.title=dn.ariaLabel=pkt('m.dz_r_omlaag'); rm.title=rm.ariaLabel=pkt('m.dz_r_weg'); up.disabled=i===0; dn.disabled=i===rules.length-1;
      up.onclick=()=>mv(-1); dn.onclick=()=>mv(1); rm.onclick=()=>{ const a=getCtl(); a.splice(i,1); setCtl(a); draw(); preview(); };
      head.append(el('span','dz-rn',pkt('m.dz_r_n',i+1)),ms,up,dn,rm); row.appendChild(head);
      const sel=(label,key,opts)=>{ const rw=el('div','dz-row'), lb=el('label',null,label), s=document.createElement('select'); s.className='small'; s.setAttribute('aria-label',label+' ('+pkt('m.dz_r_n',i+1)+')');
        [['',pkt('m.dz_r_zoals')],...opts].forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; s.appendChild(o); }); s.value=ru[key]===undefined?'':String(ru[key]);
        if(s.value!==(ru[key]===undefined?'':String(ru[key]))){ const o=el('option',null,String(ru[key])); o.value=String(ru[key]); s.appendChild(o); s.value=o.value; }
        s.onchange=()=>{ if(s.value==='') delete ru[key]; else ru[key]=(key==='thickness')?+s.value:s.value; if(key==='face') draw(); preview(); }; rw.append(lb,s); row.appendChild(rw); };
      sel(pkt('m.dz_r_gezicht'),'face',[['default',pkt('m.dz_r_g_default')],['rotary',pkt('m.dz_k_rotary')],['hslider',pkt('m.dz_r_g_hslider')],['vslider',pkt('m.dz_r_g_vslider')]]);
      sel(pkt('m.dz_r_maat'),'size',['xs','s','m','l','xl'].map(v=>[v,v.toUpperCase()]));
      if(ru.face!=='rotary'){ sel(pkt('m.dz_r_lengte'),'length',[['short',pkt('m.dz_r_kort')],['medium',pkt('m.dz_r_middel')],['long',pkt('m.dz_r_lang')]]);
        sel(pkt('m.dz_r_dikte'),'thickness',[2,4,6,8,12,16].map(v=>[String(v),v+' px']));
        sel(pkt('m.dz_r_duim'),'thumb',[['round',pkt('m.dz_r_d_round')],['square',pkt('m.dz_r_d_square')],['bar',pkt('m.dz_r_d_bar')],['none',pkt('m.dz_r_d_none')]]); }
      sel(pkt('m.dz_r_waarde'),'showValue',[['always',pkt('m.dz_r_w_always')],['hover',pkt('m.dz_r_w_hover')],['never',pkt('m.dz_r_w_never')]]);
      { const rw=el('div','dz-row'), lb=el('label',null,pkt('m.dz_r_kleur')), cell=el('div','dz-col'), sw=el('button','dz-sw'), hx=el('span','dz-hint'), clr=el('button','small','×'); sw.type=clr.type='button'; sw.setAttribute('aria-label',pkt('m.dz_r_kleur')+' ('+pkt('m.dz_r_n',i+1)+')'); clr.title=clr.ariaLabel=pkt('m.dz_c_leeg');
        let pk=null; const paintSw=()=>{ sw.style.background=ru.color&&ru.color!=='accent'?ru.color:''; sw.classList.toggle('empty',!ru.color||ru.color==='accent'); hx.textContent=ru.color&&ru.color!=='accent'?ru.color:pkt('m.dz_r_accent'); clr.hidden=!ru.color; };
        sw.onclick=()=>{ if(pk){ pk.destroy(); pk=null; return; } pk=PK.colourPicker({value:(ru.color&&ru.color!=='accent')?ru.color:'#4fd1c5',label:pkt('m.dz_r_kleur'),onChange:h=>{ ru.color=h; paintSw(); preview(); },onCommit:h=>{ ru.color=h; paintSw(); preview(); }}); rw.after(pk.el); if(!ru.color){ ru.color=pk.get(); paintSw(); preview(); } };
        clr.onclick=()=>{ delete ru.color; if(pk){ pk.destroy(); pk=null; } paintSw(); preview(); }; cell.append(sw,hx,clr); rw.append(lb,cell); row.appendChild(rw); paintSw(); }
      list.appendChild(row); });
    const add=el('button','small',pkt('m.dz_r_toevoegen')); add.type='button'; add.disabled=getCtl().length>=64; add.onclick=()=>{ const a=getCtl(); a.push({match:'*',face:'default'}); setCtl(a); draw(); preview(); }; list.appendChild(add); };
  draw(); ctlStat(); }
// ---- Meters (skins 0.4, design.meters): gezicht (balk, ledbalk, VU), richting, lengte en breedte, ballistiek, piekstreepje, clip, schaal, kleur; een skin verbergt een meter nooit ----
const getMet=()=>(ctxDesign().meters||[]);
function setMet(a){ const d=ctxDesign(); if(a.length) d.meters=a; else delete d.meters; if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
function metersSection(box){ const pkt=PK.pkt, r=card(), reg=r?PK.meterList(r):[]; box.appendChild(el('h4',null,pkt('m.dz_meters')));
  box.appendChild(el('div','dz-hint',pkt('m.dz_m_uitleg')));
  box.appendChild(el('div','dz-hint',reg.length?pkt('m.dz_m_hint',reg.length):pkt('m.dz_m_geen')));
  const stat=el('div','dz-hint'); stat.id='dzMetStat'; stat.setAttribute('role','status'); box.appendChild(stat);
  if(reg.length){ const dt=el('details','dz-reg'), sm=el('summary',null,pkt('m.dz_m_tabel')), tb=document.createElement('table'); tb.className='dz-regtab';
    const th=document.createElement('tr'); ['id','m.dz_r_groep','m.dz_r_label','m.dz_r_gezicht'].forEach(k=>th.appendChild(el('th',null,k==='id'?'id':pkt(k)))); tb.appendChild(th);
    reg.forEach(x=>{ const tr=document.createElement('tr'); [x.id,x.group||'-',x.label||'-',x.face].forEach(v=>tr.appendChild(el('td',null,String(v)))); tb.appendChild(tr); }); dt.append(sm,tb); box.appendChild(dt); }
  const groups=[...new Set(reg.map(x=>x.group).filter(Boolean))], list=el('div','dz-rules'); box.appendChild(list);
  const draw=()=>{ list.innerHTML=''; const rules=getMet();
    rules.forEach((ru,i)=>{ const row=el('div','dz-rule'), head=el('div','dz-rhead'), nm=pkt('m.dz_r_n',i+1);
      const ms=document.createElement('select'); ms.className='small'; ms.setAttribute('aria-label',pkt('m.dz_r_match')); const mo=[['*',pkt('m.dz_m_alle')],...groups.map(x=>['group:'+x,pkt('m.dz_r_groep_x',x)]),...reg.map(x=>[x.id,x.id+(x.label?' · '+x.label:'')])];
      if(!mo.some(o=>o[0]===ru.match)) mo.push([ru.match,ru.match]); mo.forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; ms.appendChild(o); }); ms.value=ru.match; ms.onchange=()=>{ ru.match=ms.value; preview(); };
      const mv=(d)=>{ const a=getMet(), j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; draw(); preview(); };
      const up=el('button','small','↑'), dn=el('button','small','↓'), rm=el('button','small','×'); [up,dn,rm].forEach(b=>b.type='button');
      up.title=up.ariaLabel=pkt('m.dz_r_omhoog'); dn.title=dn.ariaLabel=pkt('m.dz_r_omlaag'); rm.title=rm.ariaLabel=pkt('m.dz_r_weg'); up.disabled=i===0; dn.disabled=i===rules.length-1;
      up.onclick=()=>mv(-1); dn.onclick=()=>mv(1); rm.onclick=()=>{ const a=getMet(); a.splice(i,1); setMet(a); draw(); preview(); };
      head.append(el('span','dz-rn',nm),ms,up,dn,rm); row.appendChild(head);
      // num: de waarde is een getal (px of aantal); anders een woord
      const sel=(label,key,opts,num)=>{ const rw=el('div','dz-row'), lb=el('label',null,label), s=document.createElement('select'); s.className='small'; s.setAttribute('aria-label',label+' ('+nm+')');
        [['',pkt('m.dz_r_zoals')],...opts].forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; s.appendChild(o); }); const cur=ru[key]===undefined?'':String(ru[key]); s.value=cur;
        if(s.value!==cur){ const o=el('option',null,cur); o.value=cur; s.appendChild(o); s.value=cur; }
        s.onchange=()=>{ if(s.value==='') delete ru[key]; else ru[key]=(num&&/^\d+$/.test(s.value))?+s.value:s.value; if(key==='face') draw(); preview(); }; rw.append(lb,s); row.appendChild(rw); };
      const face=ru.face||'default', vu=face==='vu', px=a=>a.map(v=>[String(v),v+' px']);
      sel(pkt('m.dz_r_gezicht'),'face',[['default',pkt('m.dz_r_g_default')],['bar',pkt('m.dz_m_g_bar')],['ledladder',pkt('m.dz_m_g_led')],['vu',pkt('m.dz_m_g_vu')]]);
      if(!vu) sel(pkt('m.dz_m_richting'),'orientation',[['auto',pkt('m.dz_r_g_default')],['vertical',pkt('m.dz_m_vert')],['horizontal',pkt('m.dz_m_horiz')]]);
      sel(pkt('m.dz_r_lengte'),'length',[['short',pkt('m.dz_r_kort')],['medium',pkt('m.dz_r_middel')],['long',pkt('m.dz_r_lang')],...px(vu?[64,96,128,160,200,260,320,400]:[40,64,96,128,160,220,300,400])],true);
      if(!vu) sel(pkt('m.dz_m_breedte'),'width',px([4,6,8,10,14,20,28,40]),true);
      sel(pkt('m.dz_m_ballistiek'),'ballistics',[['default',pkt('m.dz_r_g_default')],['fast',pkt('m.dz_m_b_fast')],['vu',pkt('m.dz_m_b_vu')],['slow',pkt('m.dz_m_b_slow')]]);
      sel(pkt('m.dz_m_piek'),'peakHold',[['default',pkt('m.dz_r_g_default')],['on',pkt('m.dz_m_aan')],['off',pkt('m.dz_m_uit')]]);
      sel(pkt('m.dz_m_clip'),'clip',[['default',pkt('m.dz_r_g_default')],['show',pkt('m.dz_m_tonen')],['hide',pkt('m.dz_m_verbergen')]]);
      if(face==='vu'||face==='ledladder') sel(pkt('m.dz_m_schaal'),'scale',[['show',pkt('m.dz_m_tonen')],['hide',pkt('m.dz_m_verbergen')]]);
      if(face==='ledladder') sel(pkt('m.dz_m_segmenten'),'segments',[8,10,12,16,20,24,32,40].map(v=>[String(v),String(v)]),true);
      { const rw=el('div','dz-row'), lb=el('label',null,pkt('m.dz_r_kleur')), cell=el('div','dz-col'), sw=el('button','dz-sw'), hx=el('span','dz-hint'), clr=el('button','small','×'); sw.type=clr.type='button'; sw.setAttribute('aria-label',pkt('m.dz_r_kleur')+' ('+nm+')'); clr.title=clr.ariaLabel=pkt('m.dz_c_leeg');
        const hasC=()=>/^#/.test(ru.color||''); let pk=null; const paintSw=()=>{ sw.style.background=hasC()?ru.color:''; sw.classList.toggle('empty',!hasC()); hx.textContent=hasC()?ru.color:pkt('m.dz_r_zoals'); clr.hidden=!ru.color; };
        sw.onclick=()=>{ if(pk){ pk.destroy(); pk=null; return; } pk=PK.colourPicker({value:hasC()?ru.color:'#4fd1c5',label:pkt('m.dz_r_kleur'),onChange:h=>{ ru.color=h; paintSw(); preview(); },onCommit:h=>{ ru.color=h; paintSw(); preview(); }}); rw.after(pk.el); if(!ru.color){ ru.color=pk.get(); paintSw(); preview(); } };
        clr.onclick=()=>{ delete ru.color; if(pk){ pk.destroy(); pk=null; } paintSw(); preview(); }; cell.append(sw,hx,clr); rw.append(lb,cell); row.appendChild(rw); paintSw(); }
      list.appendChild(row); });
    const add=el('button','small',pkt('m.dz_r_toevoegen')); add.type='button'; add.disabled=getMet().length>=64; add.onclick=()=>{ const a=getMet(); a.push({match:'*',face:'default'}); setMet(a); draw(); preview(); }; list.appendChild(add); };
  draw(); ctlStat(); }
// ---- Secties (skins 0.5, design.sections + design.size): kader, kolommen, tussenruimte, kale regelaars, labelplaats per groep; breedte van de kaart bij een verschijning ----
const getSec=()=>(ctxDesign().sections||[]);
function setSec(a){ const d=ctxDesign(); if(a.length) d.sections=a; else delete d.sections; if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
function sectionsSection(box){ const pkt=PK.pkt, r=card(), groups=r?PK.secGroups(r):[]; box.appendChild(el('h4',null,pkt('m.dz_secties')));
  box.appendChild(el('div','dz-hint',pkt('m.dz_s_uitleg')));
  box.appendChild(el('div','dz-hint',groups.length?pkt('m.dz_s_hint',groups.length):pkt('m.dz_s_geen')));
  const stat=el('div','dz-hint'); stat.id='dzSecStat'; stat.setAttribute('role','status'); box.appendChild(stat);
  { const rw=el('div','dz-row'), lb=el('label',null,pkt('m.dz_breedte')), inp=document.createElement('input'); inp.type='number'; inp.min=200; inp.max=1600; inp.step=10; inp.className='small'; inp.setAttribute('aria-label',pkt('m.dz_breedte')); inp.placeholder=pkt('m.dz_r_zoals');
    const cur=(D.tab===0?D.design:(ctxAp().design||{})).size; inp.value=cur&&cur.width?cur.width:'';
    inp.onchange=()=>{ const v=Math.round(+inp.value), d=ctxDesign(); if(inp.value===''||!(v>=200&&v<=1600)){ delete d.size; inp.value=''; } else { d.size={width:v}; inp.value=v; const c=card(); if(c){ if(!D.sizeTouched){ D.sizeTouched=true; D.prevW=c.w; } PK.setSize(D.cardId,v); } }
      if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; preview(); };
    rw.append(lb,inp); box.appendChild(rw); box.appendChild(el('div','dz-hint',pkt('m.dz_breedte_hint'))); }
  const list=el('div','dz-rules'); box.appendChild(list);
  const draw=()=>{ list.innerHTML=''; const rules=getSec();
    rules.forEach((ru,i)=>{ const row=el('div','dz-rule'), head=el('div','dz-rhead'), nm=pkt('m.dz_r_n',i+1);
      const ms=document.createElement('select'); ms.className='small'; ms.setAttribute('aria-label',pkt('m.dz_r_match')); const mo=[['*',pkt('m.dz_s_alle')],...groups.map(x=>['group:'+x,pkt('m.dz_r_groep_x',x)])];
      if(!mo.some(o=>o[0]===ru.match)) mo.push([ru.match,ru.match]); mo.forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; ms.appendChild(o); }); ms.value=ru.match; ms.onchange=()=>{ ru.match=ms.value; preview(); };
      const mv=(d)=>{ const a=getSec(), j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; draw(); preview(); };
      const up=el('button','small','↑'), dn=el('button','small','↓'), rm=el('button','small','×'); [up,dn,rm].forEach(b=>b.type='button');
      up.title=up.ariaLabel=pkt('m.dz_r_omhoog'); dn.title=dn.ariaLabel=pkt('m.dz_r_omlaag'); rm.title=rm.ariaLabel=pkt('m.dz_r_weg'); up.disabled=i===0; dn.disabled=i===rules.length-1;
      up.onclick=()=>mv(-1); dn.onclick=()=>mv(1); rm.onclick=()=>{ const a=getSec(); a.splice(i,1); setSec(a); draw(); preview(); };
      head.append(el('span','dz-rn',nm),ms,up,dn,rm); row.appendChild(head);
      const sel=(label,key,opts,conv)=>{ const rw=el('div','dz-row'), lb=el('label',null,label), s=document.createElement('select'); s.className='small'; s.setAttribute('aria-label',label+' ('+nm+')');
        [['',pkt('m.dz_r_zoals')],...opts].forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; s.appendChild(o); }); const cur=ru[key]===undefined?'':String(ru[key]); s.value=cur;
        if(s.value!==cur){ const o=el('option',null,cur); o.value=cur; s.appendChild(o); s.value=cur; }
        s.onchange=()=>{ if(s.value==='') delete ru[key]; else ru[key]=conv?conv(s.value):s.value; preview(); }; rw.append(lb,s); row.appendChild(rw); };
      sel(pkt('m.dz_s_kader'),'frame',[['default',pkt('m.dz_r_g_default')],['none',pkt('m.dz_s_k_none')],['line',pkt('m.dz_s_k_line')],['raised',pkt('m.dz_s_k_raised')],['inset',pkt('m.dz_s_k_inset')],['floating',pkt('m.dz_s_k_floating')]]);
      sel(pkt('m.dz_s_kolommen'),'columns',[['auto',pkt('m.dz_s_auto')],...[1,2,3,4,5,6,8,12].map(v=>[String(v),String(v)])],v=>v==='auto'?v:+v);
      sel(pkt('m.dz_s_ruimte'),'gap',[['tight',pkt('m.dz_s_r_tight')],['normal',pkt('m.dz_s_r_normal')],['wide',pkt('m.dz_s_r_wide')]]);
      sel(pkt('m.dz_s_kaal'),'bare',[['true',pkt('m.dz_m_aan')],['false',pkt('m.dz_m_uit')]],v=>v==='true');
      sel(pkt('m.dz_s_labels'),'labels',[['default',pkt('m.dz_r_g_default')],['above',pkt('m.dz_s_l_above')],['below',pkt('m.dz_s_l_below')]]);
      sel(pkt('m.dz_s_uitlijning'),'align',[['start',pkt('m.dz_s_u_start')],['center',pkt('m.dz_s_u_center')]]);
      list.appendChild(row); });
    const add=el('button','small',pkt('m.dz_r_toevoegen')); add.type='button'; add.disabled=getSec().length>=32; add.onclick=()=>{ const a=getSec(); a.push({match:'*',frame:'line'}); setSec(a); draw(); preview(); }; list.appendChild(add); };
  draw(); ctlStat(); }
function PK_when(w){ const p=[]; if(w.minWidth!=null) p.push('≥ '+w.minWidth+' px'); if(w.maxWidth!=null) p.push('≤ '+w.maxWidth+' px'); if(w.screens) p.push(w.screens.join(' / ')); return p.join(' · '); }
function say(t){ const s=PK.$('dzStatus'); if(s) s.textContent=t; PK.status(t); }

// ---- opslaan en exporteren ----
function save(){ if(!D||!D.name.trim()) return; const j=build(false), prevU=PK.SK.user.find(e=>e.skin.id===j.id);
  if(prevU){ const v=String(prevU.skin.version).split(/[-+]/)[0].split('.').map(Number); j.version=`${v[0]||1}.${v[1]||0}.${(v[2]||0)+1}`; }
  let sk, notes=[]; try{ sk=PK.skValidate(j,j.id,notes); }catch(e){ PK.status(e.message,true); return; }
  if(!PK.skAdd('user',sk,sk.id+'.patchkamer-skin.json',{notes})){ PK.status(PK.pkt('m.sk_nieuwer_aanwezig'),true); return; }
  PK.skPersist(); const cid=D.cardId, r=card(); if(r) r.skPrev=null; PK.SK.draft=null; if(r) PK.skinSet(cid,sk.id,'auto'); PK.skinsChanged();
  PK.status(PK.pkt('m.dz_opgeslagen',sk.name)); finish(); }
async function exportIt(){ if(!D||!D.name.trim()) return; const j=build(false); const fn=j.id+'.patchkamer-skin.json';
  const res=await PK.saveFileData(fn,JSON.stringify(j,null,2)+'\n'); say(res==='saved'?PK.pkt('m.dz_geexporteerd',fn):PK.pkt('m.exporteren_geannuleerd')); }

// ---- openen en sluiten ----
function skDesignOpen(dev,src){ if(D) skDesignClose(true); const def=PK.Host.latest(dev); if(!def){ PK.status(PK.pkt('m.sk_apparaat_ontbreekt'),true); return; } PK.libOpen('skins');   // de ontwerper is een deel van de tab Skins: zorg dat die open staat
  const cid=PK.skCardFor(dev); if(!cid){ PK.status(PK.pkt('m.sk_apparaat_ontbreekt'),true); return; } const r=PK.Host.devices.get(cid);
  D={dev,cardId:cid,tab:0,name:src?src.name.slice(0,50)+PK.pkt('m.dz_kopie'):'',author:src?src.author:'',design:src&&src.design?clone(src.design):{},aps:src?clone(src.appearances):[{id:'standard',name:'Standard',css:'',assets:{}}],dflt:src?src.default:'standard',version:'1.0.0'};
  D.aps.forEach(a=>{ if(!a.assets) a.assets={}; }); if(!D.dflt||!D.aps.some(a=>a.id===D.dflt)) D.dflt=D.aps[0].id;
  r.skPrev=r.skin?{id:r.skin.id,appearance:r.skin.appearance}:null; PK.select(cid);
  PK.$('skLibs').hidden=true; PK.$('skDesign').hidden=false; paint(); preview(); const first=PK.$('skDesign').querySelector('input'); if(first) first.focus({preventScroll:true}); } PK.skDesignOpen=skDesignOpen;
function finish(){ D=null; const b=PK.$('skDesign'); if(b){ b.hidden=true; b.innerHTML=''; } const l=PK.$('skLibs'); if(l) l.hidden=false; if(PK.skPaintPanel) PK.skPaintPanel(); }
function skDesignClose(quiet){ if(!D) return; const cid=D.cardId, r=card(), prev=r&&r.skPrev; PK.SK.draft=null;
  if(r){ r.skPrev=null; PK.skinSet(cid,'',''); if(prev) PK.skinRestore(cid,prev); if(D.sizeTouched) PK.setSize(cid,D.prevW===undefined?null:D.prevW); }
  finish(); } PK.skDesignClose=skDesignClose;
PK.skDesigning=()=>!!D;
})(window.__PK);
