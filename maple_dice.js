const TOTAL=40,FACES=['1','2','3','4','5','6'],COLS=11,ROWS=11;
const DICE_DOTS={1:[[50,50]],2:[[28,28],[72,72]],3:[[28,28],[50,50],[72,72]],4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],6:[[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]]};
function diceSvg(v,size=26){const dots=DICE_DOTS[v].map(([x,y])=>`<circle cx="${x}%" cy="${y}%" r="9%" fill="currentColor"/>`).join('');return`<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="display:block">${dots}</svg>`;}
let coinVals=[0,500,100,600,400,400,300,400,300,400,400,100,600,100,400,100,300,300,400,100,150,400,100,300,300,300,100,300,400,100,600,0,600,600,600,400,600,400,100,300,300];
let specialCells=[{cellNum:16,type:'move',moveVal:-3},{cellNum:23,type:'move',moveVal:3},{cellNum:31,type:'mystery',moveVal:0},{cellNum:33,type:'move',moveVal:-2}];
const PATH_POS=[null];
for(let c=10;c>=0;c--)PATH_POS.push([10,c]);
for(let r=9;r>=1;r--)PATH_POS.push([r,0]);
for(let c=0;c<=10;c++)PATH_POS.push([0,c]);
for(let r=1;r<=9;r++)PATH_POS.push([r,10]);
const CORNERS=new Set([1,11,21,31]);
let currentPos=1,chosenDice=[6,5,4],highlightedPath=[];

function getSpecial(n){return specialCells.find(s=>s.cellNum===n)||null}
function cellArrow(i){if(i<=11)return'◀';if(i<=20)return'▲';if(i<=31)return'▶';return'▼'}

function renderBoard(){
  const grid=document.getElementById('boardGrid');
  grid.innerHTML='';
  const lookup={};
  for(let i=1;i<=TOTAL;i++){const[r,c]=PATH_POS[i];lookup[`${r},${c}`]=i}
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const div=document.createElement('div');
      const idx=lookup[`${r},${c}`];
      if(idx!==undefined){
        const sp=getSpecial(idx);
        const isCur=idx===currentPos,isOn=highlightedPath.includes(idx),corner=CORNERS.has(idx);
        let cls='bc';
        if(corner)cls+=' corner';
        if(isCur)cls+=' cur';else if(isOn)cls+=' onpath';
        if(sp){if(sp.type==='mystery')cls+=' mystery';else cls+=sp.moveVal>=0?' move-plus':' move-minus';}
        div.className=cls;
        let inner=`<span class="cn">${idx}</span>`;
        if(idx===1)inner+=`<span class="cstart">START</span>`;
        if(sp){
          if(sp.type==='mystery')inner+=`<span class="cv myst">?</span>`;
          else{const s=sp.moveVal>=0?'+':'';inner+=`<span class="cv ${sp.moveVal>=0?'movepos':'moveneg'}">${s}${sp.moveVal}칸</span>`;}
        }else{inner+=`<span class="cv pos">+${coinVals[idx]}</span>`;}
        if(!corner)inner+=`<span style="font-size:5px;color:var(--text3);line-height:1">${cellArrow(idx)}</span>`;
        if(isCur)inner+=`<span class="piece"><svg width="20" height="24" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pg" cx="40%" cy="35%"><stop offset="0%" stop-color="#80ffff"/><stop offset="60%" stop-color="#00b8d4"/><stop offset="100%" stop-color="#005f7f"/></radialGradient></defs><ellipse cx="10" cy="22" rx="5" ry="2.2" fill="rgba(0,220,255,0.25)"/><circle cx="10" cy="10" r="9" fill="url(#pg)" stroke="#00e5ff" stroke-width="2"/><circle cx="10" cy="10" r="4.5" fill="white" opacity="0.95"/><circle cx="8" cy="8" r="1.5" fill="white" opacity="0.6"/></svg></span>`;
        div.innerHTML=inner;
        div.onclick=()=>{currentPos=idx;highlightedPath=[];renderBoard();document.getElementById('posDisplay').textContent=`${idx}번 칸${idx===1?' (START)':''}`};
      }else{
        if(r===5&&c===5){div.className='bc icenter';}
        else div.className='bc inner';
      }
      grid.appendChild(div);
    }
  }
  // 중앙 오버레이 - 그리드 위에 절대위치로 올림
  const ov=document.createElement('div');ov.className='board-center-overlay';
  ov.innerHTML=`<div class="center-gem">💎</div><div class="center-title">진의<br>신비한<br>정원</div>`;
  grid.appendChild(ov);
}


