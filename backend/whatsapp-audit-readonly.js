"use strict";
// GET-only audit. Does not load the server, connect to MongoDB or submit messages.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const axios = require("axios");
const safeUrl = value => { try { const u=new URL(value);return `${u.origin}${u.pathname}`; } catch { return "invalid_url"; } };
const safeJson = value => { try { return typeof value === "string" ? JSON.parse(value) : value || {}; } catch { return {}; } };

async function registry() {
  const app = process.env.GUPSHUP_APP_ID || process.env.GUPSHUP_APP_NAME;
  if (!app || !process.env.GUPSHUP_API_KEY) return { verified: false, reason: "missing_app_or_api_key" };
  try {
    const records = [];
    for (let pageNo=0;pageNo<50;pageNo++) {
      const response=await axios.get(`https://api.gupshup.io/wa/app/${encodeURIComponent(app)}/template`, {
        headers:{apikey:process.env.GUPSHUP_API_KEY},params:{pageNo,pageSize:100},timeout:15000,
      });
      const page=response.data.templates;
      if(!Array.isArray(page))return {verified:false,reason:"unrecognized_registry_response"};
      records.push(...page);
      if(page.length<100)break;
    }
    const mapping=safeJson(process.env.GUPSHUP_TEMPLATE_IDS);
    Object.assign(mapping,{admin_new_order:process.env.WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID||"680c3021-6889-4c60-86b4-6ebb0c7d7b1b",customer_care:process.env.WHATSAPP_CUSTOMER_CARE_TEMPLATE_ID||"e0d25b52-b236-4551-b5d9-06fd3fd76f40"});
    return {verified:true,templates:Object.entries(mapping).map(([name,id])=>{
      const record=records.find(t=>t.id===id);
      if(!record)return {name,id,found:false};
      const meta=safeJson(record.containerMeta);
      return {name,id,found:true,status:record.status,language:record.languageCode,type:record.templateType,
        parameterOccurrences:(String(record.data||"").match(/\{\{\d+\}\}/g)||[]),
        components:meta.components||null,buttons:meta.buttons||null,
        note:"Compare body and URL-button placeholders separately; registry metadata varies by template version."};
    })};
  }catch(error){return {verified:false,httpStatus:error.response?.status||null,code:error.code||"request_failed",reason:"registry_access_failed"};}
}

async function media(key,url) {
  try {
    const response=await axios.get(url,{headers:{Range:"bytes=0-255"},responseType:"stream",timeout:15000,maxRedirects:3});
    const chunk=await new Promise((resolve,reject)=>{response.data.once("data",resolve);response.data.once("error",reject);response.data.once("end",()=>resolve(Buffer.alloc(0)));});
    response.data.destroy();
    const type=String(response.headers["content-type"]||"").split(";")[0];
    const signature=chunk.subarray(0,16).toString("hex");
    const supported=type==="image/png"&&signature.startsWith("89504e47") || type==="image/jpeg"&&signature.startsWith("ffd8ff") || type==="video/mp4"&&chunk.subarray(4,8).toString()==="ftyp" || type==="application/pdf"&&chunk.subarray(0,5).toString()==="%PDF-";
    return {key,url:safeUrl(url),httpStatus:response.status,type,supported,bytes:response.headers["content-range"]||response.headers["content-length"],signature};
  }catch(error){return {key,url:safeUrl(url),supported:false,httpStatus:error.response?.status||null,code:error.code||"request_failed"};}
}

(async()=>{
  const urls=Object.entries(process.env).filter(([key])=>/^WHATSAPP_.*(?:VIDEO|IMAGE)_URL$/.test(key));
  for(const [key,entry] of Object.entries(safeJson(process.env.WHATSAPP_TEMPLATE_MEDIA)))urls.push([key,entry.url]);
  const [templates,...assets]=await Promise.all([registry(),...urls.map(([key,url])=>media(key,url))]);
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),templates,media:assets},null,2));
  if(!templates.verified||assets.some(asset=>!asset.supported))process.exitCode=1;
})().catch(error=>{console.error(JSON.stringify({code:error.code||"audit_failed"}));process.exitCode=1;});
