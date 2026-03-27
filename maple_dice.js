const TOTAL=40,COLS=11,ROWS=11;
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
let currentPos=1;
let passedStart=false;
let diceCount=3;
let chosenDice=[6,5,4];
let highlightedPath=[];
let specialDiceEffects=[null,null,null];

// ── 편집 모드 ──────────────────────────────────────────
let editMode=false;
let selectedCells=new Set();

const SPECIAL_EFFECTS=[
  {id:'x2',label:'×2',desc:'이동칸 ×2',color:'#ffd84a'},
  {id:'x3',label:'×3',desc:'이동칸 ×3',color:'#ff9f1c'},
  {id:'fert',label:'🌿×2',desc:'코인 ×2 (성장비료)',color:'#39ff8a'},
  {id:'m5',label:'-5',desc:'이동칸 -5',color:'#ff4fce'},
  {id:'m10',label:'-10',desc:'이동칸 -10',color:'#ff4060'},
  {id:'xm3',label:'×(-3)',desc:'이동칸 ×(-3)',color:'#b87aff'},
];

function applySpecialToSteps(dice,effectId){
  switch(effectId){
    case 'x2': return dice*2;
    case 'x3': return dice*3;
    case 'fert': return dice;
    case 'm5': return dice-5;
    case 'm10': return dice-10;
    case 'xm3': return dice*-3;
    default: return dice;
  }
}

function getSpecial(n){return specialCells.find(s=>s.cellNum===n)||null}
function cellArrow(i){if(i<=11)return'◀';if(i<=20)return'▲';if(i<=31)return'▶';return'▼'}

// ── 플레이 보드 ──────────────────────────────────────────
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
        const isCur=idx===currentPos,isOn=highlightedPath.includes(idx),corner=CORNERS.has(idx),isSel=editMode&&selectedCells.has(idx);
        let cls='bc';
        if(corner)cls+=' corner';
        if(editMode)cls+=' edit-mode-cell';
        if(isSel)cls+=' edit-selected';
        else if(isCur)cls+=' cur';else if(isOn)cls+=' onpath';
        if(sp){if(sp.type==='mystery')cls+=' mystery';else cls+=sp.moveVal>=0?' move-plus':' move-minus';}
        div.className=cls;
        let inner=`<span class="cn">${idx}</span>`;
        if(idx===1)inner+=`<span class="cstart">START</span>`;
        if(sp){
          if(sp.type==='mystery'){
            inner+=`<span class="cv myst">?</span>`;
            if(coinVals[idx])inner+=`<span style="font-size:5px;color:var(--orange);line-height:1">${coinVals[idx]}</span>`;
          }
          else{const s=sp.moveVal>=0?'+':'';inner+=`<span class="cv ${sp.moveVal>=0?'movepos':'moveneg'}">${s}${sp.moveVal}칸</span>`;}
        }else{inner+=`<span class="cv pos">+${coinVals[idx]}</span>`;}
        if(!corner)inner+=`<span style="font-size:5px;color:var(--text3);line-height:1">${cellArrow(idx)}</span>`;
        if(isCur)inner+=`<span class="piece"><svg width="20" height="24" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pg" cx="40%" cy="35%"><stop offset="0%" stop-color="#80ffff"/><stop offset="60%" stop-color="#00b8d4"/><stop offset="100%" stop-color="#005f7f"/></radialGradient></defs><ellipse cx="10" cy="22" rx="5" ry="2.2" fill="rgba(0,220,255,0.25)"/><circle cx="10" cy="10" r="9" fill="url(#pg)" stroke="#00e5ff" stroke-width="2"/><circle cx="10" cy="10" r="4.5" fill="white" opacity="0.95"/><circle cx="8" cy="8" r="1.5" fill="white" opacity="0.6"/></svg></span>`;
        div.innerHTML=inner;
        div.onclick=()=>{
          if(editMode){
            if(selectedCells.has(idx)){selectedCells.delete(idx);}else{selectedCells.add(idx);}
            renderBoard();updateEditPanelSelection();
          }else{
            currentPos=idx;highlightedPath=[];renderBoard();
            document.getElementById('posDisplay').textContent=`${idx}번 칸${idx===1?' (START)':''}`;
          }
        };
        div.oncontextmenu=(e)=>{e.preventDefault();if(!editMode)openCellEditor(idx,div);};
      }else{
        div.className=(r===5&&c===5)?'bc icenter':'bc inner';
      }
      grid.appendChild(div);
    }
  }
  const ov=document.createElement('div');ov.className='board-center-overlay';
  ov.innerHTML=`<div class="center-gem">💎</div><div class="center-title">진의<br>신비한<br>정원</div>`;
  grid.appendChild(ov);
}

// ── 설정탭: 보드판 형태 직접 편집 ────────────────────────
// 팝업 편집기
let editPopup=null;
function closeEditPopup(){if(editPopup){editPopup.remove();editPopup=null;}}

