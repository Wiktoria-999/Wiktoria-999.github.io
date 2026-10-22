const DATA=JSON.parse(document.getElementById('payload').textContent);
const $=id=>document.getElementById(id);
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=x=>String(x||'').replace(/^\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '').replace(/^\s*\d+(?:\.\d+)?\s*[·、.．：:]?\s*/, '').replace(/\s/g,'').replace(/[()（）—\-]/g,'');
const chName={'4':'信息系统规划','5':'应用系统规划','12':'信息系统服务管理','15':'技术与研发管理'};
const case20=new Map(DATA.cases.map(x=>[x['素材ID'],x]));
const allcase=new Map(DATA.v2cases61.map(x=>[x['素材ID'],x]));
const qMap=new Map(DATA.questions.map(x=>[x['编号'],x]));
const pointMap=new Map;DATA.points.forEach(x=>{let a=pointMap.get(x['编号'])||[];a.push(x);pointMap.set(x['编号'],a)});
const tbMap=new Map(DATA.tables.map(x=>[x['子题编号'],x]));
const refMap=new Map;DATA.rewrites.forEach(x=>{let key=x['素材ID'];let a=refMap.get(key)||[];a.push(x);refMap.set(key,a)});
const exMap=new Map;DATA.v2examples.forEach(x=>{let k=x['素材ID'];let a=exMap.get(k)||[];a.push(x);exMap.set(k,a)});
let activeId='4-2-2.2', chapter='all', mode='question', caseList='20', query='';

let studyLoadPromise=null;
async function ensureStudyData(){
 if(studyLoadPromise)return studyLoadPromise;
 studyLoadPromise=fetch('data/study.json').then(async r=>{
  if(!r.ok)throw Error('学习素材加载失败：HTTP '+r.status);
  let x=await r.json(); Object.assign(DATA,x);
  x.cases.forEach(v=>case20.set(v['素材ID'],v));
  x.v2cases61.forEach(v=>allcase.set(v['素材ID'],v));
  x.points.forEach(v=>{let id=v['编号'],a=pointMap.get(id)||[];a.push(v);pointMap.set(id,a)});
  x.tables.forEach(v=>tbMap.set(v['子题编号'],v));
  x.rewrites.forEach(v=>{let k=v['素材ID'],a=refMap.get(k)||[];a.push(v);refMap.set(k,a)});
  x.v2examples.forEach(v=>{let k=v['素材ID'],a=exMap.get(k)||[];a.push(v);exMap.set(k,a)});
 }).catch(e=>{studyLoadPromise=null;throw e});
 return studyLoadPromise;
}
const paperLoadPromises=new Map();
async function ensurePaperData(key){
 let p=paperByKey.get(key);if(!p)throw Error('未找到指定模拟题');
 if(p.finalBody)return p;
 if(!paperLoadPromises.has(key)){
  paperLoadPromises.set(key,fetch('data/papers/'+encodeURIComponent(key)+'.json')
  .then(async r=>{if(!r.ok)throw Error('论文加载失败：HTTP '+r.status);let v=await r.json();Object.assign(p,v);return p})
  .catch(e=>{paperLoadPromises.delete(key);throw e}));
 }
 return paperLoadPromises.get(key);
}
function loadError(area,e){$(area).innerHTML='<div class="card"><h2>资料加载失败</h2><p>'+esc(e.message||e)+'</p><p>请通过 GitHub Pages 地址访问，不要直接双击在线版 index.html。</p></div>'}

