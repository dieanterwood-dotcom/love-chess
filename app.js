
function getCurrentPlayer(){
  return localStorage.getItem('lovechess_current_player')||'';
}
function loginPlayer(id){localStorage.setItem('lovechess_current_player',id);location.hash='profile/'+id;}
function logoutPlayer(){localStorage.removeItem('lovechess_current_player');location.hash='';}
function auth(){
  const value=prompt('Введите ник игрока:');
  if(!value)return;
  const key=findPlayerByName(value);
  if(!key){alert('Игрок с таким ником не найден.');return;}
  localStorage.setItem('lovechess_current_player',key);
  profile(key);
}

const KEY='lovechess_mvp_v2';
const seed={tournaments:[{id:'t1',name:'LOVE CHESS BLITZ',date:'2026-09-18',time:'18:00',place:'GASTROKORT',format:'Blitz',control:'5+3',rounds:9,fee:0,status:'Регистрация',players:['LC-1001','LC-1002','LC-1003','LC-1004'],currentRound:0,roundData:[]}],players:{'LC-1001':{rating:1420,games:28,w:17,d:4,l:7,history:[1350,1380,1402,1420]},'LC-1002':{rating:1368,games:31,w:14,d:7,l:10,history:[1300,1325,1348,1368]},'LC-1003':{rating:1287,games:19,w:9,d:5,l:5,history:[1200,1240,1265,1287]},'LC-1004':{rating:1510,games:35,w:22,d:5,l:8,history:[1450,1470,1492,1510]}}};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seed;
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function nav(active){return `<nav class="nav"><div class="shell navin"><button class="brand-logo" onclick="route('schedule')" aria-label="LOVE CHESS"><div class="brand-wordmark">LOVE CHESS</div></button><div class="links"><button class="${active==='schedule'?'active':''}" onclick="route('schedule')">Расписание</button><button class="${active==='rating'?'active':''}" onclick="route('rating')">Рейтинг</button><button class="${active==='profile'?'active':''}" onclick="route('profile')">Мой профиль</button><button class="${active==='clock'?'active':''}" onclick="route('clock')">Часы</button><button class="${active==='organizer'?'active':''}" onclick="route('organizer')">Организатор</button></div></div></nav>`}
function layout(content,active){document.getElementById('app').innerHTML=nav(active)+`<main class="shell">${content}</main>`;if(active==='schedule'){setTimeout(()=>{renderPhotos();startPhotoAuto();},0)}else{stopPhotoAuto()}}
function fmt(d){return new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})}
function player(id){return db.players[id]||(db.players[id]={rating:1000,games:0,w:0,d:0,l:0,tournaments:[],history:[1000],avatar:'pawn'})}
function displayName(id){const p=db.players[id];return p&&p.nickname?p.nickname:id}
function findPlayerByName(value){const q=String(value||'').trim().toLowerCase();if(!q)return '';const direct=Object.keys(db.players).find(id=>id.toLowerCase()===q);if(direct)return direct;return Object.keys(db.players).find(id=>(db.players[id].nickname||'').trim().toLowerCase()===q)||''}
function nextPlayerId(){let n=1001;const used=new Set(Object.keys(db.players));while(used.has('LC-'+n))n++;return 'LC-'+n}
function ensurePlayerNicknames(){let changed=false;Object.keys(db.players).forEach(id=>{const p=db.players[id];if(p&&!p.nickname){p.nickname=id;changed=true}});if(changed)save()}
ensurePlayerNicknames()
Object.keys(db.players).forEach(id=>{if(!db.players[id].avatar)db.players[id].avatar='pawn'}); save()
function getStandings(t){const s={};t.players.forEach(id=>s[id]={id,points:0,buchholz:0,played:[],colors:[]});(t.roundData||[]).forEach(r=>r.pairs.forEach(m=>{if(m.bye){s[m.white].points+=1;s[m.white].colors.push('W');return}s[m.white].played.push(m.black);s[m.black].played.push(m.white);s[m.white].colors.push('W');s[m.black].colors.push('B');if(m.result==='1-0')s[m.white].points+=1;if(m.result==='0-1')s[m.black].points+=1;if(m.result==='0.5-0.5'){s[m.white].points+=.5;s[m.black].points+=.5}}));Object.values(s).forEach(x=>x.buchholz=x.played.reduce((sum,opp)=>sum+(s[opp]?.points||0),0));return Object.values(s).sort((a,b)=>b.points-a.points||b.buchholz-a.buchholz||player(b.id).rating-player(a.id).rating)}
function standingsTable(rows){
 const t=arguments.length>1?arguments[1]:null;
 const rounds=t?.roundData||[];
 const statById={};
 rows.forEach(x=>statById[x.id]={w:0,d:0,l:0,results:[]});
 rounds.forEach(r=>(r.pairs||[]).forEach(m=>{
   if(!statById[m.white])return;
   if(m.bye){statById[m.white].results.push('BYE');return}
   if(!statById[m.black])return;
   const a=statById[m.white],b=statById[m.black];
   if(m.result==='1-0'){a.w++;b.l++;a.results.push('1');b.results.push('0')}
   else if(m.result==='0-1'){a.l++;b.w++;a.results.push('0');b.results.push('1')}
   else if(m.result==='0.5-0.5'){a.d++;b.d++;a.results.push('½');b.results.push('½')}
   else {a.results.push('—');b.results.push('—')}
 }));
 const completedRounds=rounds.length;
 return `<div class="standings-wrap"><table class="table standings-table"><thead><tr><th class="rank-col">#</th><th>Игрок</th><th>Рейтинг</th><th class="points-col">Очки</th><th>BH</th><th>П / Н / П</th>${completedRounds?`<th class="results-col">Результаты</th>`:''}</tr></thead><tbody>${rows.map((x,i)=>{const st=statById[x.id]||{w:0,d:0,l:0,results:[]};const leader=i===0&&x.points>0;return `<tr class="${leader?'leader-row':''}"><td class="rank-cell"><span class="rank-number">${i+1}</span></td><td><button class="ghost player-link" onclick="profile('${x.id}')">${esc(displayName(x.id))}</button></td><td class="rating-cell">${player(x.id).rating}</td><td class="points-cell"><b>${Number.isInteger(x.points)?x.points:x.points.toFixed(1)}</b></td><td>${x.buchholz.toFixed(1)}</td><td class="record-cell"><span class="win-count">${st.w}</span> / ${st.d} / <span class="loss-count">${st.l}</span></td>${completedRounds?`<td class="results-cell">${st.results.map((res,j)=>`<span class="round-result ${res==='1'?'win':res==='0'?'loss':res==='½'?'draw':res==='BYE'?'bye':''}" title="Тур ${j+1}">${res}</span>`).join('')}</td>`:''}</tr>`}).join('')}</tbody></table></div>`
}
function roundBlock(t,r,readonly=false){
  if(!r)return '';
  const ri=(t.roundData||[]).indexOf(r);
  const editable=!readonly && ri===t.currentRound-1 && !r.completed;
  return `<section class="section round-panel">
    <div class="row round-panel-head"><div><h2>Тур ${r.number}</h2><span class="tag">${r.completed?'Результаты внесены':'Внесите результаты'}</span></div></div>
    <div class="matches">${(r.pairs||[]).map((m,i)=>`<div class="match card">
      ${m.bye?`<div class="readonly-match-content"><div class="readonly-board">Стол ${i+1}</div><div class="readonly-player white-player"><b>${esc(displayName(m.white))}</b></div><div class="readonly-score score-bye">BYE</div><div class="readonly-player black-player"><span class="muted">+1 очко</span></div></div>`:readonly||!editable?`<div class="readonly-match-content"><div class="readonly-board">Стол ${i+1}</div><div class="readonly-player white-player"><b>${esc(displayName(m.white))}</b></div><div class="readonly-score ${m.result==='1-0'?'score-win-white':m.result==='0-1'?'score-win-black':m.result==='0.5-0.5'?'score-draw':'score-empty'}">${m.result==='1-0'?'1–0':m.result==='0-1'?'0–1':m.result==='0.5-0.5'?'½–½':'—'}</div><div class="readonly-player black-player"><b>${esc(displayName(m.black))}</b></div></div>`:`<div><span class="board">Стол ${i+1}</span><b>${esc(displayName(m.white))}</b> <span class="muted">vs</span> <b>${esc(displayName(m.black))}</b></div>
      <select onchange="setResult('${t.id}',${ri},${i},this.value)"><option value="">Результат</option><option value="1-0" ${m.result==='1-0'?'selected':''}>1–0</option><option value="0-1" ${m.result==='0-1'?'selected':''}>0–1</option><option value="0.5-0.5" ${m.result==='0.5-0.5'?'selected':''}>½–½</option></select>`}
    </div>`).join('')}</div>
    ${editable?`<div class="actions"><button class="primary" onclick="finishRound('${t.id}')">Сохранить результаты тура</button></div>`:''}
  </section>`;
}
function tournament(id, selectedRound){
  const t=db.tournaments.find(x=>x.id===id); if(!t)return;
  const rows=getStandings(t);
  const totalRounds=t.roundData?.length||0;
  const selectedIndex=Number.isInteger(selectedRound) ? Math.max(0,Math.min(selectedRound-1,totalRounds-1)) : Math.max(0,totalRounds-1);
  const r=t.roundData?.[selectedIndex];
  const undoButtons=t.currentRound>0?`<div class="round-tools"><button class="danger" onclick="deleteLastRound('${t.id}')">Удалить последний тур</button>${r?.completed?`<button class="ghost" onclick="editLastRound('${t.id}')">Изменить результаты тура ${t.currentRound}</button>`:''}</div>`:'';
  const deleteBtn=isOrganizer()?`<button class="danger" onclick="deleteTournament('${t.id}')">Удалить турнир</button>`:'';
  const registrationOpen=t.currentRound===0 && t.status==='Регистрация';
  const current=getCurrentPlayer();
  const currentRegistered=!!current && t.players.includes(current);
  const registrationBlock=registrationOpen?`<section class="section"><div class="card registration-card"><div class="row"><div><div class="eyebrow">Регистрация</div><h2>Участие в турнире</h2><p class="muted">Введите ник, который организатор уже добавил в систему. Зарегистрироваться могут только участники с действующим профилем LOVE CHESS.</p></div><span class="tag">${t.players.length} участников</span></div>${currentRegistered?`<div class="registration-confirmed"><div><strong>Вы зарегистрированы</strong><div class="muted">${esc(displayName(current))}</div></div><button class="danger danger-outline" onclick="cancelRegistration('${t.id}')">Отменить регистрацию</button></div>`:`<div class="registration-form"><div class="field"><label for="registrationNick">Ваш ник</label><input id="registrationNick" maxlength="40" placeholder="Введите свой ник" autocomplete="off" onkeydown="if(event.key==='Enter')registerTournament('${t.id}')"></div><button class="primary" onclick="registerTournament('${t.id}')">Зарегистрироваться</button></div><p class="muted registration-note">Если ник не найден, сначала оформите подписку на клуб и дождитесь, пока организатор добавит ваш профиль в систему.</p>`}</div></section>`:'';
  const content=`<section class="hero"><div class="eyebrow">Турнир</div><h1>${esc(t.name)}</h1><p>${fmt(t.date)} · ${esc(t.time)} · ${esc(t.place)}</p><p class="muted">Швейцарская жеребьёвка: без повторных встреч, с учётом очков, цветов и BYE.</p><div class="hero-actions"><button class="primary" onclick="startRound('${t.id}')">${t.currentRound===0?'Начать турнир':(t.status==='Завершён'?'Турнир завершён':'Сформировать следующий тур')}</button><button class="ghost" onclick="route('schedule')">← Расписание</button><button class="ghost" onclick="tournamentSettings('${t.id}')">⚙ Настройки турнира</button>${deleteBtn}</div>${undoButtons}</section>
  ${registrationBlock}
  <section class="section"><div class="grid"><div class="card"><div class="meta">Формат</div><div class="title">${esc(t.format)}</div><div class="meta">${esc(t.control)} · ${t.rounds} туров</div></div><div class="card"><div class="meta">Тур</div><div class="rating smallrating">${t.currentRound} / ${t.rounds}</div></div><div class="card"><div class="meta">Участников</div><div class="rating smallrating">${t.players.length}</div></div></div></section>
  ${t.currentRound>0?`<section class="section round-selector-section"><div class="round-selector-head"><div><div class="eyebrow">Туры</div><h2>Просмотр туров</h2></div><span class="muted round-selector-count">${totalRounds} из ${t.rounds}</span></div><div class="round-selector">${(t.roundData||[]).map((rr,i)=>`<button class="round-tab ${i===selectedIndex?'active':''}" onclick="tournament('${t.id}',${i+1})">Тур ${rr.number}</button>`).join('')}</div></section>${roundBlock(t,r)}`:`<section class="section"><div class="card"><h2>Участники</h2><div class="addrow"><input id="newPlayer" placeholder="Например RomaChess"><button class="primary" onclick="addPlayer('${t.id}')">Добавить</button></div>${standingsTable(rows,t)}</div></section>`}
  ${t.currentRound>0?`<section class="section"><div class="row standings-heading"><div><h2>Турнирная таблица</h2><p class="muted">Очки → Buchholz → рейтинг. Результаты по турам — справа.</p></div></div>${standingsTable(rows,t)}</section>`:''}`;
  layout(content,'schedule');
}