function openCellEditor(idx, anchorEl){
  closeEditPopup();
  const sp=getSpecial(idx);

  const pop=document.createElement('div');
  pop.className='cell-edit-popup';
  editPopup=pop;

  // 현재 타입
  const curType=sp?sp.type:'coin';

  pop.innerHTML=`
    <div class="cep-header">
      <span class="cep-title">${idx}번 칸 설정</span>
      <button class="cep-close" onclick="closeEditPopup()">✕</button>
    </div>
    <div class="cep-types">
      <button class="cep-type ${curType==='coin'?'active':''}" data-type="coin">💰 코인</button>
      <button class="cep-type ${curType==='move'&&sp?.moveVal>=0?'active':''}" data-type="plus">▶ +이동</button>
      <button class="cep-type ${curType==='move'&&sp?.moveVal<0?'active':''}" data-type="minus">◀ -이동</button>
      <button class="cep-type ${curType==='mystery'?'active':''}" data-type="mystery">? 랜덤</button>
    </div>
    <div class="cep-val-wrap" id="cepValWrap"></div>
    <button class="cep-save" onclick="saveCellEdit(${idx})">✓ 저장</button>
  `;
  document.body.appendChild(pop);

  // 타입 버튼
  pop.querySelectorAll('.cep-type').forEach(btn=>{
    btn.onclick=()=>{
      pop.querySelectorAll('.cep-type').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderCepVal(btn.dataset.type, idx);
    };
  });
  renderCepVal(curType==='move'?(sp.moveVal>=0?'plus':'minus'):curType, idx);

  // 위치 계산
  const rect=anchorEl.getBoundingClientRect();
  const scrollY=window.scrollY||window.pageYOffset;
  let top=rect.bottom+scrollY+4;
  let left=rect.left+window.scrollX;
  pop.style.top=top+'px';
  pop.style.left=left+'px';

  // 화면 밖으로 나가면 보정
  requestAnimationFrame(()=>{
    const pr=pop.getBoundingClientRect();
    if(pr.right>window.innerWidth-8) pop.style.left=(window.innerWidth-pr.width-8)+'px';
    if(pr.bottom>window.innerHeight-8) pop.style.top=(rect.top+scrollY-pr.height-4)+'px';
  });
}

function renderCepVal(type, idx){
  const wrap=document.getElementById('cepValWrap');
  if(!wrap)return;
  const sp=getSpecial(idx);
  if(type==='coin'){
    wrap.innerHTML=`<label class="cep-label">코인 값</label><input class="cep-input" id="cepInput" type="number" min="0" step="50" value="${coinVals[idx]||0}">`;
  } else if(type==='plus'){
    const v=sp&&sp.type==='move'&&sp.moveVal>0?sp.moveVal:3;
    wrap.innerHTML=`<label class="cep-label">앞으로 이동 칸 수</label><input class="cep-input" id="cepInput" type="number" min="1" max="20" value="${v}">`;
  } else if(type==='minus'){
    const v=sp&&sp.type==='move'&&sp.moveVal<0?Math.abs(sp.moveVal):3;
    wrap.innerHTML=`<label class="cep-label">뒤로 이동 칸 수</label><input class="cep-input" id="cepInput" type="number" min="1" max="20" value="${v}">`;
  } else {
    const mystCoins=coinVals[idx]||0;
    wrap.innerHTML=`<label class="cep-label">? 칸 코인 (확률 지급액)</label><input class="cep-input" id="cepInput" type="number" min="0" step="50" value="${mystCoins}">`;
  }
}

function saveCellEdit(idx){
  const pop=editPopup;
  if(!pop)return;
  const activeType=pop.querySelector('.cep-type.active')?.dataset.type;
  const inp=document.getElementById('cepInput');
  const val=inp?parseInt(inp.value)||0:0;

  // specialCells에서 제거
  specialCells=specialCells.filter(s=>s.cellNum!==idx);

  if(activeType==='coin'){
    coinVals[idx]=val;
  } else if(activeType==='plus'){
    specialCells.push({cellNum:idx,type:'move',moveVal:Math.abs(val)||3});
    coinVals[idx]=0;
  } else if(activeType==='minus'){
    specialCells.push({cellNum:idx,type:'move',moveVal:-(Math.abs(val)||3)});
    coinVals[idx]=0;
  } else if(activeType==='mystery'){
    specialCells.push({cellNum:idx,type:'mystery',moveVal:0});
    coinVals[idx]=val;
  }

  closeEditPopup();
  renderQuickBoard();
  renderBoard();
  showSave();
}

