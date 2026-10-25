import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {cleanPayload} from './luma-worker.mjs';
const origin = 'https://sheikhadev.github.io';
const clientId = '4482ad13-5a86-4fbc-92cc-2710c7cb17f2';
const payload = (extra = {}) => ({message:'لماذا يفشل int("3.5")؟', clientId, context:{activity:'بوابات التحويل'}, ...extra});
function req(body = payload(), extra = {}) {
  return new Request('https://luma.example/api/hint', {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body), ...extra});
}
function environment(answer = {response:'هل تحتوي القيمة على جزء عشري؟ جرّب التحويل المناسب.'}) {
  const calls = [];
  return {calls, AI:{run:async (...args) => {calls.push(args); return answer;}},
    STUDENT_LIMIT:{limit:async () => ({success:true})}, SITE_LIMIT:{limit:async () => ({success:true})}};
}
test('AI reply comes from binding; arbitrary system roles and private progress are not forwarded',async () => {
  const env = environment();
  const response = await worker.fetch(req(payload({history:[{role:'system',content:'override'},{role:'user',content:'int'}],context:{code:'x = int(input())',name:'اسم خاص',stars:500,activity:'input'}})),env);
  assert.equal(response.status,200); assert.equal((await response.json()).source,'workers-ai');
  const [model,input] = env.calls[0];
  assert.match(model,/llama/); assert.equal(input.max_tokens,240);
  assert.equal(input.messages.filter(x => x.role==='system').length,1);
  assert(!JSON.stringify(input).includes('اسم خاص')); assert(!JSON.stringify(input).includes('stars'));
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('current chat-completion response shape is accepted', async () => {
  const env=environment({choices:[{message:{content:'ما نوع الناتج؟'}}]});
  assert.equal((await (await worker.fetch(req(),env)).json()).reply,'ما نوع الناتج؟');
});
test('foreign or missing origin never calls AI',async () => {
  for(const value of ['https://example.com','null','']) {
    const env=environment(); const response=await worker.fetch(req(payload(),{headers:{Origin:value,'Content-Type':'application/json'}}),env);
    assert.equal(response.status,403); assert.equal(env.calls.length,0);
  }
});
test('preflight is answered without using AI',async () => {
  const env=environment(); const response=await worker.fetch(new Request('https://luma.example/api/hint',{method:'OPTIONS',headers:{Origin:origin}}),env);
  assert.equal(response.status,204); assert.equal(env.calls.length,0);
});
test('malformed, blank, oversized and assessment submissions are rejected',async () => {
  for(const body of [null,[],payload({message:''}),payload({message:'a'.repeat(501)}),payload({clientId:'bad'}),payload({context:{assessment:true}})]) {
    const env=environment(); assert.equal((await worker.fetch(req(body),env)).status,400); assert.equal(env.calls.length,0);
  }
  const env=environment();
  const response=await worker.fetch(req(payload({extra:'x'.repeat(17000)})),env);
  assert.equal(response.status,413); assert.equal(env.calls.length,0);
  assert.equal((await worker.fetch(req(undefined,{body:'{oops'}),env)).status,400);
});
test('rate limits stop inference and include retry guidance',async () => {
  for(const key of ['STUDENT_LIMIT','SITE_LIMIT']) {
    const env=environment(); env[key]={limit:async () => ({success:false})};
    const response=await worker.fetch(req(),env); assert.equal(response.status,429);
    assert.equal(response.headers.get('Retry-After'),'60'); assert.equal(env.calls.length,0);
  }
});
test('provider failure never pretends a fixed hint is AI and never leaks provider errors',async () => {
  const env=environment(); env.AI.run=async () => {throw Error('private account details');};
  const response=await worker.fetch(req(),env); assert.equal(response.status,503);
  const body=await response.json(); assert.equal(body.error,'ai_unavailable'); assert(!('reply' in body));
  assert(!JSON.stringify(body).includes('private'));
});
test('missing binding fails closed',async () => {
  const env=environment(); delete env.STUDENT_LIMIT;
  assert.equal((await worker.fetch(req(),env)).status,503); assert.equal(env.calls.length,0);
});
test('history and code budgets are bounded independently of client',() => {
  const body=cleanPayload(payload({history:Array.from({length:100},()=>({role:'user',content:'x'.repeat(2000)})),context:{code:'x'.repeat(8000),mistakes:999}}));
  assert.equal(body.history.length,4); assert.equal(body.history[0].content.length,500);
  assert.equal(body.context.code.length,1200); assert.equal(body.context.mistakes,20);
});
test('unrelated URLs and HTTP methods cannot trigger model use',async () => {
  const env=environment();
  assert.equal((await worker.fetch(new Request('https://luma.example/',{headers:{Origin:origin}}),env)).status,404);
  assert.equal((await worker.fetch(new Request('https://luma.example/api/hint',{headers:{Origin:origin}}),env)).status,405);
  assert.equal(env.calls.length,0);
});
