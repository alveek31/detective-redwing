// Table Manners puzzle engine. Runs at build time only (build.js), so the answer never ships in the page.
// generate() picks a hidden seating, then draws true notes until exactly one seating fits them all.
const NAMES = ["Ada","Bo","Cyrus","Dina","Eli","Faye","Gus","Hana","Ivo","June","Kai","Lars"];
const DAYS = { // by getDay(): guests, level
  1:{n:5, level:"easy",   label:"Monday · Gentle"},
  2:{n:5, level:"medium", label:"Tuesday · Easy"},
  3:{n:6, level:"medium", label:"Wednesday · Medium"},
  4:{n:6, level:"hard",   label:"Thursday · Tricky"},
  5:{n:6, level:"hard",   label:"Friday · Tricky"},
  6:{n:7, level:"hard",   label:"Saturday · Full house"},
  0:{n:7, level:"hard",   label:"Sunday · Full house"}
};

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function permutations(n){const out=[];const p=[...Array(n).keys()];
  (function rec(k){if(k===n){out.push(p.slice());return}for(let i=k;i<n;i++){[p[k],p[i]]=[p[i],p[k]];rec(k+1);[p[k],p[i]]=[p[i],p[k]]}})(0);return out}
function seatSide(seat,n){const x=Math.cos(-Math.PI/2+seat*2*Math.PI/n);return x>1e-6?"window":x<-1e-6?"door":null}
function dist(a,b,n){const d=Math.abs(a-b)%n;return Math.min(d,n-d)}

// pos[guest] = seat
function holds(c,pos,n){
  const A=pos[c.a],B=pos[c.b],C=pos[c.c];
  switch(c.t){
    case "head": return A===0;
    case "notHead": return A!==0;
    case "side": return seatSide(A,n)===c.s;
    case "notSide": return seatSide(A,n)!==c.s;
    case "adj": return dist(A,B,n)===1;
    case "notAdj": return dist(A,B,n)!==1;
    case "across": return dist(A,B,n)===n/2;
    case "notAcross": return dist(A,B,n)!==n/2;
    case "two": return dist(A,B,n)===2;
    case "between": return dist(A,B,n)===1&&dist(A,C,n)===1;
  }
}
const WEIGHTS={
  easy:  {head:3,side:3,adj:3,across:3,between:2.5,notAdj:1,notHead:.8,two:1,notSide:.8,notAcross:.5},
  medium:{head:1.5,side:2,adj:2.5,across:2.5,between:2,notAdj:1.6,notHead:1,two:1.5,notSide:1.2,notAcross:1},
  hard:  {head:.5,side:.8,adj:2,across:2,between:2,notAdj:2.2,notHead:1.2,two:2,notSide:1.4,notAcross:1.4}
};
function truePool(pos,n){
  const pool=[];
  for(let a=0;a<n;a++){
    pool.push(pos[a]===0?{t:"head",a}:{t:"notHead",a});
    const s=seatSide(pos[a],n);
    if(s) pool.push({t:"side",a,s});
    for(const o of ["window","door"]) if(o!==s) pool.push({t:"notSide",a,s:o});
    for(let b=0;b<n;b++){ if(a===b) continue;
      const d=dist(pos[a],pos[b],n);
      if(a<b){
        pool.push(d===1?{t:"adj",a,b}:{t:"notAdj",a,b});
        if(n%2===0) pool.push(d===n/2?{t:"across",a,b}:{t:"notAcross",a,b});
        if(d===2) pool.push({t:"two",a,b});
      }
    }
    const gl=pos.indexOf((pos[a]+n-1)%n), gr=pos.indexOf((pos[a]+1)%n);
    pool.push({t:"between",a,b:Math.min(gl,gr),c:Math.max(gl,gr)});
  }
  return pool;
}
function countSolutions(clues,perms,n,limit=2){let k=0;for(const p of perms){if(clues.every(c=>holds(c,p,n))&&++k>=limit)break}return k}
const flavourKey=c=>c.t==="side"||c.t==="notSide"?c.t+"_"+c.s:c.t;

function generate(seedStr,n,level){
  const rng=mulberry32(hashStr(seedStr));
  const names=shuffle(NAMES.map((nm,i)=>({nm,id:i})),rng).slice(0,n);
  const perms=permutations(n);
  const sol=perms[Math.floor(rng()*perms.length)];
  const w=WEIGHTS[level];
  let pool=truePool(sol,n), cands=perms, clues=[];
  while(cands.length>1&&pool.length){
    const tot=pool.reduce((s,c)=>s+w[c.t],0); let r=rng()*tot, i=0;
    for(;i<pool.length-1;i++){r-=w[pool[i].t];if(r<=0)break}
    const c=pool.splice(i,1)[0]; const next=cands.filter(p=>holds(c,p,n));
    if(next.length<cands.length){clues.push(c);cands=next}
  }
  const keepExtra=level==="easy"?2:level==="medium"?1:0, removed=[];
  for(const c of shuffle(clues,rng)){const rest=clues.filter(x=>x!==c);
    if(countSolutions(rest,perms,n)===1){clues=rest;removed.push(c)}}
  clues=shuffle(clues.concat(removed.slice(0,keepExtra)),rng);
  let minute=13*60+5+Math.floor(rng()*40);
  for(const c of clues){
    if(["adj","notAdj","across","notAcross","two"].includes(c.t)&&rng()<.5){const t=c.a;c.a=c.b;c.b=t} // either guest might call
    const involved=[c.a,c.b,c.c].filter(x=>x!==undefined), others=[...Array(n).keys()].filter(g=>!involved.includes(g));
    c.wantOther=others.length>0&&rng()<.35;                       // a gossip call from someone else?
    c.otherCaller=others.length?others[Math.floor(rng()*others.length)]:null;
    c.r=rng();                                                     // which wording, once we know the crowd
    minute+=8+Math.floor(rng()*38);c.time=minute}
  return {n,level,names,solution:sol,clues};
}

module.exports = { NAMES, DAYS, generate, permutations, holds, countSolutions, seatSide };
