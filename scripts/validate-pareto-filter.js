// simple node validation script: fetch /api/items and /api/incidents and simulate Pareto filter
(async function(){
  const base = process.env.BASE_URL || 'http://localhost:9003';
  const fetchJson = async (url) => {
    for (let i=0;i<20;i++){
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
        // if server returns 500, still wait
      } catch (e) {
        // ignore
      }
      await new Promise(r=>setTimeout(r,1000));
    }
    throw new Error('timeout fetching '+url);
  };

  try{
    console.log('Fetching items...');
    const items = await fetchJson(base + '/api/items');
    console.log('Fetched', Array.isArray(items) ? items.length : 'non-array', 'items');
    console.log('Fetching incidents...');
    const incidents = await fetchJson(base + '/api/incidents');
    console.log('Fetched', Array.isArray(incidents) ? incidents.length : 'non-array', 'incidents');

    const names = (Array.isArray(items) ? items : []).map(it => String(it.name || it.item_name || '').toLowerCase()).filter(Boolean);
    const allowed = new Set(names);

    const mapping = (itemName) => {
      const name = (itemName || '').toLowerCase();
      if (name.includes('ar condicionado') || name.includes('ar-condicionado') || name.includes('split')) return 'Ar Condicionado';
      if (name.includes('compressor')) return 'Compressor';
      if (name.includes('painel') || name.includes('quadro')) return 'Painel / Quadro Elétrico';
      if (name.includes('motor') || name.includes('elevador')) return 'Motor / Mecânica';
      if (name.includes('válvula') || name.includes('valvula')) return 'Válvula';
      if (name.includes('máquina') || name.includes('maquina')) return 'Máquina';
      if (name.includes('bomba')) return 'Bomba';
      if (name.includes('sensor')) return 'Sensor';
      if (name.includes('esteira')) return 'Esteira / Transportador';
      return 'Outros';
    };

    let total = 0, matched = 0;
    const counts = {};
    const matchedSamples = [];
    for (const inc of (Array.isArray(incidents) ? incidents : [])){
      total++;
      const name = String(inc.itemName || inc.item_name || inc.description || '').toLowerCase();
      if (!name) continue;
      let ok = false;
      if (allowed.has(name)) ok = true;
      if (!ok){
        for (const m of allowed){
          if (!m) continue;
          if (name.includes(m) || m.includes(name)) { ok = true; break; }
        }
      }
      if (ok){
        matched++;
        const cat = mapping(inc.itemName || inc.description || '');
        counts[cat] = (counts[cat]||0) + 1;
        if (matchedSamples.length < 10) matchedSamples.push({ id: inc.id, itemName: inc.itemName, location: inc.location });
      }
    }

    console.log('Total incidents:', total);
    console.log('Incidents matching matrix items:', matched);
    console.log('Sample matched incidents:', matchedSamples);
    const arr = Object.entries(counts).map(([k,v])=>({category:k,count:v})).sort((a,b)=>b.count-a.count);
    console.log('Pareto categories (matched incidents):', arr.slice(0,20));
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(2);
  }
})();
