const SIZE=10;
const boardEl=document.getElementById("board"),piecesEl=document.getElementById("pieces");
const scoreEl=document.getElementById("score"),bestEl=document.getElementById("best");
const messageEl=document.getElementById("message"),finalScoreEl=document.getElementById("finalScore");
const shapes=[
 [[1]],[[1,1]],[[1,1,1]],[[1,1,1,1]],[[1,1,1,1,1]],
 [[1],[1]],[[1],[1],[1]],[[1],[1],[1],[1]],
 [[1,1],[1,1]],[[1,1,1],[1,1,1]],[[1,1],[1,1],[1,1]],
 [[1,0],[1,1]],[[0,1],[1,1]],[[1,1,0],[0,1,1]],
 [[1,1,1],[0,1,0]],[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],
 [[0,1],[1,1],[0,1]]
];
let board,score,best,available,selected=null,dragging=false;

function freshBoard(){return Array.from({length:SIZE},()=>Array(SIZE).fill(0))}
function randomShape(){return shapes[Math.floor(Math.random()*shapes.length)].map(r=>r.slice())}

function renderBoard(){
  boardEl.innerHTML="";
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const x=document.createElement("div");
    x.className="cell"+(board[r][c]?" filled":"");
    x.dataset.r=r;x.dataset.c=c;x.setAttribute("role","gridcell");
    boardEl.appendChild(x);
  }
}

function renderPieces(){
  piecesEl.innerHTML="";
  available.forEach((shape,i)=>{
    const p=document.createElement("button");
    p.className="piece"+(selected===i?" selected":"")+(shape===null?" used":"");
    p.type="button";
    if(shape===null){p.disabled=true;p.setAttribute("aria-label","Used block");return piecesEl.appendChild(p)}
    p.setAttribute("aria-label","Select block "+(i+1));
    const mini=document.createElement("div");
    mini.className="mini";
    mini.style.gridTemplateColumns=`repeat(${shape[0].length},15px)`;
    shape.forEach(row=>row.forEach(v=>{
      const q=document.createElement("span");
      q.className="mini-cell";
      q.style.visibility=v?"visible":"hidden";
      mini.appendChild(q);
    }));
    p.appendChild(mini);
    p.onclick=()=>selectPiece(i);
    piecesEl.appendChild(p);
  });
}

function selectPiece(i){
  if(!available[i])return;
  selected=i;
  document.querySelector(".pieces-panel")?.scrollIntoView({behavior:"smooth",block:"nearest"});
  renderPieces();
  clearPreview();
}

function canPlace(shape,r,c){
  if(!shape||r<0||c<0)return false;
  for(let y=0;y<shape.length;y++) for(let x=0;x<shape[y].length;x++)
    if(shape[y][x]&&(r+y>=SIZE||c+x>=SIZE||board[r+y][c+x]))return false;
  return true;
}

function place(shape,r,c){
  let count=0;
  for(let y=0;y<shape.length;y++) for(let x=0;x<shape[y].length;x++)
    if(shape[y][x]){board[r+y][c+x]=1;count++}
  return count;
}

function clearLines(){
  const rows=[],cols=[];
  for(let r=0;r<SIZE;r++)if(board[r].every(Boolean))rows.push(r);
  for(let c=0;c<SIZE;c++)if(board.every(row=>row[c]))cols.push(c);
  rows.forEach(r=>board[r].fill(0));
  cols.forEach(c=>{for(let r=0;r<SIZE;r++)board[r][c]=0});
  return rows.length+cols.length;
}

function addScore(points,lines){
  score+=points+(lines?lines*lines*10:0);
  scoreEl.textContent=score;
  if(score>best){best=score;localStorage.setItem("blockPuzzleBest",best);bestEl.textContent=best}
}

function allBlocked(){
  return available.filter(Boolean).every(s=>{
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(canPlace(s,r,c))return false;
    return true;
  });
}

function play(i,r,c){
  const shape=available[i];
  if(!shape||!canPlace(shape,r,c))return false;
  const blocks=place(shape,r,c);
  const lines=clearLines();
  addScore(blocks,lines);
  available[i]=null;
  selected=null;
  if(available.every(x=>x===null))available=[randomShape(),randomShape(),randomShape()];
  renderBoard();renderPieces();
  if(allBlocked())showGameOver();
  return true;
}

function showGameOver(){
  finalScoreEl.textContent=score;
  messageEl.classList.remove("hidden");
}

function newGame(){
  board=freshBoard();score=0;
  best=Number(localStorage.getItem("blockPuzzleBest")||0);
  available=[randomShape(),randomShape(),randomShape()];
  selected=null;messageEl.classList.add("hidden");
  scoreEl.textContent=0;bestEl.textContent=best;
  renderBoard();renderPieces();
}

function clearPreview(){
  document.querySelectorAll(".cell.preview").forEach(x=>x.classList.remove("preview"));
}

function previewAt(r,c){
  clearPreview();
  if(selected===null||!available[selected])return;
  const s=available[selected];
  if(!canPlace(s,r,c))return;
  for(let y=0;y<s.length;y++)for(let x=0;x<s[y].length;x++)if(s[y][x]){
    const el=boardEl.querySelector(`.cell[data-r="${r+y}"][data-c="${c+x}"]`);
    if(el)el.classList.add("preview");
  }
}

function cellFromPoint(clientX,clientY){
  const rect=boardEl.getBoundingClientRect(),gap=4;
  const inner=rect.width-8-gap*(SIZE-1),step=inner/SIZE+gap;
  return {r:Math.floor((clientY-rect.top-4)/step),c:Math.floor((clientX-rect.left-4)/step)};
}

boardEl.addEventListener("pointerdown",e=>{
  if(selected===null)return;
  dragging=true;
  const p=cellFromPoint(e.clientX,e.clientY);
  previewAt(p.r,p.c);
  boardEl.setPointerCapture(e.pointerId);
});
boardEl.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const p=cellFromPoint(e.clientX,e.clientY);
  previewAt(p.r,p.c);
});
boardEl.addEventListener("pointerup",e=>{
  if(!dragging)return;
  dragging=false;
  const p=cellFromPoint(e.clientX,e.clientY);
  if(selected!==null)play(selected,p.r,p.c);
  clearPreview();
});
boardEl.addEventListener("pointercancel",()=>{dragging=false;clearPreview()});
document.getElementById("newGameBtn").onclick=newGame;
document.getElementById("playAgainBtn").onclick=newGame;
newGame();