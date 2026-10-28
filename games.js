(()=>{'use strict';
const titles={int:'عدد صحيح',float:'عدد عشري',str:'نص',bool:'قيمة منطقية'};
const shuffle=items=>items.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.x);
let active=null;
function mount(host,c){
 active?.destroy();const baseTasks=window.LessonData[c.key];const order=baseTasks.map((_,i)=>i).sort((a,b)=>{const weak=i=>{const v=c.learning?.[baseTasks[i].topic];return v&&v.streak<2?v.errors:0};return weak(b)-weak(a)});const tasks=order.map(i=>baseTasks[i]);let level=Math.max(0,Math.min(2,c.difficulty||0)),hintStep=0;let index=0,score=0,attempts=0,ended=false,locked=false;
 const element=(tag,text,cls='')=>{const el=document.createElement(tag);el.textContent=text;el.className=cls;return el};
 const button=(parent,text,fn,cls='btn alt')=>{const el=element('button',text,cls);el.type='button';el.onclick=fn;parent.append(el);return el};
 const event=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
 let task,stage,actions,output;
 function answer(correct){if(ended||locked)return;if(!correct){attempts++;level=Math.max(0,level-1);c.record?.({topic:task.topic,correct:false,level});c.message('حاول مرة أخرى: '+getHint(),false);output.textContent='لم تُحل المهمة بعد.';event('journey-answer',{correct:false});return}locked=true;score+=attempts===0?1:0;if(attempts===0)level=Math.min(2,level+1);c.record?.({topic:task.topic,correct:true,firstTry:attempts===0,level});c.progress(index+1,tasks.length);c.message(task.why,true);output.textContent=(task.expected!==undefined?'الناتج الصحيح: '+task.expected:'التصنيف الصحيح: '+task.answer+' — '+titles[task.answer]);output.className='puzzle-output puzzle-success';event('journey-answer',{correct:true});stage.querySelectorAll('button,input').forEach(el=>el.disabled=true);actions.replaceChildren();button(actions,index===tasks.length-1?'أكملت اللعبة — انتقل إلى النتيجة':'المهمة التالية',()=>{if(index===tasks.length-1){ended=true;c.complete(score)}else{index++;render()}},'btn green')}
 function render(){locked=false;attempts=0;host.replaceChildren();task=window.LessonVariants?.[c.key]?.[order[index]]?.[level]||tasks[index];hintStep=0;c.message('',true);host.append(element('p','مستوى التدريب: '+['تأسيسي','متوسط','تحدٍّ'][level],'badge'));host.append(element('p','المهمة '+(index+1)+' من '+tasks.length+' · '+task.prompt,'arena-instruction'));stage=element('div','','arena-stage');host.append(stage);actions=element('div','','puzzle-actions');output=element('div','','puzzle-output');output.setAttribute('aria-live','polite');
 if(task.input!==undefined){const label=element('p','مدخلات التجربة بالترتيب (كل قيمة في سطر):','puzzle-input');label.append(element('pre',task.input,'code'));stage.append(label)}
 if(c.key==='types')classify();else if(c.key==='convert')portal();else if(c.key==='input')assemble();else repair();
 host.append(actions,output);c.progress(index,tasks.length);
 }
 function code(text){stage.append(element('pre',text,'code repair-code'))}
 function classify(){code(task.code);const bins=element('div','','bin-grid');stage.append(bins);for(const type of task.options){const b=button(bins,type+' · '+titles[type],()=>answer(type===task.answer),'data-bin');b.setAttribute('aria-label','صندوق '+type)}}
 function portal(){code(task.code);stage.append(element('p','اختر بوابة التحويل التي تحقق المطلوب في السؤال.','puzzle-input'));const doors=element('div','','portal-grid');stage.append(doors);shuffle(task.options).forEach(text=>{const b=button(doors,text,()=>answer(text===task.answer),'portal-door');b.style.setProperty('--tint','#8066bc');b.setAttribute('aria-label','بوابة '+text)})}
 function assemble(){const slots=element('div','','code-workbench'),rack=element('div','','code-toolbox');stage.append(slots,rack);let order=[];const tokens=new Map();const draw=()=>{slots.replaceChildren();task.lines.forEach((_,i)=>slots.append(element('div',(i+1)+'. '+(order[i]===undefined?'اختر السطر التالي من البطاقات':task.lines[order[i]]),'code-slot'+(order[i]!==undefined?' filled':''))))};shuffle(task.lines.map((line,id)=>({line,id}))).forEach(({line,id})=>{const b=button(rack,line,()=>{if(locked||order.includes(id))return;order.push(id);b.disabled=true;draw()},'play-token code-piece');tokens.set(id,b)});draw();button(actions,'إعادة الترتيب',()=>{order=[];tokens.forEach(b=>b.disabled=false);draw()});button(actions,'شغّل البرنامج',()=>{const actual=order.map(i=>task.lines[i]);answer(actual.length===task.lines.length&&actual.every((line,i)=>line===task.lines[i]))},'btn green')}
 function repair(){code(task.code);stage.append(element('p','اختر القطعة التي تحل محل ____ وتحقق المطلوب.','puzzle-input'));const rack=element('div','','code-toolbox');stage.append(rack);shuffle(task.options).forEach(text=>button(rack,text,()=>{codePreview.textContent=task.code.replace('____',text);answer(text===task.answer)},'play-token code-piece'));const codePreview=element('pre','ستظهر الشيفرة بعد اختيار القطعة.','code');stage.append(codePreview)}

 function getHint(){const hints=task.hints||[task.why];const text=hints[Math.min(hintStep,hints.length-1)];hintStep++;return text}
 active={get task(){return task},destroy(){ended=true;host.replaceChildren()},hint(){if(!ended&&!locked)c.message('تلميح '+Math.min(hintStep+1,(task.hints||[]).length||1)+': '+getHint(),true)}};render();return active;
}
window.IslandPlay={mount};
})();
