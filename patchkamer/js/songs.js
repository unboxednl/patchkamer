// js/songs.js — songs exporteren en tonen (formaat en dialogen)
(function(PK){
/* =====================================================================
   SONGS · een song is een export van de werkruimte: alle apparaten (met hun code), instellingen, patronen, kabels en
   tempo, plus titel, maker, licentie (SPDX) en omschrijving. Openen = als werkruimte openen; de licentie wordt getoond.
   ===================================================================== */
const SONGFMT='patchkamer-song';
function songModal(html,buttons){ return new Promise(res=>{ const m=PK.mk('div','pkmodal prdlg'); m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
  m.innerHTML=`<div class="box">${html}<div class="wsrow">${buttons.map((b,i)=>`<button class="small" data-a="${i}"${i===buttons.length-1?' style="border-color:var(--audio)"':''}>${PK.esc(b)}</button>`).join('')}</div></div>`;
  const done=v=>{ m.remove(); res(v); }; m.addEventListener('click',e=>{ const b=e.target.closest('button[data-a]'); if(b) done(+b.dataset.a); else if(e.target===m) done(-1); }); m.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Escape') done(-1); });
  document.body.appendChild(m); const f=m.querySelector('input,select,button[data-a="'+(buttons.length-1)+'"]'); if(f) f.focus(); res.m=m; m._res=res; }); }
async function songExportDialog(){ const cur=PK.WS.song||{}; const mine=!cur.author||cur.author===PK.PR.prefs.author;
  const based=cur.title&&!mine?{title:cur.title,author:cur.author||'',license:cur.license||''}:(cur.basedOn||null);
  const p=songModal(PK.pkt('m.exporteer_als_song_titel_maker',based?PK.pkt('m.gebaseerd_op_dat_gaat_mee',PK.esc(based.title),PK.esc(PK.licLine({author:based.author,license:based.license})))+(based.license===PK.LIC_ARR?PK.pkt('m.het_origineel_heeft_alle_rechten'):''):PK.pkt('m.de_song_bevat_alle_apparaten')),[PK.pkt('m.annuleren'),PK.pkt('m.exporteren')]);
  const m=document.querySelector('.pkmodal:last-of-type'); const q=s=>m.querySelector(s);
  q('.st').value=mine&&cur.title?cur.title:PK.WS.name; q('.sa').value=PK.PR.prefs.author||''; const lic=(mine&&cur.license)||PK.PR.prefs.license||'CC-BY-4.0'; q('.sl').innerHTML=PK.licOptions(lic); q('.sl').value=lic; q('.sd').value=mine?(cur.description||''):'';
  const vals=()=>({title:q('.st').value.trim()||PK.WS.name,author:q('.sa').value.trim(),license:q('.sl').value,description:q('.sd').value.trim()});
  let v=null; m.addEventListener('click',e=>{ if(e.target.closest('button[data-a="1"]')) v=vals(); },true);
  if(await p!==1||!v) { PK.status(PK.pkt('m.song_niet_ge_xporteerd')); return; }
  PK.PR.prefs.author=v.author; PK.PR.prefs.license=v.license; PK.prSavePrefs();
  PK.WS.song={...v,...(based?{basedOn:based}:{})};
  const song={format:SONGFMT,formatVersion:1,title:v.title,author:v.author,license:v.license,description:v.description,...(based?{basedOn:based}:{}),created:new Date().toISOString(),patchkamer:'1.16',workspace:PK.workspaceState(true)};
  const fn=(String(v.title).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim()||PK.pkt('m.song_2'))+'.patchkamer-song.json';
  const r=await PK.saveFileData(fn,JSON.stringify(song,null,1)); PK.status(r==='saved'?PK.pkt('m.song_ge_xporteerd_apparaten_met',v.title,PK.licName(v.license),song.workspace.devices.length):PK.pkt('m.exporteren_geannuleerd')); } PK.songExportDialog=songExportDialog;
function songShow(s){ songModal(PK.pkt('m.song',PK.esc(s.title||PK.pkt('m.naamloos')),PK.esc(PK.licLine({author:s.author,license:s.license})),s.description?'<br>'+PK.esc(s.description):'',s.basedOn?PK.pkt('m.gebaseerd_op')+PK.esc(s.basedOn.title||'')+'”'+(s.basedOn.author?' van '+PK.esc(s.basedOn.author):'')+' ('+PK.esc(PK.licName(s.basedOn.license))+')':'',s.license===PK.LIC_ARR?PK.pkt('m.alle_rechten_voorbehouden_je_mag'):s.license==='CC-BY-4.0'?PK.pkt('m.cc_by_4_0_je'):s.license?PK.pkt('m.lees_de_licentie')+PK.esc(s.license)+PK.pkt('m.voor_wat_je_ermee_mag'):PK.pkt('m.er_is_geen_licentie_opgegeven')),['OK']); } PK.songShow=songShow;
})(window.__PK);