// 보드판 형태 그대로 렌더링 (설정탭)
function renderQuickBoard(){
  const grid=document.getElementById('quickBoard');
  if(!grid)return;
  grid.innerHTML='';
  const lookup={};
  for(let i=1;i<=TOTAL;i++){const[r,c]=PATH_POS[i];lookup[`${r},${c}`]=i;}

  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const div=document.createElement('div');
      const idx=lookup[`${r},${c}`];
      if(idx!==undefined){
        const sp=getSpecial(idx);
        const corner=CORNERS.has(idx);
        let cls='qbc';
        if(corner)cls+=' corner';
        if(sp){
          if(sp.type==='mystery')cls+=' mystery';
          else cls+=sp.moveVal>=0?' move-plus':' move-minus';
        }
        div.className=cls;

        let label='';
        if(idx===1){label='START';}
        else if(sp&&sp.type==='mystery'){label='?';}
        else if(sp&&sp.type==='move'){label=(sp.moveVal>=0?'+':'')+sp.moveVal+'칸';}
        else{label='+'+coinVals[idx];}

        div.innerHTML=`<span class="qbn">${idx}</span><span class="qbv">${label}</span>`;
        div.title=`${idx}번 칸 클릭해서 수정`;
        div.onclick=(e)=>{e.stopPropagation();openCellEditor(idx,div);};
      } else {
        div.className=(r===5&&c===5)?'qbc qb-center':'qbc qb-inner';
        if(r>=4&&r<=6&&c>=4&&c<=6&&!(r===4&&c===4)&&!(r===4&&c===6)&&!(r===6&&c===4)&&!(r===6&&c===6)){
          div.innerHTML=r===5&&c===5?'💎':'';
        }
      }
      grid.appendChild(div);
    }
  }
}

// 팝업 닫기 (바깥 클릭)
document.addEventListener('click',e=>{
  if(editPopup&&!editPopup.contains(e.target)&&!e.target.closest('.qbc')&&!e.target.closest('.bc'))closeEditPopup();
});