function reverseRoundRating(r){
 if(!r?.ratingDeltas)return false;
 r.ratingDeltas.forEach(d=>{const p=player(d.id);p.rating=d.beforeRating;p.games=d.beforeGames;p.w=d.beforeW;p.d=d.beforeD;p.l=d.beforeL;p.history=d.beforeHistory.slice()});
 return true;
}
function deleteLastRound(id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===id);if(!t||!t.currentRound)return;
 const r=t.roundData[t.currentRound-1];
 if(!confirm(`Удалить тур ${r.number}? ${r.completed?'Результаты и изменения рейтинга этого тура будут отменены.':'Сформированные пары этого тура будут удалены.'}`))return;
 if(r.completed && !reverseRoundRating(r)){alert('Для этого старого тура нет сохранённого снимка рейтинга. Создайте тур заново в новой версии сайта, чтобы использовать откат.');return}
 t.roundData.pop();t.currentRound--;t.status=t.currentRound===0?'Регистрация':'Идёт';save();tournament(id);
}
function editLastRound(id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===id);if(!t||!t.currentRound)return;
 const r=t.roundData[t.currentRound-1];if(!r.completed)return;
 if(!reverseRoundRating(r)){alert('Для этого тура нет сохранённого снимка рейтинга.');return}
 r.completed=false;r.ratingDeltas=null;t.status='Идёт';save();tournament(id);
}

