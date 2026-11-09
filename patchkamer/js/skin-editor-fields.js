// js/skin-editor-fields.js — skin-editor: veldbouwers (keuze, getal, tekst, vinkje, kleur) en de veldlijsten per regelsoort (regelaar, meter, sectie, paneel, pads, schermpje)
(function(PK){
/* =====================================================================
   SKIN-EDITOR · VELDEN. Eén veldbouwer schrijft via E.edit (één geschiedenisstap per wijziging, tekst met 100 ms uitstel en samenvoegen). De teksten en opties zijn die van de mini-ontwerper (m.dz_*).
   Een veldlijst is [{k, l (sleutel of tekst), o: opties [[waarde, sleutel of tekst]], t: 'sel'|'num', c: omzetting}] en bewerkt een gewoon object (een regel, het pads-object, een paneel).
   ===================================================================== */
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
const L=t=>/^m\./.test(t)?PK.pkt(t):t;
const unit=(a,u)=>a.map(v=>[String(v),v+' '+u]);
let E=null;
function row(box,label,ctrl){ const r=el('div','se-row'); r.append(el('label',null,label),ctrl); box.appendChild(r); return r; }
function sel(box,o){ const s=document.createElement('select'); s.className='small'; s.dataset.fk=o.k; s.setAttribute('aria-label',o.aria||o.label); if(o.blank!==false){ const b=el('option',null,PK.pkt('m.dz_r_zoals')); b.value=''; s.appendChild(b); }
  o.opts.forEach(([v,t])=>{ const x=el('option',null,L(t)); x.value=v; s.appendChild(x); }); const cur=o.get(), cs=cur==null?'':String(cur); s.value=cs; if(s.value!==cs&&cs!==''){ const x=el('option',null,cs); x.value=cs; s.appendChild(x); s.value=cs; }
  s.disabled=!!o.disabled; s.onchange=()=>E.edit(()=>o.set(s.value===''?undefined:s.value)); row(box,o.label,s); return s; }
function num(box,o){ const i=document.createElement('input'); i.type='number'; i.className='small'; i.dataset.fk=o.k; if(o.min!=null) i.min=o.min; if(o.max!=null) i.max=o.max; if(o.step) i.step=o.step; i.placeholder=o.ph||PK.pkt('m.dz_r_zoals'); i.setAttribute('aria-label',o.label);
  const cur=o.get(); i.value=cur==null?'':cur; i.onchange=()=>E.edit(()=>o.set(i.value===''||!isFinite(+i.value)?undefined:Math.round(+i.value)),{form:false}); row(box,o.label,i); return i; }
function txt(box,o){ const i=document.createElement('input'); i.type='text'; i.dataset.fk=o.k; i.maxLength=o.max||60; i.value=o.get()||''; i.setAttribute('aria-label',o.label); if(o.ph) i.placeholder=o.ph; if(o.disabled) i.disabled=true;
  let t=0; const go=()=>{ clearTimeout(t); E.edit(()=>o.set(i.value),{key:'t:'+o.k,form:o.only?undefined:false,tree:o.tree}); if(o.only) i.value=''; }; if(!o.only) i.oninput=()=>{ clearTimeout(t); t=setTimeout(go,100); }; i.onchange=go; row(box,o.label,i); return i; }
function chk(box,o){ const c=document.createElement('input'); c.type='checkbox'; c.dataset.fk=o.k; c.checked=!!o.get(); c.setAttribute('aria-label',o.label); c.onchange=()=>E.edit(()=>o.set(c.checked)); const w=el('div','se-col'); w.appendChild(c); row(box,o.label,w); return c; }
function swatch(box,o){ const cell=el('div','se-col'), sw=el('button','dz-sw'), hx=el('span','dz-hint'), clr=el('button','small','×'), rw=row(box,o.label,cell); sw.type=clr.type='button'; sw.dataset.fk=o.k; sw.setAttribute('aria-label',o.label); clr.title=clr.ariaLabel=PK.pkt('m.dz_c_leeg');
  let pk=null; const paint=()=>{ const v=o.get(); sw.style.background=v||''; sw.classList.toggle('empty',!v); hx.textContent=v||o.none||PK.pkt('m.dz_r_zoals'); clr.hidden=!v||o.clearable===false; };
  sw.onclick=()=>{ if(pk){ pk.destroy(); pk=null; return; } pk=PK.colourPicker({value:o.get()||'#4fd1c5',label:o.label,against:o.against||null,min:3,onChange:h=>{ E.edit(()=>o.set(h),{key:'c:'+o.k,form:false}); paint(); },onCommit:h=>{ E.edit(()=>o.set(h),{key:'c:'+o.k,form:false}); paint(); if(o.after) o.after(); }}); rw.after(pk.el); if(!o.get()){ E.edit(()=>o.set(pk.get()),{key:'c:'+o.k,form:false}); paint(); } };
  clr.onclick=()=>{ if(pk){ pk.destroy(); pk=null; } E.edit(()=>o.set(undefined),{form:false}); paint(); if(o.after) o.after(); }; cell.append(sw,hx,clr); paint(); return rw; }
// veldlijst op een gewoon object
function specs(box,obj,list,tag,after,fkp){ fkp=fkp||'r.'; list.forEach(s=>{ const label=L(s.l)+(tag?' ('+tag+')':''), set=v=>{ if(v===undefined||v==='') delete obj[s.k]; else obj[s.k]=s.c?s.c(v):v; };
    if(s.t==='col'){ const has=()=>/^#/.test(obj[s.k]||''); swatch(box,{k:fkp+s.k+(tag||''),label,get:()=>has()?obj[s.k]:'',set:v=>{ if(v) obj[s.k]=v; else delete obj[s.k]; },none:PK.pkt('m.dz_r_zoals')}); }
    else if(s.t==='num') num(box,{k:fkp+s.k+(tag||''),label,get:()=>obj[s.k],set,min:s.min,max:s.max,step:s.step});
    else sel(box,{k:fkp+s.k+(tag||''),label,aria:label,get:()=>obj[s.k],set:v=>{ set(v); },opts:s.o,blank:s.blank}); }); }
const SZ=['xs','s','m','l','xl'].map(v=>[v,v.toUpperCase()]), TF=[['true','m.dz_m_aan'],['false','m.dz_m_uit']], bool=v=>v==='true', gapO=[['tight','m.dz_s_r_tight'],['normal','m.dz_s_r_normal'],['wide','m.dz_s_r_wide']];
const PNUM=v=>/^\d+$/.test(v)?+v:v;
const S={
 controls:ru=>[{k:'face',l:'m.dz_r_gezicht',o:[['default','m.dz_r_g_default'],['rotary','m.dz_k_rotary'],['hslider','m.dz_r_g_hslider'],['vslider','m.dz_r_g_vslider']]},{k:'size',l:'m.dz_r_maat',o:SZ},
   ...(ru.face!=='rotary'?[{k:'length',l:'m.dz_r_lengte',o:[['short','m.dz_r_kort'],['medium','m.dz_r_middel'],['long','m.dz_r_lang']]},{k:'thickness',l:'m.dz_r_dikte',o:unit([2,4,6,8,12,16],'px'),c:Number},{k:'thumb',l:'m.dz_r_duim',o:[['round','m.dz_r_d_round'],['square','m.dz_r_d_square'],['bar','m.dz_r_d_bar'],['none','m.dz_r_d_none']]}]:[]),
   {k:'showValue',l:'m.dz_r_waarde',o:[['always','m.dz_r_w_always'],['hover','m.dz_r_w_hover'],['never','m.dz_r_w_never']]},{k:'color',l:'m.se_kleur_rust',t:'col'},{k:'activeColor',l:'m.se_kleur_gebruik',t:'col'}],
 meters:ru=>{ const f=ru.face||'default', vu=f==='vu', px=a=>unit(a,'px'); return [{k:'face',l:'m.dz_r_gezicht',o:[['default','m.dz_r_g_default'],['bar','m.dz_m_g_bar'],['ledladder','m.dz_m_g_led'],['vu','m.dz_m_g_vu']]},
   ...(vu?[]:[{k:'orientation',l:'m.dz_m_richting',o:[['auto','m.dz_r_g_default'],['vertical','m.dz_m_vert'],['horizontal','m.dz_m_horiz']]}]),
   {k:'length',l:'m.dz_r_lengte',o:[['short','m.dz_r_kort'],['medium','m.dz_r_middel'],['long','m.dz_r_lang'],...px(vu?[64,96,128,160,200,260,320,400]:[40,64,96,128,160,220,300,400])],c:PNUM},
   ...(vu?[]:[{k:'width',l:'m.dz_m_breedte',o:px([4,6,8,10,14,20,28,40]),c:Number}]),
   {k:'ballistics',l:'m.dz_m_ballistiek',o:[['default','m.dz_r_g_default'],['fast','m.dz_m_b_fast'],['vu','m.dz_m_b_vu'],['slow','m.dz_m_b_slow']]},{k:'peakHold',l:'m.dz_m_piek',o:[['default','m.dz_r_g_default'],['on','m.dz_m_aan'],['off','m.dz_m_uit']]},
   {k:'clip',l:'m.dz_m_clip',o:[['default','m.dz_r_g_default'],['show','m.dz_m_tonen'],['hide','m.dz_m_verbergen']]},
   ...((f==='vu'||f==='ledladder')?[{k:'scale',l:'m.dz_m_schaal',o:[['show','m.dz_m_tonen'],['hide','m.dz_m_verbergen']]}]:[]),...(f==='ledladder'?[{k:'segments',l:'m.dz_m_segmenten',o:[8,10,12,16,20,24,32,40].map(v=>[String(v),String(v)]),c:Number}]:[]),{k:'color',l:'m.dz_r_kleur',t:'col'}]; },
 padrule:()=>[{k:'kind',l:'m.se_pad_type',o:[['toggle','m.se_pk_toggle'],['pad','m.se_pk_pad'],['velocity','m.se_pk_velocity']]},{k:'color',l:'m.se_kleur_rust',t:'col'},{k:'activeColor',l:'m.se_kleur_gebruik',t:'col'},{k:'led',l:'m.dz_p_led',o:['none','center','top','bottom','left','right'].map(v=>[v,'m.dz_p_led_'+v])}],
 sections:()=>[{k:'frame',l:'m.dz_s_kader',o:[['default','m.dz_r_g_default'],['none','m.dz_s_k_none'],['line','m.dz_s_k_line'],['raised','m.dz_s_k_raised'],['inset','m.dz_s_k_inset'],['floating','m.dz_s_k_floating']]},
   {k:'columns',l:'m.dz_s_kolommen',o:[['auto','m.dz_s_auto'],...[1,2,3,4,5,6,8,12].map(v=>[String(v),String(v)])],c:v=>v==='auto'?v:+v},{k:'gap',l:'m.dz_s_ruimte',o:gapO},{k:'bare',l:'m.dz_s_kaal',o:TF,c:bool},
   {k:'labels',l:'m.dz_s_labels',o:[['default','m.dz_r_g_default'],['above','m.dz_s_l_above'],['below','m.dz_s_l_below']]},{k:'align',l:'m.dz_s_uitlijning',o:[['start','m.dz_s_u_start'],['center','m.dz_s_u_center']]}],
 panel:P=>[{k:'titlePos',l:'m.dz_pn_titelpos',o:[['top','m.dz_pn_tp_top'],['left','m.dz_pn_tp_left'],['hidden','m.dz_pn_tp_hidden']]},{k:'style',l:'m.dz_pn_stijl',o:[['plain','m.dz_pn_s_plain'],['line','m.dz_s_k_line'],['raised','m.dz_s_k_raised'],['inset','m.dz_s_k_inset'],['floating','m.dz_s_k_floating']]},
   {k:'dir',l:'m.dz_pn_richting',o:[['grid','m.dz_pn_d_grid'],['row','m.dz_pn_d_row'],['column','m.dz_pn_d_column']]},{k:'cols',l:'m.dz_s_kolommen',o:[['auto','m.dz_s_auto'],...[1,2,3,4,5,6,8,12,16].map(v=>[String(v),String(v)])],c:v=>v==='auto'?v:+v},
   {k:'gap',l:'m.dz_s_ruimte',o:gapO},{k:'bare',l:'m.dz_s_kaal',o:TF,c:bool},{k:'labels',l:'m.dz_s_labels',o:[['default','m.dz_r_g_default'],['above','m.dz_s_l_above'],['below','m.dz_s_l_below']]},{k:'align',l:'m.dz_s_uitlijning',o:[['start','m.dz_s_u_start'],['center','m.dz_s_u_center']]},
   {k:'width',l:'m.dz_pn_breedte',o:[['auto','m.dz_s_auto'],['full','m.dz_pn_w_full'],['half','m.dz_pn_w_half'],['third','m.dz_pn_w_third']]},{k:'collapsible',l:'m.dz_pn_inklap',o:TF,c:bool},...(P.collapsible?[{k:'collapsed',l:'m.dz_pn_ingeklapt',o:TF,c:bool}]:[])],
 pads:()=>{ const e=(k,l)=>l.map(v=>[v,'m.dz_p_'+k+'_'+v]); return [{k:'shape',l:'m.dz_p_vorm',o:e('shape',['circle','square','rounded','rect'])},{k:'size',l:'m.dz_r_maat',o:SZ},{k:'color',l:'m.dz_r_kleur',o:e('color',['neutral','device','palette'])},{k:'idle',l:'m.dz_p_rust',o:e('idle',['neutral','tint'])},
   {k:'active',l:'m.dz_p_actief',o:e('active',['fill','border','glow','none'])},{k:'led',l:'m.dz_p_led',o:e('led',['none','center','top','bottom','left','right'])},{k:'hit',l:'m.dz_p_hit',o:e('hit',['flash','none'])},{k:'press',l:'m.dz_p_press',o:e('press',['depress','glow','none'])},{k:'gap',l:'m.dz_p_gap',o:e('gap',['tight','normal','wide'])}]; },
 display:()=>{ const e=(k,l)=>l.map(v=>[v,'m.dz_d_'+k+'_'+v]); return [{k:'style',l:'m.dz_d_stijl',o:e('style',['dropdown','lcd','oled','segment','paper'])},{k:'nav',l:'m.dz_d_nav',o:e('nav',['arrows','arrows+ok','none'])},{k:'commit',l:'m.dz_d_commit',o:e('commit',['live','ok'])},
   {k:'lines',l:'m.dz_d_regels',o:[1,2,3].map(v=>[String(v),String(v)]),c:Number},{k:'width',l:'m.dz_d_breedte',o:[['auto','m.dz_s_auto'],...unit([80,120,160,200,260,320,400],'px')],c:v=>v==='auto'?v:+v},{k:'expand',l:'m.dz_d_expand',o:e('expand',['click','button','off'])},
   {k:'color',l:'m.dz_d_kleur',o:[['default','m.dz_r_g_default'],['accent','m.dz_r_accent']]}]; }
};
PK.ske_f={init:e=>{ E=e; },el,L,row,sel,num,txt,chk,swatch,specs,S,SZ,TF,unit};
})(window.__PK);