function qFmt(id){let [c,n,s]=id.split('-');return `第${c}章·模拟题${+n}·${s}`}
function compat(position,id){return String(position||'').includes(qFmt(id))}
function isMatch(a,b){let A=clean(a),B=clean(b);return A===B||(A.length>2&&B.length>2&&(A.includes(B)||B.includes(A)))}
function bestExample(id,pt){let mid=pt['建议素材ID'];let name=pt['教材论点名称（按V2拆分）'];let rw=(refMap.get(mid)||[]).filter(x=>compat(x['原模拟题子题'],id));let exact=rw.find(x=>isMatch(x['对应理论论点（源V2）'],name));if(exact)return {text:exact['本次精修的实践写作示例'],source:'V2精修40段 · 对应论点原文',note:exact['来源性质与注意'],kind:'refined'};
let ex=(exMap.get(mid)||[]).filter(x=>compat(x['原题定位'],id));let found=ex.find(x=>isMatch(x['对应论点'],name));if(found)return {text:found['V2实践写作示例'],source:'V2完整388条 · 通用适配示例',note:found['示例来源性质']+'。该段未经20条精修，不等于完整论文正文。',kind:'general'};
return null}
function caseText(id){let p=case20.get(id),b=allcase.get(id);if(p)return {label:'V2精修20条 · 完整实践母版',text:p['精修实践母版（可直接学习）'],amount:p['量化数据与性质（A/B/D）'],output:p['来源既有成果'],border:p['修订边界与专业提示'],tab:p['成果表格建议字段'],name:p['核心素材名称']};if(b)return {label:'V2完整61条 · 实践母版（未列入精修20）',text:b['V2实践母版（学习改写）'],amount:b['量化信息与口径（V1）'],output:b['交付成果（V1）'],border:b['修订注意事项'],tab:'',name:b['核心素材名称']};return null}
function switchMode(m){mode=m; $('navlabel').textContent=m==='question'?'模拟题目录':'素材目录';$('casearea').classList.toggle('hide',m==='question');$('questionarea').classList.toggle('hide',m!=='question');$('navQ').classList.toggle('sel',m==='question');$('navC').classList.toggle('sel',m==='cases'); if(m==='cases'){$('chapters').classList.add('hide');showCases()}else{$('chapters').classList.remove('hide');showQuestion()}renderList();closeNav()}
function setChapter(c){chapter=c;renderChapter();renderList()}
function renderChapter(){ $('chapters').innerHTML='<button class="ch '+(chapter==='all'?'sel':'')+'" onclick="setChapter(\'all\')">全部</button>'+Object.entries(chName).map(([k,v])=>`<button class="ch ${chapter===k?'sel':''}" onclick="setChapter('${k}')">第${k}章</button>`).join('') }
function nameFor(q){let t=q['老师子题原文']||'';return t.replace(/^\d+\.\d+\s*/,'')}
function renderList(){let pool=mode==='question'?DATA.questions:DATA.v2cases61;
if(mode==='question'){let sel=pool.filter(x=>(chapter==='all'||x['编号'].split('-')[0]===chapter)&&(!query||[x['老师子题原文'],x['编号'],x['优先素材ID'],x['其余41条补位']].some(z=>String(z||'').toLowerCase().includes(query))));$('list').innerHTML=sel.length?sel.map(x=>`<button class="qbtn ${x['编号']===activeId?'active':''}" onclick="pickQ('${x['编号']}')"><b>${esc(qFmt(x['编号']))}</b> ${esc(nameFor(x))}<small>${esc(x['题型'])} · ${esc(x['文字预算'])}</small></button>`).join(''):'<div class="empty">没有匹配题目</div>'}
else{let items=pool.filter(x=>(caseList==='61'||case20.has(x['素材ID']))&&(!query||[x['素材ID'],x['核心素材名称'],x['分类']].some(z=>String(z||'').toLowerCase().includes(query))));$('list').innerHTML=items.map(x=>`<button class="qbtn" onclick="viewCase('${esc(x['素材ID'])}')"><b>${esc(x['素材ID'])}</b> ${esc(x['核心素材名称'])}<small>${esc(x['分类'])}</small></button>`).join('')||'<div class="empty">没有找到对应素材</div>'}
}
function pickQ(id){activeId=id;mode='question';document.location.hash=id;renderList();showQuestion();closeNav();window.scrollTo(0,0)}
function spec(label,value){return value?`<div class="specrow"><b>${esc(label)}</b><div>${esc(value)}</div></div>`:''}
function expandMother(mid,open=false){let a=caseText(mid);if(!a)return '<p class="muted">素材库暂无该ID的内容。</p>';return `<details class="details" ${open?'open':''}><summary>查看 ${esc(mid)} · 完整实践母版（这段是完整工作链，不是本题要整段照抄的答案）</summary><div class="inner"><div class="source">${esc(a.label)}</div><p>${esc(a.text)}</p>${spec('数字与口径',a.amount)}${spec('成果',a.output)}${spec('表格线索',a.tab)}${spec('使用边界',a.border)}</div></details>`}
function pointCard(id,p,i){let mid=p['建议素材ID'],ex=bestExample(id,p),is20=case20.has(mid),title=p['教材论点名称（按V2拆分）']||p['原题'];return `<details class="topic" ${i===0?'open':''}><summary class="topic-head"><span class="num">${i+1}</span><span class="main-tt"><strong>${esc(title)}</strong><span class="sub">素材 ${esc(mid)} · ${esc(p['素材名称'])} · ${is20?'V2精修20条':'补充素材（61条库）'}</span></span><span class="tag ${is20?'prime':'warn'}">${is20?'精修素材':'需补位'}</span></summary><div class="topic-body"><p class="small muted">本论点适配重点：${esc(p['不同论点时的写作侧重'])}</p>${ex?`<div class="source">${esc(ex.source)}</div><div class="example" id="ex-${esc(id)}-${i}">${esc(ex.text)}</div><div class="ex-note">${esc(ex.note||'这段只是实践写作示例；完整子题需先补教材理论。')}</div><div class="actions" style="margin-top:10px"><button class="btn-light" onclick="copyExample('${esc(id)}',${i})">复制这段实践</button><button class="btn-light" onclick="viewCase('${esc(mid)}')">单独看 ${esc(mid)}</button></div>`:`<div class="hint">本论点没有找到可一一对应的V2现成实践段落。下面可查看 ${esc(mid)} 的工作母版，但需要按此论点重新组织，不应直接照抄。</div>`}${expandMother(mid)}</div></details>`}
function showQuestion(){let q=qMap.get(activeId);if(!q){activeId=DATA.questions[0]['编号'];q=qMap.get(activeId)}let pts=pointMap.get(activeId)||[],t=tbMap.get(activeId),typ=q['题型'],[c,n,s]=activeId.split('-');
let tableNeeded=Boolean(t)||(/偏实践/.test(typ));
let note=typ==='理论+实践'?'每个教材分点都需先写理论，再选对应实践；下方仅提供实践素材，不是整道题答案。':typ==='偏理论'?'先按教材把定义、原则或分类答完整；项目实践一般用于补充举例或应用对照表。':'优先产出题目要求的具体成果文件/表格；实践素材只提供填表的项目依据。';
$('questionarea').innerHTML=`<div class="hero"><div class="eyebrow">第${c}章 · ${esc(chName[c])} / 模拟题${n}</div><h1>${esc(q['老师子题原文'])}</h1><p>${esc(note)}</p><div class="herostats"><span class="stat">${esc(q['题型'])}</span><span class="stat">文字参考 ${esc(q['文字预算'])}</span><span class="stat">${esc(q['覆盖判断'])}</span><span class="stat">${pts.length}个具体分点</span></div></div>
<div class="card"><div class="title-line"><div><h2>先看本题需要做什么</h2><p class="muted small">来自V3模拟题索引，非新编正文</p></div><div class="actions"><button class="btn-primary" onclick="copyQuestion()">复制本题素材</button><button class="btn-light" onclick="window.print()">打印本题</button></div></div><div class="hint">${esc(q['防踩坑提醒'])} ${esc(q['下一步怎样写'])}</div><div class="meta"><span class="tag">已有精修：${esc(q['优先素材ID'])}</span><span class="tag">其他补位：${esc(q['其余41条补位'])}</span></div>${(q['需补的具体论点']&&q['需补的具体论点']!=='—')?`<p class="small"><b>需补位论点：</b>${esc(q['需补的具体论点'])}</p>`:''}</div>
<div class="card"><h2>按论点查看 V2 的原始写作示例</h2><p class="lead small">点击任一论点，先读“V2针对本论点的实践段落”；不明白为什么这样写，再展开“完整实践母版”看整个工作过程。<b>切勿把完整母版和改写段落两段都抄进正文。</b></p>${pts.map((p,i)=>pointCard(activeId,p,i)).join('')||'<div class="hint">V3没有为这道题拆出明确的素材映射，须回原题和理论汇总查证。</div>'}</div>
${tableNeeded?`<div class="card"><h2>本题成果表格怎么准备？</h2>${t?`<div class="tablebox"><strong>${esc(t['表格名称'])}</strong><p><b>表格应该覆盖：</b>${esc(t['表头与必须覆盖的维度'])}</p><p><b>可用项目数据：</b>${esc(t['本项目可用数据'])}</p><p class="small muted">${esc(t['注意事项'])}</p></div>`:`<div class="tablebox"><p>${esc(q['成果表格类型']||'请结合老师原题决定是否需要项目应用对照表。')}</p></div>`}<div class="hint">这里展示的是V3记录的“表格结构与填表依据”，<b>不是已经完成的成果表</b>。正式答题时还需要按所列维度填写具体行。</div></div>`:''}
<div class="card teacher"><div><h2>看完本题怎样写？</h2><p>先核对老师教材理论，再选上面各论点的实践段落；偏实践题另填成果表。不要把“母版”整段拼到每一道题里。</p><p class="small muted">资料来源：${esc(q['课件来源'])}；V2与V3的原始文字在本页分别标记。</p></div><button class="btn-primary" onclick="nextQ()">下一子题 →</button></div>`}
function copyCase(id){let a=caseText(id);if(a)copyText(a.text)}
function copyExample(id,i){let p=(pointMap.get(id)||[])[i];let ex=bestExample(id,p);if(ex)copyText(ex.text)}
function copyQuestion(){let q=qMap.get(activeId),ps=pointMap.get(activeId)||[],rows=ps.map((p,i)=>{let ex=bestExample(activeId,p);return `${i+1}. ${p['教材论点名称（按V2拆分）']} | 素材 ${p['建议素材ID']}\n${ex?ex.text:'暂无精确适配段落；需要依据母版另写。'}`});let t=tbMap.get(activeId);copyText(`${q['老师子题原文']}\n题型：${q['题型']}；字数：${q['文字预算']}\n【实践素材，不含教材理论】\n${rows.join('\n\n')}\n${t?'\n【成果表格结构】'+t['表格名称']+'：'+t['表头与必须覆盖的维度']:''}\n注意：模拟项目素材；请核对理论并按具体题目编制正文。`)}
function copyText(s){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(s).then(()=>toast('已复制')).catch(()=>fallbackCopy(s));return}fallbackCopy(s)}function fallbackCopy(s){let t=document.createElement('textarea');t.value=s;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast('已复制')}catch(e){toast('复制失败，请手动选择文字')}t.remove()}
let tm;function toast(s){let el=$('toast');el.textContent=s;el.style.display='block';clearTimeout(tm);tm=setTimeout(()=>el.style.display='none',2100)}
function showCases(){let ids=DATA.v2cases61.filter(x=>caseList==='61'||case20.has(x['素材ID'])).filter(x=>!query||[x['素材ID'],x['核心素材名称'],x['分类']].some(t=>String(t||'').toLowerCase().includes(query)));$('casearea').innerHTML=`<div class="hero"><div class="eyebrow">V2 · 实践母版库</div><h1>一条素材，代表一个完整的项目工作案例</h1><p>母版负责理解“为什么做、怎么做、用了什么数字、形成什么成果”；不是不看题目就可以整段抄进正文的万能答案。</p></div><div class="card"><h2>阅读范围</h2><div class="actions"><button class="btn-light" onclick="caseList='20';showCases();renderList()">精修20条</button><button class="btn-light" onclick="caseList='61';showCases();renderList()">全部61条</button></div><p class="small muted">当前显示${ids.length}条。点击素材查看母版及来源；回到“按模拟题学习”时会自动按论点找到适用段落。</p></div><div class="casegrid">${ids.map(x=>`<button class="caseitem" onclick="viewCase('${esc(x['素材ID'])}')"><small>${esc(x['素材ID'])} · ${esc(x['分类'])}</small><strong>${esc(x['核心素材名称'])}</strong><small>${case20.has(x['素材ID'])?'V2精修20条':'V2补充41条'}</small></button>`).join('')}</div>`}
async function viewCase(id){await switchMode('cases');let a=caseText(id),s=DATA.v2cases61.find(x=>x['素材ID']===id);if(!a)return;let rws=refMap.get(id)||[];$('casearea').innerHTML=`<div class="hero"><div class="eyebrow">${esc(id)} · ${case20.has(id)?'精修20条':'补充素材'}</div><h1>${esc(a.name)}</h1><p>下面是V2原有的完整实践母版，用于理解工作链；不是在所有考题中全文使用。</p></div><div class="card"><h2>完整实践母版（V2原文）</h2><div class="source">${esc(a.label)}</div><div class="example">${esc(a.text)}</div><div style="margin-top:16px">${spec('量化数据',a.amount)}${spec('成果',a.output)}${spec('使用边界',a.border)}${spec('表格线索',a.tab)}</div></div>${rws.length?`<div class="card"><h2>同一素材的两种论点写法</h2>${rws.map((x,i)=>`<div class="topic-body"><div class="source">${esc(x['对应理论论点（源V2）'])}</div><div class="example">${esc(x['本次精修的实践写作示例'])}</div><p class="small muted">${esc(x['相同素材的不同写作侧重'])}</p><button class="btn-light" onclick="pickQ('${findQFromLocation(x['原模拟题子题'])}')">返回这道题</button></div>`).join('<hr style="border:0;border-top:1px solid #e5eeee">')}</div>`:''}<div class="card"><h2>适用场景</h2><p class="small muted">按论点使用时，应选题目里需要的步骤和成果；数据分类与模拟目标保持一致。</p><div class="actions"><button class="btn-primary" onclick="copyCase('${esc(id)}')">复制母版</button><button class="btn-light" onclick="switchMode('question')">返回模拟题目录</button></div></div>`;closeNav();window.scrollTo(0,0)}
function findQFromLocation(pos){let m=String(pos||'').match(/第(\d+)章·模拟题(\d+)·(\d+\.\d+)/);return m?`${+m[1]}-${+m[2]}-${m[3]}`:'4-2-2.2'}
function nextQ(){let idx=DATA.questions.findIndex(q=>q['编号']===activeId);pickQ(DATA.questions[(idx+1)%DATA.questions.length]['编号'])}
function closeNav(){$('sidebar').classList.remove('show');$('scrim').classList.remove('show')}
function toggleNav(){let x=$('sidebar').classList.toggle('show');$('scrim').classList.toggle('show',x)}
function findInput(v){query=String(v||'').trim().toLowerCase();renderList();if(mode==='cases')showCases()}
function toggleHelp(){ $('helpcard').classList.toggle('hide');$('helpcard').scrollIntoView({behavior:'smooth',block:'start'}) }
function init(){let hash=decodeURIComponent(location.hash.slice(1));if(qMap.has(hash))activeId=hash;renderChapter();renderList();showQuestion();}
window.addEventListener('hashchange',()=>{let k=decodeURIComponent(location.hash.slice(1));if(qMap.has(k)&&k!==activeId)pickQ(k)});
// Full paper mode, added without altering V2/V3 original material mappings
const paperByKey=new Map(DATA.papers.map(x=>[x.key,x]));
let activePaperKey='4-2', endingStyle='long', showOriginalPages=false, essayView='final';
function paperContext(p){return ['4','5'].includes(p.chapter)?'planning':'service'}
function paperStep(t,id){return `<section class="card paper-jump" id="${id}"><div class="paper-body">${t}</div></section>`}
function paperTemplates(p){let k=paperContext(p),w=DATA.writing,c=w.tailored[p.key];return {bg:w.backgrounds[k],transition:w.transitions[k],ending:w.endings[k][endingStyle],transitionHtml:c.transitionHtml,transitionText:c.transitionText,endingHtml:c.endingHtml[endingStyle],endingText:c.endingText[endingStyle],topic:c.topic,order:c.order,example:w.sampleKeys[k]===p.key,key:k}}
function paperLabels(){ $('navlabel').textContent=mode==='paper'?'27篇模拟题正文':mode==='question'?'子题目录':'素材目录';$('navP').classList.toggle('sel',mode==='paper');$('navQ').classList.toggle('sel',mode==='question');$('navC').classList.toggle('sel',mode==='cases');$('paperarea').classList.toggle('hide',mode!=='paper');$('questionarea').classList.toggle('hide',mode!=='question');$('casearea').classList.toggle('hide',mode!=='cases');$('chapters').classList.toggle('hide',mode==='cases');}
async function switchMode(m){mode=m;paperLabels();if(m==='paper'){showPaper()}else{try{await ensureStudyData()}catch(e){loadError(m==='cases'?'casearea':'questionarea',e);return}if(mode!==m)return;if(m==='question')showQuestion();else showCases()}renderList();closeNav()}
function renderList(){
 if(mode==='paper'){
 let pool=DATA.papers.filter(p=>(chapter==='all'||p.chapter===chapter)&&(!query||[p.title,p.name,p.key,p.bodyPlain].some(x=>String(x||'').toLowerCase().includes(query))));
 $('list').innerHTML=pool.map(p=>`<button class="qbtn ${p.key===activePaperKey?'active':''}" onclick="pickPaper('${p.key}')"><b>第${p.chapter}章 · 模拟题${p.number}</b> ${esc(p.title.replace(/^第\d+章\s*[·．]\s*模拟题\d+[｜|]*/,''))}<small>${p.subnumbers.join(' / ')} · ${p.tableCount}张原稿表格</small></button>`).join('')||'<div class="empty">没有匹配论文</div>';
 }else if(mode==='question'){
 let sel=DATA.questions.filter(x=>(chapter==='all'||x['编号'].split('-')[0]===chapter)&&(!query||[x['老师子题原文'],x['编号'],x['优先素材ID'],x['其余41条补位']].some(z=>String(z||'').toLowerCase().includes(query))));
 $('list').innerHTML=sel.map(x=>`<button class="qbtn ${x['编号']===activeId?'active':''}" onclick="pickQ('${x['编号']}')"><b>${esc(qFmt(x['编号']))}</b> ${esc(nameFor(x))}<small>${esc(x['题型'])} · ${esc(x['文字预算'])}</small></button>`).join('')||'<div class="empty">没有匹配题目</div>';
 }else{
 let items=DATA.v2cases61.filter(x=>(caseList==='61'||case20.has(x['素材ID']))&&(!query||[x['素材ID'],x['核心素材名称'],x['分类']].some(z=>String(z||'').toLowerCase().includes(query))));
 $('list').innerHTML=items.map(x=>`<button class="qbtn" onclick="viewCase('${esc(x['素材ID'])}')"><b>${esc(x['素材ID'])}</b> ${esc(x['核心素材名称'])}<small>${esc(x['分类'])}</small></button>`).join('')||'<div class="empty">没有找到对应素材</div>';
 }}