function pairingColorBalance(id){
 const p=pairingContext.players[id];
 const c=p?.colors||[];
 const w=c.filter(x=>x==='W').length, b=c.filter(x=>x==='B').length;
 return w-b;
}
function pairingColorPenalty(a,b){
 const ca=pairingColorBalance(a), cb=pairingColorBalance(b);
 let penalty=Math.abs(ca+cb)*20;
 const la=(pairingContext.players[a]?.colors||[]).slice(-2);
 const lb=(pairingContext.players[b]?.colors||[]).slice(-2);
 // Не даём игроку получать один и тот же цвет три раза подряд, если есть альтернатива.
 if(la.length>=2 && la[0]===la[1]) penalty+=25;
 if(lb.length>=2 && lb[0]===lb[1]) penalty+=25;
 return penalty;
}
function chooseColors(a,b){
 const ca=pairingColorBalance(a), cb=pairingColorBalance(b);
 const ah=pairingContext.players[a]?.colors||[], bh=pairingContext.players[b]?.colors||[];
 const options=[
  {white:a,black:b,cost:0},
  {white:b,black:a,cost:0}
 ];
 options.forEach(o=>{
  const w=o.white, bl=o.black;
  const wc=pairingColorBalance(w), bc=pairingColorBalance(bl);
  o.cost=Math.abs((wc-1)-(bc+1));
  const wh=pairingContext.players[w]?.colors||[], bhh=pairingContext.players[bl]?.colors||[];
  if(wh.length>=2 && wh[wh.length-1]===wh[wh.length-2] && wh[wh.length-1]==='W')o.cost+=100;
  if(bhh.length>=2 && bhh[bhh.length-1]===bhh[bhh.length-2] && bhh[bhh.length-1]==='B')o.cost+=100;
  // Если баланс цветов одинаковый, чередование предпочтительнее.
  if(wh.length && wh[wh.length-1]==='B')o.cost-=5;
  if(bhh.length && bhh[bhh.length-1]==='W')o.cost-=5;
 });
 if(options[1].cost<options[0].cost)return options[1];
 if(options[0].cost<options[1].cost)return options[0];
 return Math.random()<.5?options[0]:options[1];
}
function pairCost(a,b){
 const A=pairingContext.players[a],B=pairingContext.players[b];
 const scoreDiff=Math.abs(A.points-B.points);
 const color=pairingColorPenalty(a,b);
 const rating=Math.abs((player(a).rating||1000)-(player(b).rating||1000))/100;
 // Очки имеют основной вес: внутри одной группы стоимость 0, затем минимальные floaters.
 return scoreDiff*10000 + color*10 + rating;
}
function canPairPlayers(a,b){
 const A=pairingContext.players[a],B=pairingContext.players[b];
 return !!A && !!B && !A.played.includes(b) && !B.played.includes(a);
}
function swissPairing(ids){
 // Поиск минимально конфликтной полной жеребьёвки. Игрок с наименьшим
 // количеством допустимых соперников выбирается первым — это резко снижает
 // вероятность тупиков. Стоимость предпочитает ту же очковую группу, затем
 // цветовой баланс и близкий рейтинг. Так реализуются floaters без повторов.
 if(!ids.length)return {pairs:[],cost:0};
 if(ids.length===2){
  if(!canPairPlayers(ids[0],ids[1]))return null;
  return {pairs:[[ids[0],ids[1]]],cost:pairCost(ids[0],ids[1])};
 }
 let best=null;
 let pivot=ids[0], pivotChoices=[];
 for(const a of ids){
  const choices=ids.filter(b=>b!==a&&canPairPlayers(a,b));
  if(!pivotChoices.length || choices.length<pivotChoices.length){pivot=a;pivotChoices=choices;}
 }
 pivotChoices.sort((a,b)=>pairCost(pivot,a)-pairCost(pivot,b));
 // Ограничиваем ветвление, но всегда оставляем всех соперников из той же группы очков.
 const same=pivotChoices.filter(x=>pairingContext.players[x].points===pairingContext.players[pivot].points);
 const others=pivotChoices.filter(x=>pairingContext.players[x].points!==pairingContext.players[pivot].points);
 const candidates=[...same,...others].slice(0,Math.max(12,same.length));
 for(const opp of candidates){
  const rest=ids.filter(x=>x!==pivot&&x!==opp);
  const tail=swissPairing(rest);
  if(!tail)continue;
  const total=pairCost(pivot,opp)+tail.cost;
  if(!best||total<best.cost)best={pairs:[[pivot,opp],...tail.pairs],cost:total};
 }
 return best;
}
function chooseSwissBye(rows){
 const noBye=rows.filter(x=>!pairingContext.previousByes.has(x.id));
 const pool=noBye.length?noBye:rows;
 // BYE обычно уходит игроку с минимальным количеством очков; при равенстве — ниже в таблице.
 return pool.slice().sort((a,b)=>a.points-b.points||a.buchholz-b.buchholz||player(a.id).rating-player(b.id).rating)[0]?.id||null;
}
function startRound(id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===id);
 if(!t)return;
 if(!t.players || t.players.length<2){alert('Добавьте минимум двух игроков.');return}
 if(t.currentRound>0 && !t.roundData[t.currentRound-1].completed){alert('Сначала сохраните результаты текущего тура.');return}
 if(t.currentRound>=t.rounds){t.status='Завершён';save();tournament(id);return}
 const rows=getPairingRows(t);
 if(rows.length<2){alert('Для нового тура нужно минимум два активных игрока.');return}
 pairingContext={
  players:Object.fromEntries(rows.map(x=>[x.id,x])),
  previousByes:new Set(),
  round:t.currentRound+1
 };
 (t.roundData||[]).forEach(r=>(r.pairs||[]).forEach(m=>{if(m.bye)pairingContext.previousByes.add(m.white)}));
 let pool=rows.slice();
 let bye=null;
 if(pool.length%2){bye=chooseSwissBye(pool);pool=pool.filter(x=>x.id!==bye);}
 let result=swissPairing(pool.map(x=>x.id));
 // Если BYE-кандидат сделал оставшуюся группу непарной/невозможной,
 // пробуем других кандидатов — важно не создавать повторов.
 if(!result && rows.length%2){
  const candidates=rows.filter(x=>!pairingContext.previousByes.has(x.id)).sort((a,b)=>a.points-b.points||a.buchholz-b.buchholz||player(a.id).rating-player(b.id).rating);
  for(const cand of candidates){
   const rest=rows.filter(x=>x.id!==cand.id).map(x=>x.id);
   const r=swissPairing(rest);
   if(r){bye=cand.id;result=r;break;}
  }
 }
 if(!result){
  alert('Не удалось сформировать корректную швейцарскую жеребьёвку без повторных встреч. Система не будет создавать тур с повтором. Проверьте количество участников и предыдущие результаты.');
  return;
 }
 const pairs=result.pairs.map(([a,b])=>{const c=chooseColors(a,b);return {white:c.white,black:c.black,result:''};});
 if(bye)pairs.push({white:bye,black:null,bye:true,result:'BYE'});
 if(!t.roundData)t.roundData=[];
 t.roundData.push({number:t.currentRound+1,pairs,completed:false,pairingType:'swiss'});
 t.currentRound++;t.status='Идёт';save();tournament(id);
}
let pairingContext={players:{},previousByes:new Set(),round:0};