// ── 주사위 렌더 ──────────────────────────────────────────
function renderDice(){
  const c=document.getElementById('diceContainer');
  c.innerHTML='';

  const lapRow=document.createElement('div');
  lapRow.style='display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(120,60,255,.2);';
  lapRow.innerHTML=`<span style="font-family:'Jua',sans-serif;font-size:14px;color:var(--text2);white-space:nowrap;">START 통과</span>`;
  const lapBtnWrap=document.createElement('div');lapBtnWrap.style='display:flex;gap:5px;';
  [{val:false,label:'미통과'},{val:true,label:'통과 ✓'}].forEach(({val,label})=>{
    const btn=document.createElement('button');
    const sel=passedStart===val,isPass=val===true;
    btn.style=`padding:5px 12px;border-radius:5px;border:1px solid ${sel?(isPass?'var(--neon-green)':'rgba(200,160,255,.7)'):(isPass?'rgba(0,200,80,.2)':'rgba(80,40,150,.5)')};background:${sel?(isPass?'rgba(0,180,80,.25)':'rgba(100,60,200,.25)'):'rgba(0,0,0,.3)'};color:${sel?(isPass?'var(--neon-green)':'#fff'):'var(--text3)'};font-family:'Jua',sans-serif;font-size:14px;cursor:pointer;transition:all .13s;box-shadow:${sel&&isPass?'0 0 8px rgba(0,255,100,.35)':sel?'0 0 8px rgba(150,100,255,.4)':''};`;
    btn.textContent=label;
    btn.onclick=()=>{passedStart=val;renderDice();};
    lapBtnWrap.appendChild(btn);
  });
  lapRow.appendChild(lapBtnWrap);
  const lapHint=document.createElement('span');
  lapHint.style=`font-size:12px;font-family:'Jua',sans-serif;${passedStart?'color:var(--neon-green);':'color:var(--text3);'}`;
  lapHint.textContent=passedStart?'★ 통과 보너스 적용됨':'★ 보너스 없음';
  lapRow.appendChild(lapHint);
  c.appendChild(lapRow);

  const countRow=document.createElement('div');
  countRow.style='display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(120,60,255,.2);';
  countRow.innerHTML=`<span style="font-family:'Jua',sans-serif;font-size:14px;color:var(--text2);white-space:nowrap;">주사위 개수</span>`;
  const btnWrap=document.createElement('div');btnWrap.style='display:flex;gap:5px;';
  [1,2,3].forEach(n=>{
    const btn=document.createElement('button');
    const sel=diceCount===n;
    btn.style=`padding:5px 14px;border-radius:5px;border:1px solid ${sel?'var(--neon-cyan)':'rgba(80,40,150,.5)'};background:${sel?'rgba(0,160,220,.25)':'rgba(0,0,0,.3)'};color:${sel?'#fff':'var(--text3)'};font-family:'Jua',sans-serif;font-size:14px;cursor:pointer;transition:all .13s;box-shadow:${sel?'0 0 8px rgba(0,200,255,.4)':''};`;
    btn.textContent=`${n}개`;
    btn.onclick=()=>{diceCount=n;while(chosenDice.length<n)chosenDice.push(1);while(specialDiceEffects.length<n)specialDiceEffects.push(null);renderDice();};
    btnWrap.appendChild(btn);
  });
  countRow.appendChild(btnWrap);
  c.appendChild(countRow);

  for(let d=0;d<diceCount;d++){
    const row=document.createElement('div');row.className='dr';row.style='flex-direction:column;gap:4px;align-items:stretch;';
    const topRow=document.createElement('div');topRow.style='display:flex;align-items:center;gap:4px;';
    const lbl=document.createElement('div');lbl.className='dlabel';lbl.textContent=`주사위 ${d+1}`;topRow.appendChild(lbl);
    const opts=document.createElement('div');opts.className='dopts';
    for(let v=1;v<=6;v++){
      const btn=document.createElement('button');
      btn.className='dbtn'+(chosenDice[d]===v?' sel':'');
      btn.innerHTML=diceSvg(v);btn.title=`${v}`;
      btn.onclick=()=>{chosenDice[d]=v;renderDice()};
      opts.appendChild(btn);
    }
    topRow.appendChild(opts);
    const numIn=document.createElement('input');
    numIn.type='number';numIn.className='dnum';numIn.min=1;numIn.max=6;numIn.value=chosenDice[d];
    numIn.oninput=()=>{const v=Math.max(1,Math.min(6,parseInt(numIn.value)||1));chosenDice[d]=v;topRow.querySelectorAll('.dbtn').forEach((b,i)=>b.classList.toggle('sel',i+1===v));};
    numIn.onblur=()=>{numIn.value=chosenDice[d]};
    topRow.appendChild(numIn);
    row.appendChild(topRow);

    const specRow=document.createElement('div');
    specRow.style='display:flex;align-items:center;gap:3px;flex-wrap:wrap;padding:4px 0 6px 0;border-bottom:1px solid rgba(120,60,255,.15);';
    const specLabel=document.createElement('span');
    specLabel.style='font-size:13px;color:var(--text3);width:52px;flex-shrink:0;font-family:"Jua",sans-serif;';
    specLabel.textContent='특수효과';
    specRow.appendChild(specLabel);

    const noneBtn=document.createElement('button');
    const noneActive=!specialDiceEffects[d];
    noneBtn.style=`padding:2px 6px;border-radius:4px;border:1px solid ${noneActive?'var(--neon-cyan)':'rgba(80,40,150,.4)'};background:${noneActive?'rgba(0,160,220,.2)':'rgba(0,0,0,.3)'};color:${noneActive?'#fff':'var(--text3)'};font-size:12px;cursor:pointer;font-family:"Jua",sans-serif;transition:all .13s;`;
    noneBtn.textContent='없음';
    noneBtn.onclick=()=>{specialDiceEffects[d]=null;renderDice();};
    specRow.appendChild(noneBtn);

    SPECIAL_EFFECTS.forEach(eff=>{
      const effBtn=document.createElement('button');
      const isActive=specialDiceEffects[d]===eff.id;
      effBtn.style=`padding:2px 6px;border-radius:4px;border:1px solid ${isActive?eff.color:'rgba(80,40,150,.4)'};background:${isActive?'rgba(80,40,150,.35)':'rgba(0,0,0,.3)'};color:${isActive?eff.color:'var(--text3)'};font-size:12px;cursor:pointer;font-family:"Jua",sans-serif;transition:all .13s;${isActive?`box-shadow:0 0 6px ${eff.color}44;`:''}`;
      effBtn.textContent=eff.label;effBtn.title=eff.desc;
      effBtn.onclick=()=>{specialDiceEffects[d]=eff.id;renderDice();};
      specRow.appendChild(effBtn);
    });

    if(specialDiceEffects[d]){
      const eff=SPECIAL_EFFECTS.find(e=>e.id===specialDiceEffects[d]);
      const finalSteps=applySpecialToSteps(chosenDice[d],eff.id);
      const tag=document.createElement('span');
      tag.style=`font-size:12px;color:${eff.color};margin-left:2px;font-family:"Jua",sans-serif;`;
      tag.textContent=`→ ${finalSteps}칸${eff.id==='fert'?' (코인×2)':''}`;
      specRow.appendChild(tag);
    }
    row.appendChild(specRow);
    c.appendChild(row);
  }
}