function renderDice(){
  const c=document.getElementById('diceContainer');c.innerHTML='';
  for(let d=0;d<3;d++){
    const row=document.createElement('div');row.className='dr';
    const lbl=document.createElement('div');lbl.className='dlabel';lbl.textContent=`주사위 ${d+1}`;row.appendChild(lbl);
    const opts=document.createElement('div');opts.className='dopts';
    for(let v=1;v<=6;v++){
      const btn=document.createElement('button');btn.className='dbtn'+(chosenDice[d]===v?' sel':'');btn.innerHTML=diceSvg(v);
      btn.title=`${v}`;
      btn.onclick=()=>{chosenDice[d]=v;renderDice()};opts.appendChild(btn);
    }
    row.appendChild(opts);
    // 숫자 직접 입력
    const numIn=document.createElement('input');
    numIn.type='number';numIn.className='dnum';numIn.min=1;numIn.max=6;numIn.value=chosenDice[d];
    numIn.oninput=()=>{
      const v=Math.max(1,Math.min(6,parseInt(numIn.value)||1));
      chosenDice[d]=v;
      // 버튼만 업데이트 (포커스 유지위해 전체 re-render 안함)
      row.querySelectorAll('.dbtn').forEach((b,i)=>b.classList.toggle('sel',i+1===v));
    };
    numIn.onblur=()=>{numIn.value=chosenDice[d]};
    row.appendChild(numIn);
    c.appendChild(row);
  }
}

function renderCellEdit(){
  const grid=document.getElementById('cellEditGrid');grid.innerHTML='';
  for(let i=1;i<=TOTAL;i++){
    const sp=getSpecial(i);
    const div=document.createElement('div');div.className='ced';
    const lbl=document.createElement('span');lbl.className='cel';lbl.textContent=i===1?'START':`${i}번`;div.appendChild(lbl);
    if(sp){
      const badge=document.createElement('span');
      if(sp.type==='mystery'){
        badge.style='display:flex;align-items:center;justify-content:center;font-size:11px;padding:3px 0;border-radius:5px;background:rgba(255,144,64,.1);border:1px solid rgba(255,144,64,.4);color:var(--orange)';
        badge.textContent='?';
      }else{
        badge.style=`display:flex;align-items:center;justify-content:center;font-size:8px;padding:3px 1px;border-radius:5px;background:${sp.moveVal>=0?'rgba(80,216,255,.1)':'rgba(240,96,112,.1)'};border:1px solid ${sp.moveVal>=0?'rgba(80,216,255,.4)':'rgba(240,96,112,.4)'};color:${sp.moveVal>=0?'var(--cyan)':'var(--red)'}`;
        badge.textContent=(sp.moveVal>=0?'+':'')+sp.moveVal+'칸';
      }
      div.appendChild(badge);
    }else{
      const inp=document.createElement('input');inp.type='number';inp.className='cei';inp.value=coinVals[i];
      inp.onchange=()=>{coinVals[i]=parseInt(inp.value)||0;renderBoard();showSave()};
      div.appendChild(inp);
    }
    grid.appendChild(div);
  }
}