function isPlayerActive(t,id){return !t.playerStatus || t.playerStatus[id] !== 'inactive'}
function getPairingRows(t){return getStandings(t).filter(x=>isPlayerActive(t,x.id))}
function tournamentSettings(id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===id); if(!t)return;
 const rows=getStandings(t);
 layout(`<section class="hero"><div class="eyebrow">Турнир</div><h1>Настройки турнира</h1><p>${esc(t.name)} · управление участниками турнира.</p><div class="hero-actions"><button class="ghost" onclick="tournament('${t.id}')">← Вернуться к турниру</button></div></section>
 <section class="section"><div class="card"><h2>Добавить игрока</h2><p class="muted">Введите ник игрока. Технический ID хранится внутри системы и не показывается пользователю.</p>
 <div class="addrow"><input id="settingsPlayer" placeholder="Например RomaChess"><button class="primary" onclick="settingsAddPlayer('${t.id}')">Добавить игрока</button></div></div></section>
 <section class="section"><div class="card"><div class="row"><div><h2>Участники</h2><p class="muted">«Не использовать в жеребьёвке» оставляет игрока в турнире, но исключает его из следующих туров.</p></div><span class="tag">${t.players.length} участников</span></div>
 <table class="table"><thead><tr><th>Игрок</th><th>Рейтинг</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
 ${rows.map(x=>{const active=isPlayerActive(t,x.id);const p=player(x.id);return `<tr><td><button class="ghost" onclick="profile('${x.id}')">${esc(displayName(x.id))}</button></td><td>${p.rating}</td><td>${active?'<span class="tag">Участвует</span>':'<span class="tag off">Не участвует</span>'}</td><td><div class="settings-actions"><button class="ghost" onclick="editNickname('${x.id}')">Сменить ник</button>${active?`<button class="ghost" onclick="togglePlayer('${t.id}','${x.id}')">Не использовать в жеребьёвке</button>`:`<button class="ghost" onclick="togglePlayer('${t.id}','${x.id}')">Вернуть в жеребьёвку</button>`}<button class="danger danger-outline" onclick="removePlayer('${t.id}','${x.id}')">Удалить из турнира</button><button class="danger danger-outline" onclick="deletePlayer('${x.id}')">Удалить профиль</button></div></td></tr>`}).join('')}
 </tbody></table></div></section>`,`schedule`);
}
function settingsAddPlayer(tid){
 if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===tid), el=document.getElementById('settingsPlayer');
 const nickname=(el?.value||'').trim().slice(0,40);
 if(!nickname){alert('Введите ник игрока.');return}
 const existing=findPlayerByName(nickname);
 const id=existing||nextPlayerId();
 if(t.players.includes(id)){alert('Этот игрок уже есть в турнире.');return}
 if(!db.players[id])db.players[id]={rating:1000,games:0,w:0,d:0,l:0,tournaments:[],history:[1000],nickname,avatar:'pawn'};
 else db.players[id].nickname=nickname;
 if(!t.playerStatus)t.playerStatus={};
 t.playerStatus[id]='active';
 t.players.push(id);
 save(); tournamentSettings(tid);
}
function togglePlayer(tid,id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===tid); if(!t)return;
 if(!t.playerStatus)t.playerStatus={};
 t.playerStatus[id]=isPlayerActive(t,id)?'inactive':'active';
 save(); tournamentSettings(tid);
}
function playerHasPlayedInTournament(t,id){
 return (t.roundData||[]).some(r=>r.pairs.some(m=>m.white===id||m.black===id));
}
function removePlayer(tid,id){if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===tid); if(!t)return;
 const played=playerHasPlayedInTournament(t,id);
 const msg=played
  ? `Игрок ${id} уже участвовал в партиях этого турнира. Удаление уберёт его из списка участников и следующих жеребьёвок, но прошлые партии останутся в истории. Продолжить?`
  : `Удалить ${displayName(id)} из турнира?`;
 if(!confirm(msg))return;
 t.players=t.players.filter(x=>x!==id);
 if(t.playerStatus)delete t.playerStatus[id];
 save(); tournamentSettings(tid);
}

function setResult(tid,ri,mi,val){if(!requireOrganizer())return;const t=db.tournaments.find(x=>x.id===tid);if(!t)return;t.roundData[ri].pairs[mi].result=val;save();}
function finishRound(id){if(!requireOrganizer())return;const t=db.tournaments.find(x=>x.id===id),r=t.roundData[t.currentRound-1];if(r.pairs.some(m=>!m.bye&&!m.result)){alert('Внесите результаты всех партий.');return}if(r.completed)return;r.completed=true;applyRatings(t,r);if(t.currentRound>=t.rounds)t.status='Завершён';save();tournament(id)}
function applyRatings(t,r){
 r.ratingDeltas=[];
 const seen=new Set();
 r.pairs.forEach(m=>{
  if(m.bye)return;
  const a=player(m.white),b=player(m.black);
  for(const p of [a,b]){if(!seen.has(p)){r.ratingDeltas.push({id:Object.keys(db.players).find(id=>db.players[id]===p),beforeRating:p.rating,beforeGames:p.games,beforeW:p.w,beforeD:p.d,beforeL:p.l,beforeHistory:p.history.slice()});seen.add(p)}}
  const sa=m.result==='1-0'?1:m.result==='0-1'?0:.5,ea=1/(1+Math.pow(10,(b.rating-a.rating)/400)),da=Math.round(32*(sa-ea));
  a.rating=Math.max(100,a.rating+da);b.rating=Math.max(100,b.rating-da);a.games++;b.games++;
  if(sa===1){a.w++;b.l++}else if(sa===0){a.l++;b.w++}else{a.d++;b.d++}
  a.history.push(a.rating);b.history.push(b.rating)
 })
}

function registerTournament(tid){
  const t=db.tournaments.find(x=>x.id===tid);
  if(!t)return;
  if(t.currentRound>0 || t.status!=='Регистрация'){alert('Регистрация на этот турнир уже закрыта.');return}
  const el=document.getElementById('registrationNick');
  const nickname=(el?.value||'').trim().slice(0,40);
  if(!nickname){alert('Введите свой ник.');return}
  const id=findPlayerByName(nickname);
  if(!id){
    alert('Игрок с таким ником не найден в системе LOVE CHESS. Сначала оформите подписку на клуб и дождитесь, пока организатор добавит ваш профиль.');
    return;
  }
  if(t.players.includes(id)){alert('Вы уже зарегистрированы на этот турнир.');return}
  if(!t.playerStatus)t.playerStatus={};
  t.playerStatus[id]='active';
  t.players.push(id);
  localStorage.setItem('lovechess_current_player',id);
  save();
  tournament(tid);
}
function cancelRegistration(tid){
  const t=db.tournaments.find(x=>x.id===tid);
  const id=getCurrentPlayer();
  if(!t||!id||!t.players.includes(id))return;
  if(t.currentRound>0 || t.status!=='Регистрация'){alert('Отменить регистрацию уже нельзя.');return}
  if(!confirm('Отменить регистрацию на турнир?'))return;
  t.players=t.players.filter(x=>x!==id);
  if(t.playerStatus)delete t.playerStatus[id];
  save();
  tournament(tid);
}