// ── 특수칸 리스트 (설정탭 하단) ──────────────────────────
function renderSpecialList(){
  const list=document.getElementById('specialList');
  if(!list)return;
  list.innerHTML='';
  if(specialCells.length===0){
    list.innerHTML=`<div style="font-size:11px;color:var(--text3);text-align:center;padding:12px">특수 칸이 없습니다. 위 보드판에서 칸을 클릭해 추가하거나 아래 버튼을 이용하세요.</div>`;
    return;
  }
  specialCells.forEach((sp,idx)=>{
    const item=document.createElement('div');item.className='special-item';

    const hdr=document.createElement('div');hdr.className='special-item-header';
    const title=document.createElement('span');title.className='special-item-title';
    title.textContent=`${sp.cellNum}번 칸`;hdr.appendChild(title);
    const badge=document.createElement('span');badge.className='special-badge';
    const updateBadge=()=>{
      if(sp.type==='mystery'){badge.className='special-badge badge-mystery';badge.textContent='? 랜덤';}
      else if(sp.moveVal>=0){badge.className='special-badge badge-move-plus';badge.textContent=`+${sp.moveVal}칸 이동`;}
      else{badge.className='special-badge badge-move-minus';badge.textContent=`${sp.moveVal}칸 이동`;}
    };
    updateBadge();hdr.appendChild(badge);item.appendChild(hdr);

    const row1=document.createElement('div');row1.className='special-row';

    // 칸번호
    const nl=document.createElement('span');nl.className='special-label';nl.textContent='칸 번호';row1.appendChild(nl);
    const ni=document.createElement('input');ni.type='number';ni.className='special-input';ni.min=1;ni.max=TOTAL;ni.value=sp.cellNum;
    ni.onchange=()=>{
      sp.cellNum=Math.max(1,Math.min(TOTAL,parseInt(ni.value)||1));
      ni.value=sp.cellNum;
      title.textContent=`${sp.cellNum}번 칸`;
      renderBoard();renderQuickBoard();showSave();
    };
    row1.appendChild(ni);

    // 타입 버튼
    const tbtns=document.createElement('div');tbtns.className='type-btns';
    const mkType=(label,cls,check,action)=>{
      const b=document.createElement('button');
      b.className='type-btn'+(check()?` ${cls}`:'');
      b.textContent=label;
      b.onclick=()=>{action();updateBadge();renderBoard();renderQuickBoard();renderSpecialList();showSave();};
      tbtns.appendChild(b);
    };
    mkType('+이동','ap',()=>sp.type==='move'&&sp.moveVal>=0,()=>{sp.type='move';if(sp.moveVal<=0)sp.moveVal=3;});
    mkType('-이동','am',()=>sp.type==='move'&&sp.moveVal<0,()=>{sp.type='move';if(sp.moveVal>=0)sp.moveVal=-3;});
    mkType('?','aq',()=>sp.type==='mystery',()=>{sp.type='mystery';sp.moveVal=0;});
    row1.appendChild(tbtns);

    const del=document.createElement('button');del.className='del-btn';del.innerHTML='×';
    del.onclick=()=>{specialCells.splice(idx,1);renderSpecialList();renderBoard();renderQuickBoard();showSave();};
    row1.appendChild(del);item.appendChild(row1);

    if(sp.type==='move'){
      const row2=document.createElement('div');row2.className='special-row';
      const vl=document.createElement('span');vl.className='special-label';vl.textContent='이동 칸 수';row2.appendChild(vl);
      const vi=document.createElement('input');vi.type='number';vi.className='special-input';vi.value=sp.moveVal;
      vi.onchange=()=>{sp.moveVal=parseInt(vi.value)||0;updateBadge();renderBoard();renderQuickBoard();showSave();};
      row2.appendChild(vi);
      const hint=document.createElement('span');hint.style='font-size:9px;color:var(--text3)';hint.textContent='(+앞 / -뒤)';row2.appendChild(hint);
      item.appendChild(row2);
    }
    list.appendChild(item);
  });
}

function addSpecialCell(){
  specialCells.push({cellNum:2,type:'move',moveVal:3});
  renderSpecialList();renderQuickBoard();renderBoard();
}

function showSave(){
  const n=document.getElementById('saveNotice');
  if(!n)return;
  n.classList.add('show');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('show'),1500);
}

function switchTab(name){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',['play','settings'][i]===name));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='settings'){renderQuickBoard();renderSpecialList();}
}

// ── 계산 로직 ─────────────────────────────────────────────
function permutations(arr){
  if(arr.length<=1)return[[...arr]];
  const res=[];
  for(let i=0;i<arr.length;i++){const rest=[...arr.slice(0,i),...arr.slice(i+1)];for(const p of permutations(rest))res.push([arr[i],...p]);}
  return res;
}

function stepForward(pos,steps){return((pos-1+steps)%TOTAL+TOTAL)%TOTAL+1;}

function didPassOrLandStart(from,steps){
  if(steps<=0)return false;
  for(let i=1;i<=steps;i++){if(((from-1+i)%TOTAL)+1===1)return true;}
  return false;
}

