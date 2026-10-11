import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { once } from "node:events";

const root = process.cwd();
const mime = {
  ".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",
  ".png":"image/png",".jpeg":"image/jpeg",".jpg":"image/jpeg",
  ".webp":"image/webp",".woff2":"font/woff2"
};
const server = createServer(async (req,res)=>{
  try{
    const url = new URL(req.url,"http://127.0.0.1");
    const path=resolve(root, "."+(url.pathname==="/" ? "/index.html" : url.pathname));
    if(!(path===root || path.startsWith(root+sep)))throw Error("Path blocked");
    const bytes=await readFile(path);
    res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream"});
    res.end(bytes);
  }catch {res.writeHead(404);res.end("Not found")}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const port=server.address().port;
const browser=await chromium.launch({headless:true});
await mkdir("qa-screenshots",{recursive:true});
let failed=false;
try{
 for(const [type,width,height] of [["iphone",390,844],["narrow",320,700],["desktop",1440,900]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"load"});
  const results=await page.evaluate(()=>{
   const rect=(selector)=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}};
   return {
    hero:rect(".v3-hero"),title:rect(".v3-hero h1"),picture:rect(".v3-hero__portrait"),
    cards:document.querySelectorAll(".v3-feature-grid .v3-project").length,
    arrows:document.querySelectorAll(".v3-arrow").length,
    grain:document.querySelector(".grain")!==null,
    overflows:document.documentElement.scrollWidth>window.innerWidth+1,
    portraitLoaded:document.querySelector(".v3-hero__portrait img").complete&&document.querySelector(".v3-hero__portrait img").naturalWidth>0,
    watchLoaded:document.querySelector(".v3-project__watch-image").complete&&document.querySelector(".v3-project__watch-image").naturalWidth>0
   };
  });
  if (type === "iphone") {
    const debug = await page.evaluate(() => {
      const classes=[".v4-hero",".v4-hero__portrait",".v4-hero__portrait picture",".v4-hero__portrait img",".v4-hero__content"];
      return classes.map(k=>{
        const el=document.querySelector(k), cs=getComputedStyle(el), r=el.getBoundingClientRect();
        return {k,display:cs.display,position:cs.position,opacity:cs.opacity,visibility:cs.visibility,zIndex:cs.zIndex,background:cs.backgroundColor,animation:cs.animationName,box:[r.x,r.y,r.width,r.height],hit:document.elementFromPoint(200,180)?.className};
      });
    });
    console.log("DEBUG_V4", JSON.stringify(debug));
  }
  await page.screenshot({path:"qa-screenshots/"+type+"-home.png",fullPage:true});
  if (type === "iphone" || type === "desktop") {
    const preview = await page.screenshot({type:"jpeg",quality:46,fullPage:false});
    console.log("PORTFOLIO_V4_PREVIEW_"+type+"::"+preview.toString("base64"));
  }
  console.log(type,JSON.stringify({...results,errors}));
  if(results.cards!==3 || results.arrows<8 || results.grain || results.overflows || !results.portraitLoaded || !results.watchLoaded || errors.length)failed=true;
  if(width<=700 && (Math.abs(results.picture.top-results.hero.top)>1 || results.picture.height<340 || results.picture.height>450 || results.title.top<results.hero.top+240 || results.title.bottom>results.hero.bottom-120))failed=true;
  if(width===390){
    await page.locator(".v3-menu").click();
    if(await page.locator(".v3-nav.is-open").count()!==1)failed=true;
    await page.locator(".v3-nav").getByRole("link",{name:"All Work"}).click();
    await page.waitForURL("**/all-work.html");
    const count=await page.locator(".v3-archive-grid .v3-project").count();
    console.log("all-work cards:",count);
    if(count!==9)failed=true;
    await page.screenshot({path:"qa-screenshots/iphone-all-work.png",fullPage:true});
  }
  await context.close();
 }
  // Real motion opt-in: the projects must reveal during ordinary scrolling,
  // without locking or replacing native scroll.
  const motionContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:"no-preference"});
  const motionPage=await motionContext.newPage();
  await motionPage.goto("http://127.0.0.1:"+port+"/",{waitUntil:"load"});
  const firstCard=motionPage.locator(".v3-feature-grid .v3-project").first();
  const hiddenInitially=await firstCard.evaluate(e=>!e.classList.contains("is-visible"));
  await motionPage.evaluate(()=>window.scrollTo({top:document.querySelector("#selected-work").offsetTop+135,behavior:"instant"}));
  await motionPage.waitForTimeout(1550);
  const revealed=await firstCard.evaluate(e=>e.classList.contains("is-visible") && getComputedStyle(e.querySelector(".v3-project__meta")).opacity==="1");
  const projectShot=await motionPage.screenshot({type:"jpeg",quality:46,fullPage:false});
  console.log("PORTFOLIO_V4_PREVIEW_projects::"+projectShot.toString("base64"));
  console.log("ANIMATION_CHECK",JSON.stringify({hiddenInitially,revealed,scrollY:await motionPage.evaluate(()=>window.scrollY)}));
  if(!hiddenInitially || !revealed) failed=true;
  await motionContext.close();
}finally{await browser.close();server.close()}
if(failed)process.exitCode=1;else console.log("PASS: clear v4 headline, mobile portrait framing, three featured projects, nine archived, authentic watch, SVG arrows and no overflow");