function addPlayer(tid){
 if(!requireOrganizer())return;
 const t=db.tournaments.find(x=>x.id===tid);
 const nickname=(document.getElementById('newPlayer').value||'').trim().slice(0,40);
 if(!nickname)return;
 if(t.currentRound>0){alert('После начала турнира добавление игроков отключено.');return}
 const existing=findPlayerByName(nickname);
 const id=existing||nextPlayerId();
 if(t.players.includes(id)){alert('Этот игрок уже есть в турнире.');return}
 if(!db.players[id])db.players[id]={rating:1000,games:0,w:0,d:0,l:0,tournaments:[],history:[1000],nickname,avatar:'pawn'};
 else db.players[id].nickname=nickname;
 if(!t.playerStatus)t.playerStatus={};
 t.players.push(id);t.playerStatus[id]='active';save();tournament(tid);
}
function schedule(){photoIndex=0;let ts=db.tournaments.slice().sort((a,b)=>a.date.localeCompare(b.date));layout(`<section class="hero"><div class="eyebrow">Шахматное сообщество</div><h1>LOVE CHESS</h1><p>LOVE CHESS — шахматное сообщество, которое объединяет людей через игру, турниры и живое общение. Здесь мы проводим регулярные турниры, знакомимся, играем и следим за своим прогрессом.</p><section class="photo-section"><div class="photo-head"><div><div class="eyebrow">LOVE CHESS</div><h2>Как это происходит</h2></div><div class="photo-controls"><button class="photo-btn" onclick="photoPrev()">←</button><button class="photo-btn" onclick="photoNext()">→</button></div></div><div class="photo-gallery"><button class="photo-arrow left" onclick="photoPrev()">‹</button><div class="photo-track" id="photoTrack"><div class="photo-slide"><img src="love-chess-01.webp" alt="LOVE CHESS — фото с турнира" loading="eager"></div><div class="photo-slide"><img src="love-chess-02.webp" alt="LOVE CHESS — фото с турнира" loading="eager"></div><div class="photo-slide"><img src="love-chess-03.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-04.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-05.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-06.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-07.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-08.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-09.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-10.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div><div class="photo-slide"><img src="love-chess-11.webp" alt="LOVE CHESS — фото с турнира" loading="lazy"></div></div><button class="photo-arrow right" onclick="photoNext()">›</button></div><div class="photo-dots" id="photoDots"></div></section></section><section class="section"><div class="row"><h2>Ближайшие турниры</h2><button class="primary" onclick="route('admin')">+ Создать</button></div><div class="grid">${ts.map(t=>`<article class="card tournament"><div><span class="tag">${esc(t.status)}</span><div class="title">${esc(t.name)}</div><div class="meta">${fmt(t.date)} · ${esc(t.time)}</div><div class="meta">${esc(t.place)} · ${esc(t.format)} · ${esc(t.control)}</div></div><div class="row"><span class="meta">${t.rounds} туров · ${t.players.length} игроков</span><div class="settings-actions">${t.status==='Регистрация'?`<button class="primary" onclick="tournament('${t.id}')">Зарегистрироваться</button>`:''}<button class="ghost" onclick="tournament('${t.id}')">Подробнее →</button></div></div></article>`).join('')}</div></section>`,`schedule`)}
function rating(){let rows=Object.entries(db.players).sort((a,b)=>b[1].rating-a[1].rating);layout(`<section class="hero"><div class="eyebrow">LOVE CHESS RATING</div><h1>Рейтинг игроков</h1><p>Рейтинг сохраняется между турнирами и меняется после сыгранных партий.</p></section><section class="section"><table class="table"><thead><tr><th>#</th><th>Игрок</th><th>Рейтинг</th><th>Партии</th><th>П / П / Н</th></tr></thead><tbody>${rows.map(([id,p],i)=>`<tr><td>${i+1}</td><td><button class="ghost" onclick="profile('${id}')">${esc(displayName(id))}</button></td><td><b>${p.rating}</b></td><td>${p.games}</td><td>${p.w} / ${p.l} / ${p.d}</td></tr>`).join('')}</tbody></table></section>`,`rating`)}
const AVATARS={king:'♔',queen:'♕',rook:'♖',bishop:'♗',knight:'♘',pawn:'♙'};
const AVATAR_NAMES={king:'Король',queen:'Ферзь',rook:'Ладья',bishop:'Слон',knight:'Конь',pawn:'Пешка'};
function avatarKey(id){return db.players[id]?.avatar&&AVATARS[db.players[id].avatar]?db.players[id].avatar:'pawn'}
function avatarMarkup(id,cls='profile-avatar'){const key=avatarKey(id);return `<div class="${cls}" aria-label="${AVATAR_NAMES[key]}"><span>${AVATARS[key]}</span></div>`}
function avatarPicker(id){
 const current=avatarKey(id);
 return `<div class="avatar-picker" id="avatarPicker"><div class="avatar-picker-title">Выберите аватар</div><div class="avatar-options">${Object.keys(AVATARS).map(key=>`<button class="avatar-option ${current===key?'selected':''}" onclick="setAvatar('${id}','${key}')" aria-label="${AVATAR_NAMES[key]}"><span>${AVATARS[key]}</span><small>${AVATAR_NAMES[key]}</small></button>`).join('')}</div></div>`;
}
function setAvatar(id,key){
 if(!db.players[id]||!AVATARS[key])return;
 db.players[id].avatar=key;save();profile(id);
}
function clearCurrentPlayer(){localStorage.removeItem('lovechess_current_player');route('profile')}
function profileHome(){
 const current=getCurrentPlayer();
 if(current && db.players[current]) return profile(current);
 layout(`<section class="profile-login-page"><div class="eyebrow">LOVE CHESS</div><h1>Мой профиль</h1><p>Введите свой ник, чтобы открыть профиль, рейтинг, награды и предстоящие турниры.</p>
 <div class="card profile-login-card"><div class="profile-login-avatar">♙</div><div class="field"><label for="profilePlayerId">Ник игрока</label><input id="profilePlayerId" list="profilePlayers" placeholder="Введите свой ник" autocomplete="off" onkeydown="if(event.key==='Enter')openMyProfile()"><datalist id="profilePlayers">${Object.keys(db.players).map(id=>`<option value="${esc(displayName(id))}"></option>`).join('')}</datalist></div><div class="actions"><button class="primary" onclick="openMyProfile()">Открыть мой профиль</button><button class="ghost" onclick="route('rating')">Рейтинг</button></div><p class="muted profile-login-note">В системе используется только ник. Пароль участнику не нужен.</p></div></section>`,`profile`);
}
function openMyProfile(){
 const value=(document.getElementById('profilePlayerId')?.value||'').trim();
 const id=findPlayerByName(value);
 if(!id){alert('Игрок с таким ником не найден. Проверьте ник и попробуйте ещё раз.');return}
 localStorage.setItem('lovechess_current_player',id); profile(id);
}
function awardStats(id){
  const played=[]; const gameWins=[];
  db.tournaments.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{
    let tookPart=false;
    (t.roundData||[]).forEach(r=>{
      if(!r.completed)return;
      (r.pairs||[]).forEach(m=>{
        if(m.bye){if(m.white===id)tookPart=true;return}
        if(m.white!==id&&m.black!==id)return;
        tookPart=true;
        if(m.result==='1-0')gameWins.push(m.white===id);
        else if(m.result==='0-1')gameWins.push(m.black===id);
        else if(m.result==='0.5-0.5')gameWins.push(false);
      });
    });
    if(tookPart&&t.status==='Завершён')played.push(t);
  });
  let firstPlaces=0,podiums=0;
  played.forEach(t=>{const rows=getStandings(t),idx=rows.findIndex(x=>x.id===id);if(idx===0)firstPlaces++;if(idx>=0&&idx<3)podiums++});
  let maxWinStreak=0,current=0;
  gameWins.forEach(w=>{if(w){current++;maxWinStreak=Math.max(maxWinStreak,current)}else current=0});
  const p=player(id);
  return {tournaments:played.length,wins:p.w||0,games:p.games||0,rating:p.rating||1000,firstPlaces,podiums,maxWinStreak};
}
function awardCatalog(){return [
  {cat:'Участие',icon:'○',items:[['first-tournament','Первый турнир',1,'tournaments','Сыграть первый турнир'],['10-tournaments','10 турниров',10,'tournaments','Сыграть 10 турниров'],['25-tournaments','25 турниров',25,'tournaments','Сыграть 25 турниров'],['50-tournaments','50 турниров',50,'tournaments','Сыграть 50 турниров']]},
  {cat:'Победы',icon:'✦',items:[['first-win','Первая победа',1,'wins','Одержать первую победу'],['10-wins','10 побед',10,'wins','Одержать 10 побед'],['25-wins','25 побед',25,'wins','Одержать 25 побед'],['50-wins','50 побед',50,'wins','Одержать 50 побед']]},
  {cat:'Места',icon:'♛',items:[['first-place','Победитель',1,'firstPlaces','Занять 1 место в турнире'],['3-podiums','3 пьедестала',3,'podiums','Три раза войти в топ-3'],['5-first-places','5 победных турниров',5,'firstPlaces','Выиграть 5 турниров'],['10-first-places','10 победных турниров',10,'firstPlaces','Выиграть 10 турниров']]},
  {cat:'Рейтинг',icon:'↗',items:[['1200-rating','Рейтинг 1200',1200,'rating','Достичь рейтинга 1200'],['1400-rating','Рейтинг 1400',1400,'rating','Достичь рейтинга 1400'],['1600-rating','Рейтинг 1600',1600,'rating','Достичь рейтинга 1600'],['1800-rating','Рейтинг 1800',1800,'rating','Достичь рейтинга 1800'],['2000-rating','Рейтинг 2000',2000,'rating','Достичь рейтинга 2000']]},
  {cat:'Серии',icon:'≡',items:[['3-win-streak','Серия 3',3,'maxWinStreak','Выиграть 3 партии подряд'],['5-win-streak','Серия 5',5,'maxWinStreak','Выиграть 5 партий подряд'],['10-win-streak','Серия 10',10,'maxWinStreak','Выиграть 10 партий подряд'],['15-win-streak','Серия 15',15,'maxWinStreak','Выиграть 15 партий подряд']]},
  {cat:'Количество партий',icon:'♟',items:[['10-games','10 партий',10,'games','Сыграть 10 партий'],['50-games','50 партий',50,'games','Сыграть 50 партий'],['100-games','100 партий',100,'games','Сыграть 100 партий'],['250-games','250 партий',250,'games','Сыграть 250 партий'],['500-games','500 партий',500,'games','Сыграть 500 партий']]}
]}
function awardsSection(id){
  const st=awardStats(id), groups=awardCatalog(), total=groups.reduce((n,g)=>n+g.items.length,0), unlockedCount=groups.reduce((n,g)=>n+g.items.filter(x=>(st[x[3]]||0)>=x[2]).length,0);
  return `<section class="section awards-section"><div class="row"><div><div class="eyebrow">LOVE CHESS</div><h2>Награды</h2><p class="muted">Достижения открываются автоматически по мере игры.</p></div><span class="tag">${unlockedCount} / ${total}</span></div>${groups.map(g=>`<div class="award-group"><h3><span class="award-group-icon">${g.icon}</span>${g.cat}</h3><div class="awards-grid">${g.items.map(x=>{const [key,title,target,metric,desc]=x;const value=st[metric]||0,unlocked=value>=target,progress=Math.min(100,Math.round(value/target*100));return `<div class="award-card ${unlocked?'unlocked':'locked'}"><div class="award-icon">${unlocked?'✓':'○'}</div><div class="award-body"><strong>${esc(title)}</strong><div class="muted">${esc(desc)}</div>${unlocked?'<div class="award-complete">Получено</div>':`<div class="award-progress"><div class="award-progress-bar"><span style="width:${progress}%"></span></div><small>${Math.min(value,target)} / ${target}</small></div>`}</div></div>`}).join('')}</div></div>`).join('')}</section>`;
}
function profile(id){
 id=id||getCurrentPlayer(); if(!id||!db.players[id]){return profileHome();}
 const p=player(id); p.tournaments=p.tournaments||[];
 const nickname=displayName(id);
 const wins=p.w||0,draws=p.d||0,losses=p.l||0,total=wins+draws+losses;
 const hist=p.history&&p.history.length?p.history:[p.rating];
 const min=Math.min(...hist),max=Math.max(...hist);
 const pad=Math.max(20,Math.round((max-min)*.15)||20),lo=Math.max(0,min-pad),hi=max+pad;
 const points=hist.map((v,i)=>{const x=20+(i/(Math.max(1,hist.length-1)))*460;const y=180-((v-lo)/(hi-lo||1))*140;return `${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
 const circles=hist.map((v,i)=>{const x=20+(i/(Math.max(1,hist.length-1)))*460;const y=180-((v-lo)/(hi-lo||1))*140;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="chart-point"><title>${v}</title></circle>`}).join('');
 const today=new Date(); today.setHours(0,0,0,0);
 const upcoming=db.tournaments.filter(t=>t.players.includes(id)&&t.currentRound===0&&t.status==='Регистрация'&&new Date(t.date+'T12:00:00')>=today).sort((a,b)=>a.date.localeCompare(b.date));
 const currentTournament=db.tournaments.filter(t=>t.players.includes(id)&&t.status==='Идёт').sort((a,b)=>a.date.localeCompare(b.date))[0];
 const emptyUpcoming=!currentTournament&&!upcoming.length?'<div class="card empty-profile"><strong>Нет предстоящих турниров</strong><p class="muted">Зарегистрируйтесь на ближайший турнир в разделе «Расписание».</p><button class="ghost" onclick="route(\'schedule\')">Открыть расписание →</button></div>':'';
 const upcomingHtml=`<section class="section"><div class="row"><div><div class="eyebrow">Мои турниры</div><h2>Предстоящие</h2></div><span class="tag">${upcoming.length+(currentTournament?1:0)}</span></div>${currentTournament?`<button class="profile-tournament-row active" onclick="tournament('${currentTournament.id}')"><div><strong>${esc(currentTournament.name)}</strong><span>Идёт · ${fmt(currentTournament.date)} · ${esc(currentTournament.time)}</span></div><b>Открыть →</b></button>`:''}${upcoming.map(t=>`<button class="profile-tournament-row" onclick="tournament('${t.id}')"><div><strong>${esc(t.name)}</strong><span>${fmt(t.date)} · ${esc(t.time)} · ${esc(t.place)}</span></div><b>Открыть →</b></button>`).join('')}${emptyUpcoming}</section>`;
 layout(`<section class="profile-hero profile-hero-new"><div class="profile-main"><div class="profile-avatar-wrap">${avatarMarkup(id)}<button class="avatar-edit" onclick="document.getElementById('avatarPicker').classList.toggle('open')">Изменить</button></div><div><div class="eyebrow">Мой профиль</div><div class="profile-nick">${esc(nickname)}</div><div class="profile-rating">${p.rating}</div><div class="muted">LOVE CHESS Rating</div></div></div><div class="profile-actions"><button class="ghost" onclick="route('rating')">← Рейтинг</button><button class="ghost" onclick="clearCurrentPlayer()">Сменить игрока</button>${isOrganizer()?`<button class="ghost" onclick="editNickname('${id}')">Сменить ник</button><button class="danger danger-outline" onclick="deletePlayer('${id}')">Удалить профиль игрока</button>`:``}</div></section>
 <div class="profile-avatar-picker-wrap">${avatarPicker(id)}</div>
 <section class="section"><div class="profile-stats profile-stats-5"><div class="stat-card"><div class="muted">Турниры</div><strong>${p.tournaments.length}</strong></div><div class="stat-card"><div class="muted">Партии</div><strong>${p.games||0}</strong></div><div class="stat-card"><div class="muted">Победы</div><strong>${wins}</strong></div><div class="stat-card"><div class="muted">Ничьи</div><strong>${draws}</strong></div><div class="stat-card"><div class="muted">Поражения</div><strong>${losses}</strong></div></div></section>
 ${upcomingHtml}
 <section class="section"><div class="card chart-card"><div class="row"><div><h2>Рост рейтинга</h2><p class="muted">Изменение LOVE CHESS Rating по партиям.</p></div><span class="tag">${hist[0]} → ${p.rating}</span></div><svg class="rating-chart" viewBox="0 0 500 210" role="img" aria-label="График изменения рейтинга"><line x1="20" y1="180" x2="480" y2="180" class="chart-axis"/><line x1="20" y1="40" x2="20" y2="180" class="chart-axis"/><polyline points="${points}" class="chart-line"/>${circles}<text x="25" y="34" class="chart-label">${hi}</text><text x="25" y="198" class="chart-label">${lo}</text></svg></div></section>
 ${awardsSection(id)}
 <section class="section"><div class="card"><h2>Завершённые турниры</h2>${p.tournaments.length?p.tournaments.slice().reverse().map(t=>`<div class="history-row"><div><b>${esc(t.name)}</b><div class="muted">${t.date?fmt(t.date):''}</div></div><span class="tag">Участник</span></div>`).join(''):'<p class="muted">Турниров пока нет.</p>'}</div></section>`,`profile`);
}
function editNickname(id){
  if(!requireOrganizer())return;
  const p=db.players[id];
  if(!p)return;
  const current=displayName(id);
  const value=prompt('Новый ник игрока',current);
  if(value===null)return;
  const nickname=value.trim().slice(0,40);
  if(!nickname){alert('Ник не может быть пустым.');return;}
  p.nickname=nickname;
  save();
  const t=db.tournaments.find(x=>x.players.includes(id));
  if(t && isOrganizer()) tournamentSettings(t.id); else if(isOrganizer()) profile(id); else rating();
}
function deletePlayer(id){
  if(!requireOrganizer())return;
  if(!db.players[id])return;
  const usedIn=db.tournaments.filter(t=>t.players.includes(id));
  if(usedIn.length){
    alert('Участника нельзя удалить полностью, пока он числится хотя бы в одном турнире. Сначала удалите его из турниров.');
    return;
  }
  const nickname=displayName(id);
  if(!confirm('Удалить профиль игрока '+nickname+'?\nРейтинг и статистика этого участника будут удалены из системы.'))return;
  delete db.players[id];
  save();
  route('rating');
}
function isOrganizer(){return sessionStorage.getItem('lovechess_organizer')==='1'}
function requireOrganizer(){if(isOrganizer())return true; route('organizer'); return false}
function organizerLogin(){
  if(isOrganizer())return admin();
  layout(`<section class="hero"><div class="eyebrow">LOVE CHESS</div><h1>Вход организатора</h1><p>Раздел для создания и проведения турниров.</p></section>
  <section class="section"><div class="card form" style="max-width:520px">
    <div class="field"><label>Пароль организатора</label><input id="organizerPassword" type="password" placeholder="Введите пароль" autocomplete="current-password"></div>
    <div class="actions"><button class="primary" onclick="loginOrganizer()">Войти</button><button class="ghost" onclick="route('schedule')">Отмена</button></div>
    <p class="muted" style="margin-top:14px">Пароль нужен только для организатора. Игрокам пароль не требуется.</p>
  </div></section>`,'organizer')
}
function loginOrganizer(){
  const p=(document.getElementById('organizerPassword')?.value||'');
  if(p!=='LOVECHESS-ADMIN'){alert('Неверный пароль.');return}
  sessionStorage.setItem('lovechess_organizer','1');
  route('admin');
}
function logoutOrganizer(){sessionStorage.removeItem('lovechess_organizer');route('schedule')}
function admin(){
  if(!requireOrganizer())return;
  layout(`<section class="hero"><div class="eyebrow">Организатор</div><h1>Управление LOVE CHESS</h1><p>Создание и проведение турниров, участники и результаты.</p>
  <div class="hero-actions"><button class="primary" onclick="showCreateTournament()">+ Создать турнир</button><button class="ghost" onclick="logoutOrganizer()">Выйти</button></div></section>
  <section class="section"><div class="row"><h2>Турниры</h2></div><div class="grid">${db.tournaments.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<article class="card tournament"><div><span class="tag">${esc(t.status)}</span><div class="title">${esc(t.name)}</div><div class="meta">${fmt(t.date)} · ${esc(t.time)}</div><div class="meta">${esc(t.place)} · ${esc(t.format)} · ${esc(t.control)}</div></div><div class="row"><span class="meta">${t.rounds} туров · ${t.players.length} игроков</span><button class="ghost" onclick="tournament('${t.id}')">Открыть →</button>${isOrganizer()?`<button class="danger danger-outline" onclick="deleteTournament('${t.id}')">Удалить</button>`:''}</div></article>`).join('')}</div></section>`,'admin');
}
function showCreateTournament(){
  if(!requireOrganizer())return;
  layout(`<section class="hero"><div class="eyebrow">Организатор</div><h1>Создать турнир</h1><p>Создайте турнир, добавьте игроков и проведите его по швейцарской системе.</p></section><section class="section"><form class="card form" onsubmit="createTournament(event)"><div class="field"><label>Название</label><input id="name" required placeholder="LOVE CHESS BLITZ"></div><div class="field"><label>Дата</label><input id="date" type="date" required></div><div class="field"><label>Время</label><input id="time" type="time" value="18:00" required></div><div class="field"><label>Место</label><input id="place" placeholder="GASTROKORT"></div><div class="grid"><div class="field"><label>Формат</label><select id="format"><option>Blitz</option><option>Rapid</option></select></div><div class="field"><label>Контроль</label><input id="control" value="5+3"></div><div class="field"><label>Туров</label><input id="rounds" type="number" value="9" min="1"></div></div><div class="actions"><button class="primary">Создать турнир</button><button type="button" class="ghost" onclick="route('admin')">Отмена</button></div></form></section>`,'admin');
}
function createTournament(e){if(!requireOrganizer())return;e.preventDefault();const t={id:'t'+Date.now(),name:document.getElementById('name').value,date:document.getElementById('date').value,time:document.getElementById('time').value,place:document.getElementById('place').value||'—',format:document.getElementById('format').value,control:document.getElementById('control').value,rounds:+document.getElementById('rounds').value,fee:0,status:'Регистрация',players:[],playerStatus:{},currentRound:0,roundData:[]};db.tournaments.push(t);save();tournament(t.id)}
let photoIndex=0;let photoAutoTimer=null;function renderPhotos(){const track=document.getElementById('photoTrack'),dots=document.getElementById('photoDots');if(!track||!dots)return;const slides=track.children;if(!slides.length)return;photoIndex=(photoIndex+slides.length)%slides.length;track.style.transform=`translateX(-${photoIndex*100}%)`;dots.innerHTML=[...slides].map((_,i)=>`<button class="dot ${i===photoIndex?'active':''}" onclick="photoGo(${i})" aria-label="Фото ${i+1}"></button>`).join('')}function stopPhotoAuto(){if(photoAutoTimer){clearInterval(photoAutoTimer);photoAutoTimer=null}}function startPhotoAuto(){stopPhotoAuto();const track=document.getElementById('photoTrack');if(!track||track.children.length<2)return;photoAutoTimer=setInterval(()=>{if(document.hidden)return;photoNext()},5000)}function photoGo(i){photoIndex=i;renderPhotos();startPhotoAuto()}function photoNext(){photoIndex++;renderPhotos()}function photoPrev(){photoIndex--;renderPhotos();startPhotoAuto()}

function deleteTournament(id){
  if(!isOrganizer()) return;
  const t=db.tournaments.find(x=>x.id===id);
  if(!t) return;
  const label=(t.name||'Турнир')+' — '+(t.date||'');
  const message=t.status==='Идёт'
    ? 'Турнир сейчас идёт. Удалить его полностью? Это действие нельзя отменить.'
    : 'Удалить турнир «'+label+'»? Это действие нельзя отменить.';
  if(!confirm(message)) return;
  db.tournaments=db.tournaments.filter(x=>x.id!==id);
  save();
  route('admin');
  alert('Турнир удалён.');
}


function tournamentDeleteButton(id){
  return isOrganizer()
    ? '<button class="btn danger" onclick="event.stopPropagation();deleteTournament(\''+id+'\')">Удалить турнир</button>'
    : '';
}


function route(r){
  if(typeof r !== 'string') r='schedule';
  if(r==='organizer')return organizerLogin();
  if(r==='profile')return profileHome();
  if(r==='clock')return chessClock();
  if(r==='schedule')return schedule();
  if(r==='rating')return rating();
  if(r==='admin')return admin();
  const tm=r.match(/^tournament\/(.+)$/);
  if(tm)return tournament(tm[1]);
  return schedule();
}


let clockState={left:300000,right:300000,inc:3000,active:null,running:false,lastTick:0,interval:null};
function clockFmt(ms){ms=Math.max(0,Math.ceil(ms/1000));const m=Math.floor(ms/60),s=ms%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function clockRender(){
 const l=document.getElementById('clockLeft'),r=document.getElementById('clockRight'),st=document.getElementById('clockStatus');
 if(!l||!r)return;
 l.textContent=clockFmt(clockState.left);r.textContent=clockFmt(clockState.right);
 l.classList.toggle('clock-active',clockState.active==='left');r.classList.toggle('clock-active',clockState.active==='right');
 l.classList.toggle('clock-zero',clockState.left<=0);r.classList.toggle('clock-zero',clockState.right<=0);
 if(st)st.textContent=clockState.running?(clockState.active==='left'?'Ход белых':'Ход чёрных'):'Пауза';
}
function clockTick(){if(!clockState.running||!clockState.active)return;const now=Date.now(),delta=Math.min(now-clockState.lastTick,1000);clockState.lastTick=now;clockState[clockState.active]-=delta;if(clockState[clockState.active]<=0){clockState[clockState.active]=0;clockState.running=false;clockState.active=null}clockRender()}
function clockStart(){if(clockState.left<=0||clockState.right<=0)return;if(!clockState.active)clockState.active='left';clockState.running=!clockState.running;clockState.lastTick=Date.now();clockRender()}
function clockPress(side){if(clockState[side]<=0)return;if(clockState.running&&clockState.active===side){clockState[side]+=clockState.inc;clockState.active=side==='left'?'right':'left';clockState.lastTick=Date.now();clockRender();return}if(!clockState.running){clockState.active=side==='left'?'right':'left';clockState.lastTick=Date.now();clockState.running=true;clockRender()}}
function clockReset(){clockState.running=false;clockState.active=null;clockState.left=clockState.base;clockState.right=clockState.base;clockRender()}
function clockPreset(min,inc){clockState.base=min*60000;clockState.inc=inc*1000;clockReset();const p=document.getElementById('clockPreset');if(p)p.value=min+'+'+inc}
function clockCustom(){const m=Math.max(1,Math.min(180,parseInt(document.getElementById('clockMin').value,10)||5));const inc=Math.max(0,Math.min(60,parseInt(document.getElementById('clockInc').value,10)||0));clockPreset(m,inc)}
function clockSwap(){const a=clockState.left;clockState.left=clockState.right;clockState.right=a;const s=clockState.active;if(s)clockState.active=s==='left'?'right':'left';clockRender()}
function clockExitFullscreen(){
 document.body.classList.remove('clock-fullscreen-active');
 document.documentElement.classList.remove('clock-document-fullscreen');
 if(document.fullscreenElement && document.exitFullscreen){document.exitFullscreen().catch(()=>{});}
}
function clockEnterFullscreen(){
 document.body.classList.add('clock-fullscreen-active');
 document.documentElement.classList.add('clock-document-fullscreen');
 // Native fullscreen is an extra layer on desktop/Android. CSS fullscreen remains the fallback.
 if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen().catch(()=>{});}
}
function installClockFullscreenStyles(){
 if(document.getElementById('clockFullscreenStyles'))return;
 const style=document.createElement('style');style.id='clockFullscreenStyles';style.textContent=`