function simulate(start,order,effects,alreadyPassedStart){
  let pos=start,coins=0,hasPassedStart=alreadyPassedStart||false;
  const pathDetails=[];
  const firedMoveCells=new Set();

  for(let i=0;i<order.length;i++){
    const rawDice=order[i];
    const effId=effects?effects[i]:null;
    const isFert=effId==='fert';
    const d=applySpecialToSteps(rawDice,effId);
    const landed=stepForward(pos,d);

    let passBonus=0;
    const crossesStart=d>0&&didPassOrLandStart(pos,d);
    if(crossesStart){
      if(hasPassedStart)passBonus=coinVals[1];
      hasPassedStart=true;
    }

    const sp=getSpecial(landed);
    let finalPos=landed,stepCoins=0,teleFrom=null,moveBlocked=false;

    if(sp){
      if(sp.type==='mystery'){
        stepCoins=isFert?(coinVals[landed]||0)*2:(coinVals[landed]||0);finalPos=landed;
      }else{
        if(firedMoveCells.has(landed)){
          stepCoins=isFert?200:100;finalPos=landed;moveBlocked=true;
        }else{
          firedMoveCells.add(landed);
          teleFrom=landed;
          const visited=new Set([landed]);
          let cur=landed;
          while(true){
            const nsp=getSpecial(cur);
            if(!nsp||nsp.type==='mystery'){stepCoins=isFert?(coinVals[cur]||0)*2:(coinVals[cur]||0);break;}
            if(cur!==landed&&firedMoveCells.has(cur)){stepCoins=isFert?200:100;finalPos=cur;moveBlocked=true;break;}
            firedMoveCells.add(cur);
            const next=stepForward(cur,nsp.moveVal);
            if(visited.has(next)){stepCoins=0;break;}
            visited.add(next);cur=next;
          }
          if(!moveBlocked)finalPos=cur;
        }
      }
    }else{
      stepCoins=isFert?(coinVals[landed]||0)*2:(coinVals[landed]||0);
    }

    coins+=stepCoins+passBonus;
    pathDetails.push({from:pos,dice:rawDice,effId,actualSteps:d,landed,teleFrom,dest:finalPos,coins:stepCoins+passBonus,passBonus,moveBlocked,isFert});
    pos=finalPos;
  }
  return{coins,pos,pathDetails};
}

function calculate(){
  const activeDice=chosenDice.slice(0,diceCount);
  const activeEffects=specialDiceEffects.slice(0,diceCount);
  const indices=[...Array(diceCount).keys()];
  const idxPerms=permutations(indices);
  const seen=new Set();
  const results=[];

  for(const perm of idxPerms){
    const orderVals=perm.map(i=>activeDice[i]);
    const orderEffs=perm.map(i=>activeEffects[i]);
    const key=perm.map(i=>`${activeDice[i]}:${activeEffects[i]||''}`).join(',');
    if(seen.has(key))continue;
    seen.add(key);
    results.push({order:orderVals,effects:orderEffs,...simulate(currentPos,orderVals,orderEffs,passedStart)});
  }
  results.sort((a,b)=>b.coins-a.coins);

  highlightedPath=results[0].pathDetails.map(d=>d.dest);
  const steps=results[0].pathDetails;
  let delay=0;
  steps.forEach(step=>{
    setTimeout(()=>{
      currentPos=step.dest;renderBoard();
      const piece=document.querySelector('.piece');
      if(piece){piece.classList.add('moving');setTimeout(()=>piece&&piece.classList.remove('moving'),350);}
    },delay);
    delay+=420;
  });
  setTimeout(()=>{renderBoard();displayResults(results);},delay);
}

function displayResults(results){
  const sec=document.getElementById('resultsSection');
  sec.classList.add('visible','pop');setTimeout(()=>sec.classList.remove('pop'),400);

  const best=results[0];
  document.getElementById('bestCoin').textContent=(best.coins>=0?'+':'')+best.coins.toLocaleString()+' 코인';
  document.getElementById('bestOrder').innerHTML=best.order.map((d,j)=>{
    const eff=best.effects&&best.effects[j]?SPECIAL_EFFECTS.find(e=>e.id===best.effects[j]):null;
    const steps=best.pathDetails[j].actualSteps;
    const effTag=eff?`<span style="font-size:8px;color:${eff.color};border:1px solid ${eff.color}44;border-radius:3px;padding:0 2px;margin-left:1px;">${eff.label}</span>`:'';
    const stepTag=eff?`<span style="font-size:8px;color:var(--text3);">(${steps}칸)</span>`:'';
    return`<span style="display:inline-flex;align-items:center;vertical-align:middle;color:var(--gold)">${diceSvg(d,16)}</span>${effTag}${stepTag}${j<best.order.length-1?'<span style="font-size:10px;color:var(--text3);margin:0 1px">→</span>':''}`;
  }).join('');
  document.getElementById('bestPos').textContent=best.pos+'번 칸';
  document.getElementById('totalCases').textContent=results.length+'가지';

  const list=document.getElementById('resultList');list.innerHTML='';
  results.forEach((r,i)=>{
    const item=document.createElement('div');item.className='ri';
    const rc=['r1','r2','r3'][i]||'rn';
    const pathStr=r.pathDetails.map((d,di)=>{
      const eff=r.effects&&r.effects[di]?SPECIAL_EFFECTS.find(e=>e.id===r.effects[di]):null;
      const effLabel=eff?`[✦${eff.label}→${d.actualSteps}칸]`:'';
      let s='';
      if(d.moveBlocked)s=`${d.dest}번(🔒+${d.isFert?200:100})`;
      else if(d.teleFrom!==null){const sp=getSpecial(d.teleFrom);const sign=sp.moveVal>=0?'+':'';s=`${d.teleFrom}번(${sign}${sp.moveVal}칸)→${d.dest}번(+${d.isFert?(coinVals[d.dest]||0)*2:(coinVals[d.dest]||0)})${d.isFert?'×2':''}`;} 
      else{const sp=getSpecial(d.dest);s=sp&&sp.type==='mystery'?`${d.dest}번(?)`:`${d.dest}번(+${d.isFert?(coinVals[d.dest]||0)*2:(coinVals[d.dest]||0)})${d.isFert?'×2':''}`;}
      if(d.passBonus>0)s+=`[★+${d.passBonus}]`;
      return effLabel+s;
    }).join(' → ');

    item.innerHTML=`
      <div class="rb ${rc}">${i+1}</div>
      <div class="rbody">
        <div class="rorder">
          ${r.order.map((d,j)=>{
            const eff=r.effects&&r.effects[j]?SPECIAL_EFFECTS.find(e=>e.id===r.effects[j]):null;
            const effTag=eff?`<span style="font-size:8px;color:${eff.color};border:1px solid ${eff.color}55;border-radius:3px;padding:0 2px;">${eff.label}</span>`:'';
            return`<span style="display:inline-flex;align-items:center;vertical-align:middle;color:var(--gold)">${diceSvg(d,16)}</span>${effTag}${j<r.order.length-1?'<span class="rarr">▶</span>':''}`;
          }).join('')}
          <span style="font-size:9px;color:var(--text3);margin-left:3px">(${r.order.join('-')})</span>
        </div>
        <div class="rpath">${pathStr}</div>
      </div>
      <div class="rcoin ${r.coins<0?'neg':''}">${r.coins>=0?'+':''}${r.coins.toLocaleString()}</div>`;
    list.appendChild(item);
  });
  sec.scrollIntoView({behavior:'smooth',block:'start'});
}

