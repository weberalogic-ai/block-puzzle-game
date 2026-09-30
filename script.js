const SIZE=10;
const shapes=[[[1]],[[1,1]],[[1,1,1]],[[1,1,1,1]],[[1,1,1,1,1]],[[1],[1]],[[1],[1],[1]],[[1],[1],[1],[1]],[[1,1],[1,1]],[[1,1,1],[1,1,1]],[[1,1],[1,1],[1,1]],[[1,0],[1,1]],[[0,1],[1,1]],[[1,1,0],[0,1,1]],[[1,1,1],[0,1,0]],[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[0,1],[1,1],[0,1]]];
const colors=["#ff5c8a","#ffb84d","#5ee7ff","#7c6cff","#42e8a3","#ff6bd6","#a78bfa"];
let board,score,best,coins,level,available,selected=null,dragging=false,paused=false,combo=1;
const $=id=>document.getElementById(id);
const today=new Date().toISOString().slice(0,10);
function load(){best=+localStorage.getItem("bpBest")||0;coins=+localStorage.getItem("bpCoins")||0;level=+localStorage.getItem("bpLevel")||1}
function save(){localStorage.setItem("bpBest",best);localStorage.setItem("bpCoins",coins);localStorage.setItem("bpLevel",level)}
function fresh(){return Array.from({length:SIZE},()=>Array(SIZE).fill(null))}
function randomShape(){return shapes[Math.floor(Math.random()*shapes.length)].map(r=>r.slice())}
function colorFor(i){return colors[(i+level)%colors.length]}
function renderBoard(){const el=$("board");el.innerHTML="";for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const x=document.createElement("div");x.className="cell";if(board[r][c]){x.classList.add("filled");x.style.setProperty("--block",board[r][c])}x.dataset.r=r;x.dataset.c=c;el.appendChild(x)}}
function renderPieces(){$("pieces").innerHTML="";available.forEach((s,i)=>{const p=document.createElement("button");p.type="button";p.className="piece"+(selected===i?" selected":"")+(s===null?" used":"");if(!s){p.disabled=true;$("pieces").appendChild(p);return}const m=document.createElement("div");m.className="mini";m.style.gridTemplateColumns=`repeat(${s[0].length},15px)`;s.forEach(row=>row.forEach(v=>{const q=document.createElement("span");q.className="mini-cell";q.style.visibility=v?"visible":"hidden";q.style.setProperty("--mini",colorFor(i));m.appendChild(q)}));p.appendChild(m);p.onclick=()=>{selected=i;renderPieces();clearPreview();sound("select")};$("pieces").appendChild(p)})}
function canPlace(s,r,c){if(!s||r<0||c<0)return false;for(let y=0;y<s.length;y++)for(let x=0;x<s[y].length;x++)if(s[y][x]&&(r+y>=SIZE||c+x>=SIZE||board[r+y][c+x]))return false;return true}
function place(s,r,c,col){let n=0;for(let y=0;y<s.length;y++)for(let x=0;x<s[y].length;x++)if(s[y][x]){board[r+y][c+x]=col;n++}return n}
function clearLines(){const rows=[],cols=[];for(let r=0;r<SIZE;r++)if(board[r].every(Boolean))rows.push(r);for(let c=0;c<SIZE;c++)if(board.every(row=>row[c]))cols.push(c);rows.forEach(r=>board[r].fill(null));cols.forEach(c=>{for(let r=0;r<SIZE;r++)board[r][c]=null});return rows.length+cols.length}
function updateUI(){$("score").textContent=score;$("best").textContent=best;$("coins").textContent=coins;$("level").textContent=level;$("homeBest").textContent=best;$("homeCoins").textContent=coins;$("homeLevel").textContent=level;$("levelProgress").textContent=`${score%500}/500`;$("combo").textContent=`COMBO ×${combo}`}
function addScore(points,lines){const gain=points+lines*lines*25*combo;score+=gain;coins+=lines*combo+Math.floor(points/10);if(score>best)best=score;const newLevel=Math.floor(score/500)+1;if(newLevel>level){level=newLevel;coins+=25;sound("level")}save();updateUI();if(lines){combo=Math.min(5,combo+1);sound(lines>=2?"big":"clear")}else combo=1}
function allBlocked(){return available.filter(Boolean).every(s=>{for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(canPlace(s,r,c))return false;return true})}
function play(i,r,c){if(paused)return false;const s=available[i];if(!s||!canPlace(s,r,c)){sound("bad");return false}place(s,r,c,colorFor(i));const blocks=s.flat().filter(Boolean).length;const lines=clearLines();addScore(blocks,lines);available[i]=null;selected=null;if(available.every(x=>x===null))available=[randomShape(),randomShape(),randomShape()];renderBoard();renderPieces();if(allBlocked())gameOver();return true}
function gameOver(){sound("over");$("finalScore").textContent=score;$("earnedCoins").textContent=coins;$("gameOverModal").classList.remove("hidden")}
function start(){board=fresh();score=0;combo=1;available=[randomShape(),randomShape(),randomShape()];selected=null;paused=false;$("gameOverModal").classList.add("hidden");$("pauseModal").classList.add("hidden");$("homeScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");updateUI();renderBoard();renderPieces();sound("start")}
function goHome(){paused=false;$("pauseModal").classList.add("hidden");$("gameScreen").classList.add("hidden");$("homeScreen").classList.remove("hidden");updateUI()}
function clearPreview(){$$(" .cell.preview")}
function $$(sel){document.querySelectorAll(sel).forEach(x=>x.classList.remove("preview"))}
function preview(r,c){$$(".cell.preview");if(selected===null||!available[selected])return;const s=available[selected];if(!canPlace(s,r,c))return;for(let y=0;y<s.length;y++)for(let x=0;x<s[y].length;x++)if(s[y][x]){const e=document.querySelector(`.cell[data-r="${r+y}"][data-c="${c+x}"]`);if(e)e.classList.add("preview")}}
function point(x,y){const rect=$("board").getBoundingClientRect(),gap=4,inner=rect.width-8-gap*9,step=inner/10+gap;return{r:Math.floor((y-rect.top-4)/step),c:Math.floor((x-rect.left-4)/step)}}
$("board").addEventListener("pointerdown",e=>{if(selected===null)return;dragging=true;preview(...Object.values(point(e.clientX,e.clientY)));$("board").setPointerCapture(e.pointerId)});
$("board").addEventListener("pointermove",e=>{if(dragging){const p=point(e.clientX,e.clientY);preview(p.r,p.c)}});
$("board").addEventListener("pointerup",e=>{if(!dragging)return;dragging=false;const p=point(e.clientX,e.clientY);play(selected,p.r,p.c);$$(".cell.preview")});
$("playBtn").onclick=start;$("dailyBtn").onclick=start;$("againBtn").onclick=start;$("overHomeBtn").onclick=goHome;$("homeBtn").onclick=goHome;
$("pauseBtn").onclick=()=>{paused=true;$("pauseModal").classList.remove("hidden");sound("pause")};
$("resumeBtn").onclick=()=>{paused=false;$("pauseModal").classList.add("hidden");sound("select")};
$("restartBtn").onclick=start;
function sound(type){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=new C(),o=a.createOscillator(),g=a.createGain(),f={select:420,start:520,clear:700,big:980,level:1200,bad:150,over:100,pause:260}[type]||400;o.frequency.value=f;o.type=type==="bad"?"sawtooth":"sine";g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.06,a.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.12);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.13)}catch(e){}}
load();updateUI();$("dailyText").textContent=localStorage.getItem("bpDaily")===today?"Completed today ✓":"Clear 10 lines today";