html.clock-document-fullscreen,html.clock-document-fullscreen body{width:100%;height:100%;overflow:hidden}
body.clock-fullscreen-active{overflow:hidden!important;background:#000!important}
body.clock-fullscreen-active>.nav{display:none!important}
body.clock-fullscreen-active>main.shell{position:fixed!important;inset:0!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;z-index:9999!important;background:#000!important}
body.clock-fullscreen-active .clock-page-hero{display:none!important}
body.clock-fullscreen-active .clock-page-section{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;margin:0!important;padding:0!important;z-index:10000!important;background:#000!important}
body.clock-fullscreen-active .clock-wrap{position:fixed!important;inset:0!important;width:100%!important;max-width:none!important;height:100dvh!important;min-height:100dvh!important;margin:0!important;padding:0!important;background:#000!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
body.clock-fullscreen-active .clock-toolbar{display:none!important}
body.clock-fullscreen-active .clock-board{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:1fr 1fr!important;gap:0!important;background:#000!important}
body.clock-fullscreen-active .clock-side{min-height:0!important;height:100%!important;width:100%!important;border:0!important;border-radius:0!important;border-bottom:1px solid #252525!important;background:#0b0b0b!important;padding:0!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#fff!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;user-select:none!important}
body.clock-fullscreen-active .clock-side:first-child strong{transform:rotate(180deg)}
body.clock-fullscreen-active .clock-side.clock-active{background:#171717!important}
body.clock-fullscreen-active .clock-side.clock-zero{background:#080808!important;color:#555!important}
body.clock-fullscreen-active .clock-side strong{font-size:clamp(72px,22vw,260px)!important;line-height:.9!important;font-weight:700!important;letter-spacing:-.055em!important;font-variant-numeric:tabular-nums!important}
body.clock-fullscreen-active .clock-actions{position:fixed!important;left:50%!important;bottom:max(10px,env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:10002!important;margin:0!important;padding:6px!important;border:1px solid #292929!important;border-radius:14px!important;background:rgba(12,12,12,.86)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;display:flex!important;gap:6px!important;flex-wrap:nowrap!important}
body.clock-fullscreen-active .clock-actions button{min-height:34px!important;padding:7px 10px!important;font-size:12px!important;border-radius:9px!important;white-space:nowrap!important}
body.clock-fullscreen-active .clock-home{font-size:18px!important;padding:5px 11px!important}
body.clock-fullscreen-active .clock-status{position:fixed!important;left:50%!important;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 58px)!important;transform:translateX(-50%)!important;z-index:10002!important;margin:0!important;min-height:0!important;padding:4px 9px!important;border-radius:8px!important;background:rgba(0,0,0,.55)!important;color:#777!important;font-size:11px!important;pointer-events:none!important}
@media(max-width:600px){body.clock-fullscreen-active .clock-actions{bottom:max(6px,env(safe-area-inset-bottom))!important}body.clock-fullscreen-active .clock-actions button{min-height:32px!important;padding:6px 8px!important;font-size:11px!important}body.clock-fullscreen-active .clock-side strong{font-size:clamp(62px,23vw,150px)!important}body.clock-fullscreen-active .clock-status{bottom:calc(max(6px,env(safe-area-inset-bottom)) + 52px)!important}}
`;
 document.head.appendChild(style);
}
function chessClock(){
 installClockFullscreenStyles();
 if(clockState.interval)clearInterval(clockState.interval);
 if(!clockState.base)clockState.base=300000;
 clockExitFullscreen();
 layout(`<section class="hero clock-page-hero"><div class="eyebrow">LOVE CHESS</div><h1>Шахматные часы</h1><p>Два цифровых таймера с добавлением времени после хода.</p></section>
 <section class="section clock-page-section"><div class="clock-wrap">
   <div class="clock-toolbar"><div class="clock-presets"><button class="ghost" onclick="clockPreset(3,2)">3+2</button><button class="ghost" onclick="clockPreset(5,3)">5+3</button><button class="ghost" onclick="clockPreset(10,0)">10+0</button><button class="ghost" onclick="clockPreset(15,10)">15+10</button></div><div class="clock-custom"><input id="clockMin" type="number" min="1" max="180" value="5" aria-label="Минуты"><span>+</span><input id="clockInc" type="number" min="0" max="60" value="3" aria-label="Добавление секунд"><span>сек</span><button class="primary" onclick="clockCustom()">Установить</button></div></div>
   <div class="clock-board"><button class="clock-side" onclick="clockPress('left')" aria-label="Верхние часы"><strong id="clockLeft">05:00</strong></button><button class="clock-side" onclick="clockPress('right')" aria-label="Нижние часы"><strong id="clockRight">05:00</strong></button></div>
   <div class="clock-actions"><button class="primary" onclick="clockStart()">Старт / Пауза</button><button class="ghost" onclick="clockReset()">Сбросить</button><button class="ghost" onclick="clockSwap()">Поменять местами</button><button class="ghost clock-home" onclick="clockExitFullscreen();route('schedule')" aria-label="На главную">⌂</button></div><div id="clockStatus" class="clock-status" aria-live="polite">Пауза</div>
 </div></section>`,'clock');
 clockRender();
 clockEnterFullscreen();
 clockState.interval=setInterval(clockTick,100);
}
document.addEventListener('fullscreenchange',()=>{
 if(!document.fullscreenElement && document.body.classList.contains('clock-fullscreen-active')){
   document.body.classList.add('clock-fullscreen-active');
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape' && document.body.classList.contains('clock-fullscreen-active')){clockExitFullscreen();route('schedule');}
});
window.addEventListener('hashchange',()=>{ const r=location.hash.replace(/^#/, '')||'schedule'; route(r); });
schedule();