function renderSpecialList(){
  const list=document.getElementById('specialList');list.innerHTML='';
  specialCells.forEach((sp,idx)=>{
    const item=document.createElement('div');item.className='special-item';
    const hdr=document.createElement('div');hdr.className='special-item-header';
    const title=document.createElement('span');title.className='special-item-title';title.textContent=`특수 칸 #${idx+1}`;hdr.appendChild(title);
    const badge=document.createElement('span');badge.className='special-badge';
    const updateBadge=()=>{
      if(sp.type==='mystery'){badge.className='special-badge badge-mystery';badge.textContent='? 랜덤';}
      else if(sp.moveVal>=0){badge.className='special-badge badge-move-plus';badge.textContent=`+${sp.moveVal}칸 이동`;}
      else{badge.className='special-badge badge-move-minus';badge.textContent=`${sp.moveVal}칸 이동`;}
    };
    updateBadge();hdr.appendChild(badge);item.appendChild(hdr);

    const row1=document.createElement('div');row1.className='special-row';
    const nl=document.createElement('span');nl.className='special-label';nl.textContent='칸 번호';row1.appendChild(nl);
    const ni=document.createElement('input');ni.type='number';ni.className='special-input';ni.min=1;ni.max=TOTAL;ni.value=sp.cellNum;
    ni.onchange=()=>{sp.cellNum=Math.max(1,Math.min(TOTAL,parseInt(ni.value)||1));ni.value=sp.cellNum;renderBoard();renderCellEdit();showSave()};
    row1.appendChild(ni);

    const tbtns=document.createElement('div');tbtns.className='type-btns';
    const mkType=(label,cls,check,action)=>{
      const b=document.createElement('button');
      b.className='type-btn'+(check()?` ${cls}`:'');b.textContent=label;
      b.onclick=()=>{action();updateBadge();renderSpecialList();renderBoard();renderCellEdit();showSave()};
      tbtns.appendChild(b);
    };
    mkType('+이동','ap',()=>sp.type==='move'&&sp.moveVal>=0,()=>{sp.type='move';if(sp.moveVal<0)sp.moveVal=3});
    mkType('-이동','am',()=>sp.type==='move'&&sp.moveVal<0,()=>{sp.type='move';if(sp.moveVal>=0)sp.moveVal=-3});
    mkType('?','aq',()=>sp.type==='mystery',()=>{sp.type='mystery';sp.moveVal=0});
    row1.appendChild(tbtns);

    const del=document.createElement('button');del.className='del-btn';del.innerHTML='×';
    del.onclick=()=>{specialCells.splice(idx,1);renderSpecialList();renderBoard();renderCellEdit();showSave()};
    row1.appendChild(del);item.appendChild(row1);

    if(sp.type==='move'){
      const row2=document.createElement('div');row2.className='special-row';
      const vl=document.createElement('span');vl.className='special-label';vl.textContent='이동 칸 수';row2.appendChild(vl);
      const vi=document.createElement('input');vi.type='number';vi.className='special-input';vi.value=sp.moveVal;
      vi.onchange=()=>{sp.moveVal=parseInt(vi.value)||0;vi.value=sp.moveVal;updateBadge();renderBoard();renderCellEdit();showSave()};
      row2.appendChild(vi);
      const hint=document.createElement('span');hint.style='font-size:9px;color:var(--text3)';hint.textContent='(+앞 / -뒤)';row2.appendChild(hint);
      item.appendChild(row2);
    }
    list.appendChild(item);
  });
}

function addSpecialCell(){specialCells.push({cellNum:1,type:'move',moveVal:3});renderSpecialList();renderCellEdit()}
function showSave(){const n=document.getElementById('saveNotice');n.classList.add('show');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('show'),1500)}

function switchTab(name){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',['play','settings'][i]===name));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='settings'){renderCellEdit();renderSpecialList()}
}

function permutations(arr){
  if(arr.length<=1)return[[...arr]];
  const res=[];
  for(let i=0;i<arr.length;i++){const rest=[...arr.slice(0,i),...arr.slice(i+1)];for(const p of permutations(rest))res.push([arr[i],...p])}
  return res;
}
function stepForward(pos,steps){return((pos-1+steps)%TOTAL+TOTAL)%TOTAL+1}

