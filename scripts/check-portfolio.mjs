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
 for(const [type,width,height] of [["iphone",390,844],["narrow",320,700],["compact",390,690],["laptop",1366,768],["desktop",1440,900],["wide",1600,900]]){
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
    watchLoaded:document.querySelector(".v3-project__watch-image").complete&&document.querySelector(".v3-project__watch-image").naturalWidth>0,
    royalLoaded:document.querySelector(".v3-project--royal .v3-project__visual img").complete&&document.querySelector(".v3-project--royal .v3-project__visual img").naturalWidth>0,
    formConnected:document.querySelector("#project-enquiry")?.action==="https://formspree.io/f/maqlanry",
    formFields:["name","email","project_type","message","_subject","_gotcha"].every(n=>document.querySelector("#project-enquiry [name='"+n+"']")),
    studioProfile:!!document.querySelector('a[href="https://www.instagram.com/codedvibrations/"]'),
    upworkProfile:!!document.querySelector('a[href="https://www.upwork.com/freelancers/~017c87bd321f2e297f"]'),
    eyebrow:rect(".v4-hero__eyebrow")
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
  if(type==="desktop"){
    const align=await page.evaluate(()=>{
      const bounds=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}};
      return {aboutTitle:bounds(".v4-about__identity"),aboutText:bounds(".v4-about__story"),toolkitLabel:bounds(".v4-toolkit .v3-overline"),toolkitText:bounds(".v4-toolkit p"),contactForm:bounds("#project-enquiry"),portrait:bounds(".v4-hero__portrait"),viewport:innerWidth,rights:document.querySelector(".v4-footer__base")?.textContent.includes("ALL RIGHTS RESERVED.")};
    });
    console.log("DESKTOP_FINAL_ALIGNMENT",JSON.stringify(align));
    if(align.aboutText.left<=align.aboutTitle.right+25||Math.abs(align.aboutText.left-align.toolkitText.left)>2||!align.rights||align.portrait.right>align.viewport-22)failed=true;
  }
  const heroAlignment=await page.evaluate(()=>{
    const rect=selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),height:Math.round(r.height)};};
    return {cta:rect(".v4-hero__actions"),signature:rect(".v4-hero__signature"),eyebrow:rect(".v4-hero__eyebrow"),portrait:rect(".v4-hero__portrait"),hero:rect(".v4-hero"),signPosition:getComputedStyle(document.querySelector(".v4-hero__signature")).position};
  });
  console.log("HERO_ALIGN",type,JSON.stringify(heroAlignment));
  if(width<=700 && (heroAlignment.signPosition!=="static" || heroAlignment.signature.top<heroAlignment.cta.bottom+10 || heroAlignment.signature.bottom>heroAlignment.hero.bottom-10))failed=true;
  if(width>=1280 && height>=800 && Math.abs(heroAlignment.eyebrow.top-heroAlignment.portrait.top)>3)failed=true;
  if(type==="laptop" && Math.abs(heroAlignment.eyebrow.top-heroAlignment.portrait.top)>3)failed=true;
  await page.screenshot({path:"qa-screenshots/"+type+"-home.png",fullPage:true});
  if (type === "iphone" || type === "desktop") {
    const preview = await page.screenshot({type:"jpeg",quality:46,fullPage:false});
    console.log("PORTFOLIO_V4_PREVIEW_"+type+"::"+preview.toString("base64"));
  }
  console.log(type,JSON.stringify({...results,errors}));
  if(results.cards!==3 || results.arrows<8 || results.grain || results.overflows || !results.portraitLoaded || !results.watchLoaded || !results.royalLoaded || !results.formConnected || !results.formFields || !results.studioProfile || !results.upworkProfile || errors.length)failed=true;
  if(width<=700 && results.eyebrow.top < results.hero.top+results.picture.height*.70) failed=true;
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
  // Launch-candidate contract: short homepage; working project studies;
  // absolute canonical metadata, sitemap entries and accessible navigation.
  const launchContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const launchPage=await launchContext.newPage();
  const launchErrors=[];
  launchPage.on("pageerror",e=>launchErrors.push(e.message));
  const sm=await readFile(resolve(root,"sitemap.xml"),"utf8");
  for(const slug of ["offing-line","aurelis","royal-cosmetics"]){
    const path="/work/"+slug+".html";
    if(!sm.includes("https://majdakapetanovic.com"+path))failed=true;
    await launchPage.goto("http://127.0.0.1:"+port+path,{waitUntil:"load"});
    const checks=await launchPage.evaluate(()=>({
      title:document.title,
      h1:document.querySelectorAll("h1").length,
      canonical:document.querySelector('link[rel="canonical"]')?.href,
      image:document.querySelector(".v4-case-image img")?.complete && document.querySelector(".v4-case-image img")?.naturalWidth>0,
      copy:document.querySelectorAll(".v4-case-row").length,
      overflow:document.documentElement.scrollWidth>window.innerWidth+1
    }));
    console.log("CASE_STUDY",slug,JSON.stringify(checks));
    if(checks.h1!==1||!checks.canonical?.endsWith(path)||!checks.image||checks.copy!==3||checks.overflow)failed=true;
  }
  await launchPage.goto("http://127.0.0.1:"+port+"/",{waitUntil:"load"});
  const sharing=await launchPage.evaluate(async()=>{
    const image=document.querySelector('meta[property="og:image"]')?.content;
    const canonical=document.querySelector('link[rel="canonical"]')?.href;
    const metaDescription=document.querySelector('meta[name="description"]')?.content;
    const ogImage=new Image();
    ogImage.src=new URL(new URL(image).pathname,location.origin).href;
    await new Promise((resolve,reject)=>{ogImage.onload=resolve;ogImage.onerror=reject;});
    return {image,canonical,hasDescription:!!metaDescription,width:ogImage.naturalWidth,height:ogImage.naturalHeight};
  });
  console.log("SOCIAL_PREVIEW",JSON.stringify(sharing));
  if(sharing.width<600||sharing.height<315||!sharing.hasDescription||sharing.canonical!=="https://majdakapetanovic.com/")failed=true;
  const studies=await launchPage.locator(".v3-feature-grid .v4-case-link").count();
  const cssCount=await launchPage.locator('link[rel="stylesheet"][href*="portfolio"]').count();
  const fontUrl=await launchPage.locator('link[href*="fonts.googleapis.com/css2"]').getAttribute("href");
  console.log("LAUNCH_CHECK",JSON.stringify({studies,cssCount,fontUrl,errors:launchErrors}));
  if(studies!==3||cssCount!==1||fontUrl.includes("Italianno")||launchErrors.length)failed=true;
  await launchContext.close();
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
  // Inspect the finished Royal card itself, not an unrelated scroll position.
  await motionPage.locator(".v3-project--royal .v3-project__visual").scrollIntoViewIfNeeded();
  await motionPage.waitForTimeout(1100);
  const royalCardPreview=await motionPage.locator(".v3-project--royal .v3-project__visual").screenshot({type:"jpeg",quality:65});
  console.log("ROYAL_CARD_VISUAL::"+royalCardPreview.toString("base64"));
  // Process steps appear individually. The line responds to visibility.
  await motionPage.evaluate(()=>document.querySelector("#approach").scrollIntoView({behavior:"instant"}));
  await motionPage.waitForTimeout(1300);
  const steps=await motionPage.evaluate(()=>
    [...document.querySelectorAll(".v4-process-step")].map(e=>({
      visible:e.classList.contains("is-visible"),
      width:getComputedStyle(e,"::after").width,
      label:e.querySelector("h3")?.textContent?.trim()
    }))
  );
  console.log("PROCESS_MOTION",JSON.stringify(steps));
  if(!steps.some(e=>e.visible))failed=true;
  // Deterministic mock submission: no real email is sent.
  await motionPage.route("https://formspree.io/f/maqlanry",route=>route.fulfill({
    status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS"},body:JSON.stringify({ok:true})
  }));
  await motionPage.locator('[name="name"]').fill("Portfolio QA");
  await motionPage.locator('[name="email"]').fill("qa@example.invalid");
  await motionPage.locator('[name="project_type"]').selectOption({label:"Frontend development"});
  await motionPage.locator('[name="message"]').fill("Testing a draft portfolio enquiry locally; this request is mocked and never sent.");
  await motionPage.locator("#project-enquiry button[type=submit]").click();
  await motionPage.locator(".v3-form__status").getByText("Thank you. Your message has been sent.").waitFor({timeout:4000});
  console.log("FORMSPREE_QA","endpoint preserved, simulated success only, no live messages sent");
  // Also verify a failed provider response does NOT claim delivery.
  await motionPage.unroute("https://formspree.io/f/maqlanry");
  await motionPage.route("https://formspree.io/f/maqlanry",route=>route.fulfill({
    status:500,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS"},body:JSON.stringify({error:"Temporary error"})
  }));
  await motionPage.locator('[name="name"]').fill("Portfolio QA");
  await motionPage.locator('[name="email"]').fill("qa@example.invalid");
  await motionPage.locator('[name="project_type"]').selectOption({label:"Frontend development"});
  await motionPage.locator('[name="message"]').fill("Testing server failure response, with a fully mocked request, never sent.");
  await motionPage.locator("#project-enquiry button[type=submit]").click();
  await motionPage.locator(".v3-form__status").getByText("Something went wrong.",{exact:false}).waitFor({timeout:4000});
  console.log("FORMSPREE_FAILURE_QA","simulated 500 correctly shows failure, not success, no live messages sent");
  const projectShot=await motionPage.screenshot({type:"jpeg",quality:46,fullPage:false});
  console.log("PORTFOLIO_V4_PREVIEW_projects::"+projectShot.toString("base64"));
  console.log("ANIMATION_CHECK",JSON.stringify({hiddenInitially,revealed,scrollY:await motionPage.evaluate(()=>window.scrollY)}));
  if(!hiddenInitially || !revealed) failed=true;
  await motionContext.close();
}finally{await browser.close();server.close()}
if(failed)process.exitCode=1;else console.log("PASS: clear v4 headline, mobile portrait framing, three featured projects, nine archived, authentic watch, SVG arrows and no overflow");
