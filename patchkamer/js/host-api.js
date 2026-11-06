// js/host-api.js — het Host-object: klok, apparaten, registry, kabels, view, API voor apparaten (contract)
(function(PK){
/* =====================================================================
   HOST
   ===================================================================== */
const Host={
  lang:PK.PK_LANG,
  get audio(){ return {sampleRate:this.ctx?this.ctx.sampleRate:null,quality:PK.pkQualityOf(PK.PK_AUDIO),oversample:PK.PK_AUDIO.oversample,latency:PK.PK_AUDIO.latency}; },
  ctx:null, running:false, bpm:126, swing:0.08,
  devices:new Map(),      // instanceId -> {def, inst, el, x, y}
  cables:[],              // {from:{id,port}, to:{id,port}, kind}
  registry:new Map(),     // `${def.id}@${def.version}` -> def
  key(id,ver){return id+'@'+ver;},
  versionsOf(id){return [...this.registry.values()].filter(d=>d.id===id).sort((a,b)=>PK.cmpVer(b.version,a.version));},
  latest(id){return this.versionsOf(id)[0]||null;},
  view:{x:40,y:40,scale:1},
  stepSubs:new Set(),
  nextId:1,
  // --- transport ---
  stepDur(){return 60/this.bpm/4;},
  // --- events between devices ---
  // contract v1.2: a device may change its ports at runtime; cables to ports that disappear are removed
  setPorts(inst,ports){ const id=inst&&inst._id, r=id&&this.devices.get(id); if(!r) return; r.ports=PK.normPorts(ports,inst);
    const has=(dir,kind,port)=>PK.portList(r.ports,dir,kind).some(x=>x.id===port);
    const gone=this.cables.filter(c=>(c.from.id===id&&!has('out',c.kind,c.from.port))||(c.to.id===id&&!has('in',c.kind,c.to.port)));
    gone.forEach(c=>PK.unpatch(c)); PK.renderPorts(id); requestAnimationFrame(()=>PK.drawCables());
    if(gone.length) PK.status(PK.pktp('m.kabels_losgehaald_poort_bestaat_niet_2',gone.length>1,r.def.name,gone.length)); },
  // contract v1.3: modulation. A modulator sends offsets (−1..1, fraction of each parameter's range) per target;
  // the host sums all modulators feeding a device, clamps, and calls target.modulate(sum).
  _modOff:new Map(),   // targetId -> Map(sourceId -> {paramId: offset})
  modulate(inst,targetId,offsets){ const sid=inst&&inst._id; if(!sid||!this.cables.some(c=>c.kind==='mod'&&c.from.id===sid&&c.to.id===targetId)) return;
    let m=this._modOff.get(targetId); if(!m) this._modOff.set(targetId,m=new Map()); m.set(sid,offsets||{}); PK.modApply(targetId); },
  paramsChanged(inst){ if(inst&&inst._id) PK.modNotify(inst._id); },
  // contract v1.4: snelle (sample-nauwkeurige) sturing. De modulator geeft een AudioNode met een signaal −1..1
  // (deel van het bereik); de host verbindt die met target.modInput(paramId). Geeft true als het doel dat biedt,
  // anders false: de modulator valt dan terug op host.modulate. node=null maakt de verbinding los.
  _modSig:new Map(),   // 'bron|doel|param' -> {node,input,sid,tid}
  modSignal(inst,targetId,paramId,node){ const sid=inst&&inst._id; if(!sid) return false; const key=sid+'|'+targetId+'|'+paramId, old=this._modSig.get(key);
    if(old){ if(old.node===node) return true; try{ old.node.disconnect(old.input); }catch(e){} if(old.tap) try{ old.node.disconnect(old.tap); }catch(e){} this._modSig.delete(key); }
    if(!node) return false; if(!this.cables.some(c=>c.kind==='mod'&&c.from.id===sid&&c.to.id===targetId)) return false;
    const r=this.devices.get(targetId); if(!r||typeof r.inst.modInput!=='function') return false;
    let input=null; try{ input=r.inst.modInput(String(paramId)); }catch(e){ console.warn('modInput()',r.def.name,e); } if(!input) return false;
    try{ node.connect(input); }catch(e){ return false; } let tap=null; try{ tap=node.context.createAnalyser(); tap.fftSize=32; node.connect(tap); }catch(e){ tap=null; }
    this._modSig.set(key,{node,input,sid,tid:targetId,pid:String(paramId),tap}); PK.modViewKick(); return true; },
  _dropModSig(pred){ [...this._modSig.entries()].forEach(([k,v])=>{ if(pred(v)){ try{ v.node.disconnect(v.input); }catch(e){} if(v.tap) try{ v.node.disconnect(v.tap); }catch(e){} this._modSig.delete(k); } }); },
  // contract v1.4: AudioWorklet-code laden (één keer per naam). Geeft een Promise; faalt als de browser of de omgeving het niet toestaat.
  _worklets:new Map(),
  loadWorklet(name,code){ const ctx=PK.ensureCtx(); if(this._worklets.has(name)) return this._worklets.get(name);
    const pr=(async()=>{ if(!ctx.audioWorklet) throw new Error(PK.pkt('m.audioworklet_wordt_hier_niet_ondersteund'));
      // eerst als blob; lukt dat niet (bijvoorbeeld een los bestand via file://, herkomst "null"), dan als data-URL
      const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      try{ await ctx.audioWorklet.addModule(url); return true; }
      catch(e){ const b64=btoa(unescape(encodeURIComponent(code))); await ctx.audioWorklet.addModule('data:text/javascript;base64,'+b64); return true; }
      finally{ URL.revokeObjectURL(url); } })();
    pr.catch(()=>this._worklets.delete(name)); this._worklets.set(name,pr); return pr; },
  // optioneel hulpmiddel: een bestand aan de gebruiker geven (opname, export). Geeft 'saved' of 'declined'.
  saveFile(filename,data){ return PK.saveFileData(String(filename||PK.pkt('m.default_bestandsnaam')),data); },
  setTempo(b){ b=PK.clamp(+b||this.bpm,40,200); this.bpm=b; const i=document.getElementById('bpm'); if(i) i.value=b; },
  // contract v1.7: besturing. Een apparaat (bijv. een MIDI-controller) mag de andere apparaten zien (alleen lezen) en
  // kabels leggen of weghalen vanaf zijn EIGEN uitgangen. Het blijven gewone, zichtbare kabels die je ook zelf kunt losmaken.
  // Wie onPeers(lijst) heeft, hoort het als er apparaten bijkomen, verdwijnen, geselecteerd worden of kabels veranderen.
  peers(inst){ const me=inst&&inst._id, all=[...this.devices.entries()], cnt=new Map(); all.forEach(([,r])=>cnt.set(r.def.id,(cnt.get(r.def.id)||0)+1));
    return all.filter(([id])=>id!==me).map(([id,r])=>({id,name:r.def.name+(cnt.get(r.def.id)>1?' · '+id:''),def:r.def.id,version:r.def.version,kind:r.def.kind||'',category:PK.categoryOf(r.def),
      eventIn:r.ports.eventIn.map(p=>({id:p.id,name:p.name})),mod:r.ports.modIn.some(p=>p.id==='mod'),selected:id===PK.selected,noteNames:PK.noteNamesOf(r.inst)})); },
  // contract v1.14: een apparaat dat noten op namen afbeeldt (een drumcomputer) meldt dat zijn lijst veranderd is; wie onPeers heeft, krijgt de nieuwe lijst.
  noteNamesChanged(inst){ if(inst&&inst._id) PK.peersChanged(); },
  connect(inst,fromPort,targetId,toPort,kind){ const sid=inst&&inst._id, a=this.devices.get(sid), b=this.devices.get(targetId); if(!a||!b||sid===targetId) return false;
    kind=['event','mod','audio'].includes(kind)?kind:'event'; if(!PK.portList(a.ports,'out',kind).some(p=>p.id===fromPort)||!PK.portList(b.ports,'in',kind).some(p=>p.id===toPort)) return false;
    PK.patch({from:{id:sid,port:fromPort},to:{id:targetId,port:toPort},kind}); return this.cables.some(c=>c.from.id===sid&&c.from.port===fromPort&&c.to.id===targetId&&c.to.port===toPort); },
  disconnect(inst,fromPort,targetId,toPort){ const sid=inst&&inst._id; const gone=this.cables.filter(c=>c.from.id===sid&&(!fromPort||c.from.port===fromPort)&&(!targetId||c.to.id===targetId)&&(!toPort||c.to.port===toPort)); gone.forEach(PK.unpatch); return gone.length; },
  // contract v1.7: één tekenklok voor iedereen. host.frame(this, cb, fps) roept cb(t) aan zolang je kaart in beeld is
  // (niet geminimaliseerd, niet buiten het zichtbare deel van de vloer, tabblad zichtbaar), hooguit fps keer per seconde.
  // Geeft een functie terug die het abonnement opzegt. host.visible(this) zegt of je kaart nu te zien is.
  _frames:new Set(),
  frame(inst,cb,fps){ if(typeof cb!=='function') return ()=>{}; const e={inst,cb,iv:1000/PK.clamp(+fps||30,1,60),last:0}; this._frames.add(e); PK.frameKick(); return ()=>{ this._frames.delete(e); }; },
  visible(inst){ return PK.deviceVisible(inst&&inst._id); },
  cablesFrom(inst,fromPort){ const sid=inst&&inst._id; return this.cables.filter(c=>c.from.id===sid&&(!fromPort||c.from.port===fromPort)).map(c=>({port:c.from.port,to:c.to.id,toPort:c.to.port,kind:c.kind})); },
  // contract v1.5: bundels. Een bron geeft bundles: {poortId: ()=>({label, channels:[{id,name,node}]})} en meldt
  // wijzigingen met host.bundleChanged(this, poortId). Een ontvanger implementeert onBundle(poortId, sleutel, bundel|null).
  // contract v1.12: mastering. Een Master Director (poort masteringOut) stuurt de apparaten aan die aan zijn mastering-kabels hangen.
  // Acties: inspect, apply (settings per doel-id), analyse, accept, undo. De host bewaart per Director de laatste 20 groepswijzigingen voor undo (alleen wijzigingen die iets veranderden).
  mastering(inst,action,opts){
    const sid=inst&&inst._id, src=sid&&this.devices.get(sid);
    if(!src||!PK.portList(src.ports,'out','mastering').length) return {error:PK.pkt('m.mastering_geen_regie')};
    action=String(action); if(!['inspect','apply','analyse','accept','undo'].includes(action)) return {error:PK.pkt('m.mastering_onbekende_actie',action)};
    const wired=PK.masteringTargets(sid).map(t=>t.id), ask=opts&&Array.isArray(opts.targetIds)?opts.targetIds.map(String):wired, ids=wired.filter(x=>ask.includes(x));
    const U=this._masterUndo||(this._masterUndo=new Map()), push=snap=>{ if(!snap.length||!changed) return; const L=U.get(sid)||[]; L.push(snap); while(L.length>20) L.shift(); U.set(sid,L); }, results=[]; let changed=0;
    const note=(id,o)=>{ const r=this.devices.get(id); results.push({id,name:r?r.def.name:id,...o}); if(o.ok!==false&&(action==='analyse'||(o.changed||[]).length)) changed++; };
    const call=(id,fn,...a)=>{ const r=this.devices.get(id); if(!r||typeof r.inst[fn]!=='function') return {ok:false,reason:PK.pkt('m.mastering_geen_methode',fn)};
      try{ const x=r.inst[fn](...a); return x&&typeof x==='object'?x:{ok:true}; }catch(e){ console.warn(fn,r.def.name,e); return {ok:false,reason:String(e&&e.message||e)}; } };
    const snapshot=()=>{ const snap=[]; ids.forEach(id=>{ const r=this.devices.get(id); try{ if(r&&typeof r.inst.getState==='function') snap.push([id,JSON.parse(JSON.stringify(r.inst.getState()))]); }catch(e){} }); return snap; };
    if(action==='undo'){ const L=U.get(sid), snap=L&&L.pop(); if(!snap) return {error:PK.pkt('m.mastering_niets_terug')}; if(!L.length) U.delete(sid);
      snap.forEach(([id,st])=>{ const r=this.devices.get(id); if(!r||!wired.includes(id)) return; try{ r.inst.setState(st); note(id,{ok:true,changed:['*'],skipped:[]}); }catch(e){ note(id,{ok:false,reason:String(e&&e.message||e)}); } });
      return {changed,results}; }
    if(action==='apply'){ const set=opts&&opts.settings&&typeof opts.settings==='object'?opts.settings:null; if(!set) return {error:PK.pkt('m.mastering_geen_instellingen')};
      const mine=ids.filter(id=>set[id]&&typeof set[id]==='object'), snap=[]; mine.forEach(id=>{ const r=this.devices.get(id); try{ if(typeof r.inst.getState==='function') snap.push([id,JSON.parse(JSON.stringify(r.inst.getState()))]); }catch(e){} });
      mine.forEach(id=>note(id,call(id,'configureMastering',set[id]))); push(snap); return {changed,results}; }
    if(action==='accept'){ const snap=snapshot(); ids.forEach(id=>note(id,call(id,'acceptMasteringProposal'))); push(snap); return {changed,results}; }
    if(action==='analyse'){ ids.forEach(id=>note(id,call(id,'analyseMastering'))); return {changed,results}; }
    ids.forEach(id=>note(id,{ok:true,report:call(id,'getMasteringReport')})); return {changed:0,results};
  },
  bundleChanged(inst,port){ const sid=inst&&inst._id; if(!sid) return; this.cables.filter(c=>c.kind==='multi'&&c.from.id===sid&&(port==null||c.from.port===port)).forEach(PK.deliverBundle); },
  // contract v1.13: regelaars van andere apparaten. Een controller (bijvoorbeeld de MIDI Hub) ziet alle schuiven, draaiknoppen, keuzelijsten, vinkjes en knoppen
  // op de kaart van een ander apparaat en zet ze met een waarde 0..1. De host vindt ze zelf (ook in open shadow roots); de apparaten hoeven niets te doen.
  controls(inst,targetId){ const me=inst&&inst._id, r=this.devices.get(targetId); if(!r||targetId===me) return []; return PK.ctlList(r).map(x=>({...x.d})); },
  setControl(inst,targetId,key,value){ const me=inst&&inst._id, r=this.devices.get(targetId); if(!r||targetId===me) return false; return PK.ctlSet(r,String(key),+value); },
  // contract v1.5: is deze poort van mij bekabeld? (bv. om een bundel alleen op lege kanalen te zetten)
  isWired(inst,port,dir){ const id=inst&&inst._id; return this.cables.some(c=>dir==='out'?(c.from.id===id&&c.from.port===port):(c.to.id===id&&c.to.port===port)); },
  eventBundleChanged(inst,port){ const sid=inst&&inst._id; if(!sid) return; this.cables.filter(c=>c.kind==='multievent'&&c.from.id===sid&&(port==null||c.from.port===port)).forEach(PK.deliverEventBundle); },
  emit(fromInst,port,ev){ this.cables.forEach(c=>{ if(c.kind==='multievent'&&c.from.id===fromInst._id&&c.from.port===port){ const d=this.devices.get(c.to.id); if(d&&d.inst.onEvent){ try{ d.inst.onEvent(c.to.port,{...ev,bundle:PK.eventBundleKey(c)}); }catch(e){ console.warn('onEvent()',d.def.name,e); } } }
    if(c.kind==='event'&&c.from.id===fromInst._id&&c.from.port===port){ const d=this.devices.get(c.to.id); if(d&&d.inst.onEvent) d.inst.onEvent(c.to.port,ev); } }); },
  // helpers for device authors
  ui:{
    // contract v1.2: place one of your ports inside your own UI (light DOM). Pass your instance.
    jack(inst,parent,portId,dir,label){ const r=Host.devices.get(inst&&inst._id); if(!r) throw new Error(PK.pkt('m.jack_geef_je_instance_mee'));
      const P=r.ports, L=['audio','event','mod','multi','mastering','multievent'].flatMap(k=>PK.portList(P,dir,k).map(x=>[x,k]));
      const hit=L.find(([x])=>x.id===portId); if(!hit) throw new Error(PK.pkt('m.jack_poort_bestaat_niet_roep',portId,dir));
      const el=PK.makePortEl(r.inst._id,hit[0],hit[1],dir,label); el.classList.add('jack'); parent.appendChild(el); return el; },
    knob(parent,label,[mn,mx,st],val,fmt,onchange,opts){ return PK.pkKnob(parent,label,mn,mx,st,val,fmt,onchange,opts||{}); },
    select(parent,label,opts,val,onchange){const w=document.createElement('div'); w.className='k'; w.style.gridTemplateColumns='70px minmax(0,1fr)'; const l=document.createElement('label'); l.textContent=label; const s=document.createElement('select'); opts.forEach(([v,t])=>{const o=document.createElement('option'); o.value=v; o.textContent=t; s.appendChild(o);}); s.value=val; s.setAttribute('aria-label',label); s.onchange=()=>onchange(s.value); w.append(l,s); parent.appendChild(w); return s;},
    steps(parent,label,arr,onchange){const row=document.createElement('div'); row.className='rowlab'; const l=document.createElement('span'); l.textContent=label; const g=document.createElement('div'); g.className='grid16'; const btns=[]; for(let s=0;s<16;s++){const b=document.createElement('button'); b.className='st'+(s%4===0?' q':'')+(arr[s]?' on':''); b.setAttribute('aria-label',PK.pkt('m.stap',label,s+1)); b.onclick=()=>{arr[s]=arr[s]?0:1; b.classList.toggle('on',!!arr[s]); onchange&&onchange(s,arr[s]);}; g.appendChild(b); btns.push(b);} row.append(l,g); parent.appendChild(row); return {btns,paint(){btns.forEach((b,s)=>b.classList.toggle('on',!!arr[s]));},cursor(s){btns.forEach((b,i)=>b.classList.toggle('cur',i===s));}};},
    noise(ctx){ if(!Host._nb){const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; Host._nb=b;} const s=ctx.createBufferSource(); s.buffer=Host._nb; s.loop=true; s.loopStart=Math.random(); return s; },
    curve(k){const n=1024,c=new Float32Array(n),a=k*40; for(let i=0;i<n;i++){const x=i*2/n-1; c[i]=a>0?((1+a)*x)/(1+a*Math.abs(x)):x;} return c;},
  },
}; PK.Host=Host;
})(window.__PK);
