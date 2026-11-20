import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const pages=['index.html','all-work.html',...(await readdir(root+'work')).filter(p=>p.endsWith('.html')).map(p=>'work/'+p)];
let localReferences=0;
for(const page of pages){
 const html=await readFile(root+page,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${page}: one main heading`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,`${page}: duplicate IDs`);
 const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];
 assert.equal(canonical,'https://majdakapetanovic.com/'+(page==='index.html'?'':page),`${page}: canonical`);
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.ok(JSON.parse(m[1])['@type']||JSON.parse(m[1])['@graph']);
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const url=m[1];if(/^(https?:|mailto:|data:)/.test(url))continue;
  const [path,hash]=url.split('#');
  const file=path?resolve(root,path.startsWith('/')?'.'+path:path):root+page;
  const target=path==='/'?root+'index.html':file;
  const info=await stat(target).catch(()=>null);assert.ok(info,`${page}: missing local reference ${url}`);localReferences++;
  if(hash&&(target.endsWith('.html')||path==='/')){const destination=await readFile(target,'utf8');assert.ok(destination.includes(`id="${hash}"`),`${page}: missing anchor ${url}`);}
 }
}
const home=await readFile(root+'index.html','utf8');
assert.match(home,/action="https:\/\/formspree.io\/f\/maqlanry"/);
for(const name of ['name','email','message','service','_gotcha'])assert.ok(home.includes(`name="${name}"`),`Missing enquiry field ${name}`);
assert.match(home,/type="email"[^>]*required/);
assert.match(await readFile(root+'atelier.js','utf8'),/prefers-reduced-motion/);
assert.ok(home.includes('work/afterlight.html')&&home.includes('work/oddly-human.html'));
assert.ok(!home.includes('yourmail@example.com'));
console.log(`Passed: ${pages.length} pages, ${localReferences} local references, unique headings/IDs, metadata, anchors and contact contract.`);