function pickPaper(key){if(!paperByKey.has(key))return;activePaperKey=key;mode='paper';paperLabels();renderList();showPaper();closeNav();try{history.replaceState(null,'','#paper-'+key)}catch(e){}window.scrollTo(0,0)}
function renderTemplatePages(source){return `<details class="details"><summary>查看《${source==='transition'?'摘要式过渡段':'结尾三段式'}》原始PDF页面图片（按需加载）</summary><div class="inner"><div class="original-pages">${DATA.writing.scans[source].map((src,i)=>`<figure><img loading="lazy" src="${src}" alt="原始资料第${i+1}页"><figcaption>原PDF第${i+1}页</figcaption></figure>`).join('')}</div></div></details>`}
async function showPaper(){
 let key=activePaperKey;let p=paperByKey.get(key);if(!p)return;if(!p.finalBody){$('paperarea').innerHTML='<div class="card"><h2>正在加载这篇论文…</h2><p>首次打开时只下载当前论文，不加载其他26篇。</p></div>';try{await ensurePaperData(key)}catch(e){loadError('paperarea',e);return}if(activePaperKey!==key||mode!=='paper')return;}let m=paperTemplates(p);let pass=m.example;
 const nav=[['背景','paper-background'],['过渡','paper-transition'],['正文','paper-body'],['结尾','paper-ending'],['关联素材','paper-lookup']];
 const warn='<span class="paper-tag">本题专属改写</span>过渡段、结尾段已依照当前模拟题的实际子题改写。<mark class="paper-focus">黄色高亮</mark>表示需根据题目变化的理论概念、论述顺序、经验教训及改进方向；原上传范文在下方保留供对照。';
 const qlinks=p.subnumbers.map((s,i)=>{let key=p.key+'-'+s;return `<button class="btn-light" onclick="openPaperPoint('${key}')">${esc(s)} 对应V2/V3素材 ${qMap.has(key)?'↗':'（重复题或无映射）'}</button>`}).join('');
 const bodyToShow=essayView==='final'?p.finalBody:p.body; const bg=m.bg.map(s=>`<p class="template-p">${esc(s)}</p>`).join('');
 const ens=m.endingHtml.map(s=>`<p class="template-p">${s}</p>`).join('');
 $('paperarea').innerHTML=`<div class="hero"><div class="eyebrow">论文整篇阅读 · 第${p.chapter}章 · 模拟题${p.number}</div><h1>${esc(p.title)}</h1><p>同一页面组合：项目背景 → 本题过渡 → V2融合正文／原Word对照（均保留原表格）→ 本题结尾 → 素材来源。</p><div class="herostats"><span class="stat">${p.subnumbers.length}个正文子题</span><span class="stat">原Word含${p.tableCount}张表格（含题目分析及检查表）</span><span class="stat">本题采用${m.key==='planning'?'规划类':'服务管理类'}背景</span></div></div>
 <div class="paper-banner">${warn}</div>
 <div class="card"><div class="title-line"><div><h2>整篇阅读 · 目录与操作</h2><p class="small muted">默认显示融合学习版：V2实践细节已融入正文，不需要再单独拼接绿色段落；保留原Word对照以及过渡、结尾的黄色高亮。</p></div><div class="actions"><button class="btn-primary" onclick="copyCurrentPaperBody()">复制当前正文</button><button class="btn-light" onclick="window.print()">打印</button></div></div><div class="paper-nav">${nav.map(([name,id])=>`<a href="#${id}" onclick="jumpWithin(event,'${id}')">${name}</a>`).join('')}</div><div class="paper-subnav">${qlinks}</div></div>
 <section class="card paper-jump" id="paper-background"><h2>01 · 项目背景</h2><div class="paper-source">原文来源：${esc(DATA.writing.sourceNames[m.key])}。内容完整保留，不使用其他项目替换。</div><div class="paper-body">${bg}</div><div class="actions"><button class="btn-light" onclick="copyCurrentTemplate('bg')">复制背景原文</button></div></section>
 <section class="card paper-jump" id="paper-transition"><h2>02 · 摘要式过渡段 · 本题改写</h2><div class="paper-source">依据本题${p.subnumbers.join("、")}顺序，参考${esc(DATA.writing.sourceNames.transition)}的三句式结构重新编写。<b>黄色部分是需要按题调整的内容</b>；不是PDF原文逐字引用。</div><div class="paper-quote">${m.transitionHtml}</div><div class="actions"><button class="btn-primary" onclick="copyCurrentTemplate('transition')">复制本题过渡段</button><button class="btn-light" onclick="togglePaperHighlights()">高亮显示／隐藏</button></div><details class="details"><summary>对照：上传PDF的原始过渡段范文（未改写）</summary><div class="inner"><p class="template-p">${esc(m.transition)}</p></div></details>${renderTemplatePages('transition')}</section>
 <section class="card paper-jump" id="paper-body"><h2>03 · 模拟题2.x正文 · 融合学习版／原文对照</h2><div class="paper-source">来源：${esc(p.name)}；原有理论要点与表格保留；V2实践细节已融入对应段落，不再单列绿色补充框。<b>这是融合学习版，个别子题的文字篇幅仍需按老师考试预算精简。</b></div><div class="paper-controls"><span class="small muted">正文版本：</span><button class="paper-seg ${essayView==='final'?'active':''}" onclick="setEssayView('final')">融合正文（学习版）</button><button class="paper-seg ${essayView==='original'?'active':''}" onclick="setEssayView('original')">原Word正文</button><button class="btn-light" onclick="copyCurrentPaperBody()">复制当前版本</button></div><div class="paper-body">${bodyToShow}</div><details class="details"><summary>本题融合素材与修改位置（${p.mergeSources.length}个子题）</summary><div class="inner">${p.mergeSources.map(x=>`<p class="small"><b>${esc(x.sub)}</b>：V2 ${esc(x.source)} · 已融合到正文段落（${esc(x.location)}）</p>`).join('')}</div></details><details class="details"><summary>展开原Word第一部分：模拟题分析</summary><div class="inner paper-body">${p.analysis||'原文件没有单独的题目分析段落'}</div></details><details class="details"><summary>展开原Word第三部分：生成质量检查</summary><div class="inner paper-body">${p.qa||'原文件没有单独的质量检查段落'}</div></details></section>
 <section class="card paper-jump" id="paper-ending"><h2>04 · 结尾三段式 · 本题改写</h2><div class="paper-source">首段沿用你上传的结尾范文中的模拟项目成效；<b>第二段经验总结、第三段后续方向已依本题重写并用黄色高亮</b>，完整／精简版均可切换。</div><div class="paper-controls"><span class="small muted">选择版本：</span><button class="paper-seg ${endingStyle==='long'?'active':''}" onclick="setEndingStyle('long')">完整三段式</button><button class="paper-seg ${endingStyle==='short'?'active':''}" onclick="setEndingStyle('short')">精简三段式</button><button class="btn-primary" onclick="copyCurrentTemplate('ending')">复制本题结尾</button></div><div class="paper-body">${ens}</div><p class="qa-note">首段的验收结果、可用率、满意度等数字来自你上传的模拟范文，并非实测验证；第二、三段属于按题进行的模拟写作改写。</p><details class="details"><summary>对照：原PDF结尾范文（${endingStyle==='long'?'完整':'精简'}版）</summary><div class="inner paper-body">${m.ending.map(s=>`<p class="template-p">${esc(s)}</p>`).join("")}</div></details>${renderTemplatePages('ending')}</section>
 <section class="card paper-jump" id="paper-lookup"><h2>05 · 本题实践种子素材（V2＋V3）</h2><p class="small muted">学习版已将V2的具体方法与数据融入对应段落，原Word仍可对照；V3用于查找论点对应关系。</p><div class="paper-subnav">${qlinks}</div><div class="hint">点上方子题按钮，即可切换到对应的V2/V3材料；返回“按整篇论文”会继续展示此篇。</div></section>`;
}
function setEndingStyle(s){endingStyle=s;showPaper();document.getElementById('paper-ending').scrollIntoView({behavior:'smooth',block:'start'})}
function setEssayView(v){essayView=v;showPaper();document.getElementById('paper-body').scrollIntoView({behavior:'smooth',block:'start'})}
function copyCurrentPaperBody(){let p=paperByKey.get(activePaperKey);let t=document.createElement('div');t.innerHTML=essayView==='final'?p.finalBody:p.body;t.querySelectorAll('.opt-proof,.essay-estimate').forEach(n=>n.remove());copyText(t.innerText||t.textContent||'')}
function copyCurrentTemplate(t){let p=paperByKey.get(activePaperKey),m=paperTemplates(p);let text=t==='bg'?m.bg.join('\n\n'):t==='transition'?m.transitionText:m.endingText.join('\n\n');copyText(text)}
function togglePaperHighlights(){document.body.classList.toggle('no-highlight')}
function copyOriginalBody(){let p=paperByKey.get(activePaperKey);let t=document.createElement('div');t.innerHTML=p.body;copyText(t.innerText||t.textContent||'')}
async function openPaperPoint(id){if(!qMap.has(id)){toast('此子题已在去重版中引用其他题，或V3没有单独建立映射');return}await pickQ(id)}
function jumpWithin(ev,id){ev.preventDefault();document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}
function findInput(v){query=String(v||'').trim().toLowerCase();renderList();if(mode==='cases')showCases()}
async function pickQ(id){activeId=id;mode='question';paperLabels();try{await ensureStudyData()}catch(e){loadError('questionarea',e);return}renderList();showQuestion();closeNav();try{history.replaceState(null,'','#'+id)}catch(e){}window.scrollTo(0,0)}
async function init(){let hash=decodeURIComponent(location.hash.slice(1));if(hash.startsWith('paper-')&&paperByKey.has(hash.slice(6)))activePaperKey=hash.slice(6);else if(qMap.has(hash)){activeId=hash;mode='question'}else mode='paper';paperLabels();renderChapter();if(mode==='question'){try{await ensureStudyData()}catch(e){loadError('questionarea',e);return}}renderList();if(mode==='paper')showPaper();else showQuestion()}

init();