// ── 편집 모드 핼퍼 ──────────────────────────────────────────
function epSetType(btn){
  const wrap=document.getElementById('epBulkTypes');
  if(wrap)wrap.querySelectorAll('.ep-type-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const type=btn.dataset.type;
  const presets=document.getElementById('epPresets');
  if(presets){
    if(type==='coin'||type==='mystery'){
      presets.style.display='block';
      presets.querySelector('.ep-preset-label').textContent=type==='mystery'?'? 코인 빠른 선택':'코인 빠른 선택';
    }else{
      presets.style.display='none';
    }
  }
}

function setBulkVal(v){
  const inp=document.getElementById('epBulkVal');
  if(inp)inp.value=v;
}

function toggleEditMode(){
  editMode=!editMode;
  selectedCells.clear();
  const btn=document.getElementById('editModeBtn');
  const panel=document.getElementById('editPanel');
  if(editMode){
    btn.classList.add('active');
    btn.innerHTML='<span class="emb-icon">✏️</span><span class="emb-text">편집 종료</span>';
    panel.classList.add('open');
    // 우클릭 팝업 닫기
    closeEditPopup();
  }else{
    btn.classList.remove('active');
    btn.innerHTML='<span class="emb-icon">✏️</span><span class="emb-text">보드 편집</span>';
    panel.classList.remove('open');
    document.getElementById('epSelCount').textContent='0';
    document.getElementById('epSelList').innerHTML='<div class="ep-hint">편집 모드에서 칸을 클릭하여 선택하세요</div>';
  }
  renderBoard();
}

function updateEditPanelSelection(){
  const cnt=selectedCells.size;
  document.getElementById('epSelCount').textContent=cnt;
  const list=document.getElementById('epSelList');
  if(cnt===0){
    list.innerHTML='<div class="ep-hint">편집 모드에서 칸을 클릭하여 선택하세요</div>';
    return;
  }
  const sorted=[...selectedCells].sort((a,b)=>a-b);
  list.innerHTML=sorted.map(idx=>{
    const sp=getSpecial(idx);
    let typeLabel='',typeClass='';
    if(sp&&sp.type==='mystery'){typeLabel='?칸';typeClass='ep-badge-myst';}
    else if(sp&&sp.type==='move'){typeLabel=(sp.moveVal>=0?'+':'')+sp.moveVal+'칸 이동';typeClass=sp.moveVal>=0?'ep-badge-plus':'ep-badge-minus';}
    else{typeLabel='+'+coinVals[idx]+'코인';typeClass='ep-badge-coin';}
    return`<div class="ep-cell-chip" onclick="openSingleCellEdit(${idx})" title="${idx}번 칸 개별 수정"><span class="ep-cell-num">${idx}</span><span class="ep-badge ${typeClass}">${typeLabel}</span><button class="ep-chip-del" onclick="event.stopPropagation();deselectCell(${idx})">×</button></div>`;
  }).join('');
}

function deselectCell(idx){
  selectedCells.delete(idx);
  renderBoard();
  updateEditPanelSelection();
}

function selectAllCells(){
  for(let i=1;i<=TOTAL;i++)selectedCells.add(i);
  renderBoard();
  updateEditPanelSelection();
}

function clearSelection(){
  selectedCells.clear();
  renderBoard();
  updateEditPanelSelection();
}

function applyBulkEdit(){
  if(selectedCells.size===0){alert('먼저 칸을 선택하세요!');return;}
  const type=document.querySelector('.ep-type-btn.active')?.dataset.type||'coin';
  const val=parseInt(document.getElementById('epBulkVal').value)||0;
  selectedCells.forEach(idx=>{
    specialCells=specialCells.filter(s=>s.cellNum!==idx);
    if(type==='coin'){coinVals[idx]=val;}
    else if(type==='plus'){specialCells.push({cellNum:idx,type:'move',moveVal:Math.abs(val)||3});coinVals[idx]=0;}
    else if(type==='minus'){specialCells.push({cellNum:idx,type:'move',moveVal:-(Math.abs(val)||3)});coinVals[idx]=0;}
    else if(type==='mystery'){specialCells.push({cellNum:idx,type:'mystery',moveVal:0});coinVals[idx]=val;}
  });
  renderBoard();
  updateEditPanelSelection();
  showSave();
  // 완료 피드백
  const btn=document.getElementById('epApplyBtn');
  btn.textContent='✓ 적용됨!';btn.style.color='var(--neon-green)';
  setTimeout(()=>{btn.textContent='✦ 일괄 적용';btn.style.color='';},1200);
}

function openSingleCellEdit(idx){
  // 편집 모드에서 개별 칸 수정: 패널 하단 영역에 인라인 폼 표시
  const panel=document.getElementById('epSingleEdit');
  const sp=getSpecial(idx);
  const curType=sp?sp.type:'coin';
  const curTypeMapped=curType==='move'?(sp.moveVal>=0?'plus':'minus'):curType;

  panel.innerHTML=`
    <div class="ep-single-header">
      <span style="font-family:'Jua',sans-serif;font-size:13px;color:var(--accent2);">${idx}번 칸 개별 수정</span>
      <button class="ep-close-single" onclick="document.getElementById('epSingleEdit').innerHTML=''">✕</button>
    </div>
    <div class="ep-type-row" id="epSingleTypes">
      <button class="ep-type-btn${curTypeMapped==='coin'?' active':''}" data-type="coin">💰 코인</button>
      <button class="ep-type-btn${curTypeMapped==='plus'?' active':''}" data-type="plus">▶ +이동</button>
      <button class="ep-type-btn${curTypeMapped==='minus'?' active':''}" data-type="minus">◀ -이동</button>
      <button class="ep-type-btn${curTypeMapped==='mystery'?' active':''}" data-type="mystery">? 랜덤</button>
    </div>
    <div id="epSingleValWrap" class="ep-val-wrap"></div>
    <button class="ep-apply-btn" id="epSingleSave" onclick="saveSingleFromPanel(${idx})">✓ 저장</button>
  `;
  panel.querySelectorAll('.ep-type-btn').forEach(b=>{
    b.onclick=()=>{
      panel.querySelectorAll('.ep-type-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderEpSingleVal(b.dataset.type, idx);
    };
  });
  renderEpSingleVal(curTypeMapped, idx);
}

function renderEpSingleVal(type, idx){
  const wrap=document.getElementById('epSingleValWrap');
  if(!wrap)return;
  const sp=getSpecial(idx);
  if(type==='coin'){
    wrap.innerHTML=`<label class="ep-label">코인 값</label><input class="ep-input" id="epSingleInput" type="number" min="0" step="50" value="${coinVals[idx]||0}">`;
  }else if(type==='plus'){
    const v=sp&&sp.type==='move'&&sp.moveVal>0?sp.moveVal:3;
    wrap.innerHTML=`<label class="ep-label">앞으로 이동 칸 수</label><input class="ep-input" id="epSingleInput" type="number" min="1" max="20" value="${v}">`;
  }else if(type==='minus'){
    const v=sp&&sp.type==='move'&&sp.moveVal<0?Math.abs(sp.moveVal):3;
    wrap.innerHTML=`<label class="ep-label">뒤로 이동 칸 수</label><input class="ep-input" id="epSingleInput" type="number" min="1" max="20" value="${v}">`;
  }else{
    wrap.innerHTML=`<label class="ep-label">? 칸 코인 (확률 지급액)</label><input class="ep-input" id="epSingleInput" type="number" min="0" step="50" value="${coinVals[idx]||0}">`;
  }
}

function saveSingleFromPanel(idx){
  const panel=document.getElementById('epSingleEdit');
  const activeType=panel.querySelector('.ep-type-btn.active')?.dataset.type;
  const inp=document.getElementById('epSingleInput');
  const val=inp?parseInt(inp.value)||0:0;
  specialCells=specialCells.filter(s=>s.cellNum!==idx);
  if(activeType==='coin'){coinVals[idx]=val;}
  else if(activeType==='plus'){specialCells.push({cellNum:idx,type:'move',moveVal:Math.abs(val)||3});coinVals[idx]=0;}
  else if(activeType==='minus'){specialCells.push({cellNum:idx,type:'move',moveVal:-(Math.abs(val)||3)});coinVals[idx]=0;}
  else if(activeType==='mystery'){specialCells.push({cellNum:idx,type:'mystery',moveVal:0});coinVals[idx]=val;}
  panel.innerHTML='';
  renderBoard();
  updateEditPanelSelection();
  showSave();
}

renderBoard();renderDice();
