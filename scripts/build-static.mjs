import {cp,mkdir,readdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await rm(root+'dist',{recursive:true,force:true});await mkdir(root+'dist',{recursive:true});
for(const entry of await readdir(root,{withFileTypes:true})){
 if(entry.name.startsWith('.')||['dist','scripts','README.md'].includes(entry.name))continue;
 await cp(root+entry.name,root+'dist/'+entry.name,{recursive:true});
}
console.log('Static portfolio built.');