function simulate(start,order){
  let pos=start,coins=0;const pathDetails=[];
  for(const d of order){
    const landed=stepForward(pos,d);
    let passBonus=0;
    if(pos!==1){const passed=(landed<pos)||(landed===1);if(passed&&landed!==1)passBonus=500}
    const sp=getSpecial(landed);
    let finalPos=landed,stepCoins=0,teleFrom=null;
    if(sp){
      if(sp.type==='mystery'){stepCoins=0;finalPos=landed;}
      else{
        // 연쇄 특수 칸 처리 (무한루프 방지용 visited)
        teleFrom=landed;
        const visited=new Set([landed]);
        let cur=landed;
        while(true){
          const nsp=getSpecial(cur);
          if(!nsp||nsp.type==='mystery'){stepCoins=(coinVals[cur]||0);break;}
          const next=stepForward(cur,nsp.moveVal);
          if(visited.has(next)){stepCoins=0;break;}
          visited.add(next);
          cur=next;
        }
        finalPos=cur;
      }
    }else{stepCoins=coinVals[landed]||0}
    coins+=stepCoins+passBonus;
    pathDetails.push({from:pos,dice:d,landed,teleFrom,dest:finalPos,coins:stepCoins+passBonus});
    pos=finalPos;
  }
  return{coins,pos,pathDetails};
}

function calculate(){
  const perms=permutations([...chosenDice]);const seen=new Set();const results=[];
  for(const perm of perms){const key=perm.join(',');if(seen.has(key))continue;seen.add(key);results.push({order:perm,...simulate(currentPos,perm)})}
  results.sort((a,b)=>b.coins-a.coins);
  highlightedPath=results[0].pathDetails.map(d=>d.dest);
  // 말을 최적 경로 최종 위치로 애니메이션 이동
  const steps=results[0].pathDetails;
  let delay=0;
  steps.forEach((step,i)=>{
    setTimeout(()=>{
      currentPos=step.dest;
      renderBoard();
      // 말에 moving 클래스 붙여서 팝 애니메이션
      const piece=document.querySelector('.piece');
      if(piece){piece.classList.add('moving');setTimeout(()=>piece&&piece.classList.remove('moving'),350);}
    },delay);
    delay+=420;
  });
  setTimeout(()=>{renderBoard();displayResults(results);},delay);
}

function displayResults(results){
  const sec=document.getElementById('resultsSection');sec.classList.add('visible','pop');setTimeout(()=>sec.classList.remove('pop'),400);
  const best=results[0];
  document.getElementById('bestCoin').textContent=(best.coins>=0?'+':'')+best.coins.toLocaleString()+' 코인';
  document.getElementById('bestOrder').innerHTML=best.order.map((d,j)=>`<span style="display:inline-flex;align-items:center;vertical-align:middle;color:var(--gold)">${diceSvg(d,16)}</span>${j<best.order.length-1?'<span style="font-size:10px;color:var(--text3);margin:0 1px">→</span>':''}`).join('');
  document.getElementById('bestPos').textContent=best.pos+'번 칸';
  document.getElementById('totalCases').textContent=results.length+'가지';
  const list=document.getElementById('resultList');list.innerHTML='';
  results.forEach((r,i)=>{
    const item=document.createElement('div');item.className='ri';
    const rc=['r1','r2','r3'][i]||'rn';
    const pathStr=r.pathDetails.map(d=>{
      if(d.teleFrom!==null){const sp=getSpecial(d.teleFrom);const s=sp.moveVal>=0?'+':'';return`${d.teleFrom}번(${s}${sp.moveVal}칸→${d.dest}번 +${coinVals[d.dest]||0})`}
      const sp=getSpecial(d.dest);if(sp&&sp.type==='mystery')return`${d.dest}번(?)`;
      return`${d.dest}번(+${coinVals[d.dest]||0})`;
    }).join(' → ');
    item.innerHTML=`<div class="rb ${rc}">${i+1}</div><div class="rbody"><div class="rorder">${r.order.map((d,j)=>`<span style="display:inline-flex;align-items:center;vertical-align:middle;color:var(--gold)">${diceSvg(d,16)}</span>${j<r.order.length-1?'<span class="rarr">▶</span>':''}`).join('')}<span style="font-size:9px;color:var(--text3);margin-left:3px">(${r.order.join('-')})</span></div><div class="rpath">${pathStr}</div></div><div class="rcoin ${r.coins<0?'neg':''}">${r.coins>=0?'+':''}${r.coins.toLocaleString()}</div>`;
    list.appendChild(item);
  });
  sec.scrollIntoView({behavior:'smooth',block:'start'});
}

renderBoard();renderDice();