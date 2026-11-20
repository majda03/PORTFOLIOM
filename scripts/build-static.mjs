import {cp,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await rm(root+'dist',{recursive:true,force:true});await mkdir(root+'dist',{recursive:true});
for(const name of ['index.html','all-work.html','studio.css','studio.js','work','assets','images','favicon.svg','robots.txt','sitemap.xml'])
 await cp(root+name,root+'dist/'+name,{recursive:true});
console.log('Static portfolio built.');
