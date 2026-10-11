import { chromium } from "playwright";
import sharp from "sharp";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--disable-gpu-sandbox"]});
try {
 await mkdir("images",{recursive:true});
 for(const [name,width,height] of [["desktop",1440,900],["mobile",390,844]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1, reducedMotion:"reduce"});
  await page.goto("https://final-royal-cosmetics-2.vercel.app/",{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForTimeout(2200);
  const title=await page.title();
  const text=await page.locator("body").innerText();
  const images=await page.evaluate(()=>[...document.images].slice(0,14).map(i=>({alt:i.alt,src:i.currentSrc?.slice(0,220),width:i.naturalWidth})));
  console.log("ROYAL_PAGE",JSON.stringify({name,title,firstText:text.slice(0,900),images}));
  const preview=await page.screenshot({type:"jpeg",quality:46});
  console.log("ROYAL_PREVIEW_"+name+"::"+preview.toString("base64"));
  if(name==="desktop") {
   await sharp(preview).resize({width:1280}).webp({quality:84,effort:5}).toFile("images/royal-storefront.webp");
  }
  await page.close();
 }

 const detail=await browser.newPage({viewport:{width:1060,height:800},deviceScaleFactor:1,reducedMotion:"reduce"});
 await detail.goto("https://final-royal-cosmetics-2.vercel.app/images/products/royal-aurum.webp",{waitUntil:"load",timeout:60000});
 await detail.waitForTimeout(2100);
 const detailShot=await detail.screenshot({type:"jpeg",quality:50});
 console.log("ROYAL_DETAIL::"+detailShot.toString("base64"));
 const meta=await detail.evaluate(()=>({
   title:document.title,
   images:[...document.images].slice(0,8).map(x=>({src:x.currentSrc,width:x.naturalWidth,alt:x.alt}))
 }));
 console.log("ROYAL_DETAIL_META",JSON.stringify(meta));
 await detail.close();
}finally{await browser.close()}
