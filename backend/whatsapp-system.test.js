"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { ObjectId } = require("mongodb");
const { createDatabase } = require("./whatsapp-test-db");
const parser = require("./whatsapp-inbound");
Object.assign(process.env, { NODE_ENV: "test", MONGO_URI: "mongodb://127.0.0.1:1/isolated", OPENROUTER_API_KEY: "mock", RAZORPAY_KEY_ID: "mock", RAZORPAY_KEY_SECRET: "mock", GUPSHUP_API_KEY: "mock", GUPSHUP_APP_NAME: "mock", GUPSHUP_SOURCE_NUMBER: "919999999999", TRACKING_TOKEN_SECRET: "test-only", ORDER_ADMIN_TOKEN: "test-admin", PUBLIC_SITE_URL: "https://liquidspice.in", WHATSAPP_VELVETY_BUTTER_VIDEO_URL: "https://liquidspice.in/whatsapp/tutorial.mp4", WHATSAPP_LID_OPENING_VIDEO_URL: "https://liquidspice.in/whatsapp/open-the-lid.mp4", WHATSAPP_TUTORIAL_FOLLOWUP_DELAY_MS: "2000" });
process.env.WHATSAPP_COD_PREPAID_TEMPLATE_ID = "515b2202-ab03-4fb3-a2de-32f896d04953";
// Block all provider/AI HTTP traffic; outbound WhatsApp submission is mocked below.
const axios = require("axios");
axios.defaults.adapter = async () => { throw new Error("Unexpected external HTTP in isolated test"); };
const api = require("./server")._test;
process.env.WHATSAPP_WEBHOOK_TOKEN = "isolated-inbound-secret";
const config = {
  NEW_LEAD: "valour_new_lead", PRODUCT_DEMO: "valour_product_demo", HIGH_INTENT: "valour_high_intent", PRICE_DELIVERY: "valour_price_delivery", CHECKOUT_REMINDER: "valour_checkout_reminder", ORDER: "valour_order_confirmation", COD: "valour_cod_confirmation", ORDER_STATUS: "valour_order_status", DELIVERED: "valour_delivered", COOKING_REMINDER: "valour_cooking_reminder", POST_COOK: "valour_post_cook_feedback", REVIEW: "valour_review_request", REORDER: "valour_reorder_reminder",
};
const imageNames = Object.values(config).filter(n=>!['valour_cooking_reminder','valour_post_cook_feedback','valour_review_request'].includes(n));
for (const [key,value] of Object.entries(config)) process.env[`WHATSAPP_${key}_TEMPLATE_NAME`] = value;
process.env.WHATSAPP_TEMPLATE_MEDIA = JSON.stringify(Object.fromEntries(imageNames.map(n=>[n,{type:"image",url:"https://liquidspice.in/whatsapp/test.png"}])));
process.env.GUPSHUP_TEMPLATE_IDS = JSON.stringify(Object.fromEntries(Object.values(config).map((n,i)=>[n,`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`])));
process.env.WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID="680c3021-6889-4c60-86b4-6ebb0c7d7b1b";
const phone="919876543210";
let db, sent, failure, serial=0;
axios.post=async (url,form)=>{
  assert.match(url,/^https:\/\/api\.gupshup\.io\/wa\/api\/v1\/(template\/)?msg$/);
  const fields=Object.fromEntries(form); const payload={destination:fields.destination,message:fields.message?JSON.parse(fields.message):null,template:fields.template?JSON.parse(fields.template):null};
  if(failure){const result=await failure(payload);if(result)return result;}
  payload.providerId=`provider-${++serial}`;sent.push(payload);return {data:{status:"submitted",messageId:payload.providerId}};
};
function fresh(){db=createDatabase();sent=[];failure=null;api.setDatabaseForTests(db);return db;}
const rows=name=>db.collection(name).rows;
const session=()=>rows('sessions').find(s=>s.active);
const textPayload=(text,id=`in-${++serial}`,from=phone)=>({entry:[{changes:[{value:{messages:[{id,from,type:"text",text:{body:text}}]}}]}]});
const tapPayload=(text,id=`in-${++serial}`,from=phone)=>({type:"message",payload:{id,source:from,type:"quick_reply",payload:{payload:{postbackText:text,title:"Button"}}}});
const receive=text=>api.dispatchWhatsappWebhook(textPayload(text));
const tap=text=>api.dispatchWhatsappWebhook(tapPayload(text));
function order(overrides={}) {const value={_id:new ObjectId(),orderNumber:"VALOUR-ABC123",phone,shippingStatus:"Confirmed",paymentStatus:"paid",pincode:"799003",totalAmount:350,products:[{name:"Velvety Butter Chicken Liquid Spice",quantity:1}],createdAt:new Date(Date.now()-86400000),...overrides};rows('orders').push(value);return value;}

test("parses all provider shapes, nested IDs, titles, punctuation and exact issue text",()=>{
  for(const shape of [
    {text:{body:"  VIDEO 🎬! "}}, {button:{payload:"VIDEO",text:"ignore"}},
    {button:{text:"Watch Video"}}, {interactive:{button_reply:{id:"VIDEO",title:"Watch Video"}}},
    {interactive:{list_reply:{id:"MENU_COOK",title:"Cooking"}}},
    {gupshupPayload:{type:"quick_reply",payload:{payload:{payload:{postbackText:"VIDEO"}}}}},
    {gupshupPayload:{type:"list_reply",payload:{id:"opaque",description:"Watch cooking demo"}}},
  ]) assert.equal(parser.readInbound(shape).action,"MENU_COOK");
  assert.equal(parser.readInbound({text:{body:"Customer care did not help with the broken lid"}}).action,null);
  assert.equal(parser.parseNative({type:"message-event",payload:{type:"failed",id:"x",payload:{text:"hi"}}}).message,null);
});

test("batched greetings, duplicate webhooks and canonical phone queues",async()=>{
  fresh(); const payload=textPayload("Hi","same");
  await Promise.all([api.dispatchWhatsappWebhook(payload),api.dispatchWhatsappWebhook(payload)]);
  assert.equal(rows('messages').filter(m=>m.message_id==='same').length,1);
  assert.equal(sent.filter(m=>m.message?.msgid==='valour_main_menu').length,1);
  const batch=textPayload("Hello"); batch.entry[0].changes[0].value.messages.push({id:"batch2",from:phone,type:"text",text:{body:"MENU"}});
  await api.dispatchWhatsappWebhook(batch);
  assert.equal(sent.filter(m=>m.message?.msgid==='valour_main_menu').length,3);
});

test("explore sends image, description and supported navigation; order online and old Back interrupt support",async()=>{
  fresh();await tap("MENU_EXPLORE");assert.equal(session().current_state,"product_details");
  assert.equal(sent.at(-2).message.type,"image");
  assert.deepEqual(sent.at(-1).message.options.map(o=>o.type),['text','text','text']);
  assert.ok(rows('message_jobs').some(j=>j.trigger==='product_demo'));
  await tap("Need Help");await tap("Order online");
  assert.match(sent.at(-1).message.text,/https:\/\/liquidspice\.in\/#velvety-butter-chicken/);
  await tap("Need Help");await tap("PRODUCT_BACK");assert.equal(session().current_state,"idle");
});

test("all video labels interrupt stale states; tutorial Done schedules feedback once",async()=>{
  fresh();
  for(const label of ["Cooking Video","Watch Video","Watch cooking demo","VIDEO","PRODUCT_START_COOKING"]){
    await tap("Need Help");await tap(label);assert.equal(session().current_state,"guided_cooking");
    assert.equal(sent.at(-2).message.type,"video");assert.equal(sent.at(-1).message.options[0].postbackText,"DONE");
  }
  await tap("Done");const count=rows('cooking_outcomes').length;await tap("Done");assert.equal(rows('cooking_outcomes').length,count);
  assert.equal(session().current_state,"post_cook_feedback");
  assert.ok(rows('message_jobs').some(j=>j.trigger==='post_cook_feedback'&&j.status==='cancelled'));
  assert.equal(rows('message_jobs').filter(j=>j.jobKey.includes('customer-completed')).length,1);
});

test("no-Done fallback flows through worker, approved-contract payload, callback and feedback review",async()=>{
  fresh();const own=order();await tap("VIDEO");
  const job=rows('message_jobs').find(j=>j.trigger==='post_cook_feedback');job.scheduledAt=new Date(0);
  // Leave unrelated marketing jobs in the future.
  rows('message_jobs').filter(j=>j!==job).forEach(j=>j.scheduledAt=new Date(Date.now()+86400000));
  await api.processDueWhatsappJobs();assert.equal(job.status,"submitted");assert.equal(session().current_state,"post_cook_feedback");
  assert.deepEqual(sent.at(-1).template.params,[]);
  await api.dispatchWhatsappWebhook({type:"message-event",payload:{type:"delivered",id:job.providerMessageId,ts:Date.now()}});
  assert.equal(job.status,"delivered");
  await tap("Loved it ❤️");assert.match(sent.at(-1).message.text,/review/);assert.ok(rows('cooking_outcomes').some(o=>o.feedbackType==='loved_it'));
  await tap("Could be better");assert.match(sent.at(-1).message.text,/improve/);assert.ok(own);
});

test("support issue text is saved, both fixed admins notified; forged actions disclose no data",async()=>{
  fresh();order({customerName:"Private customer"});process.env.WHATSAPP_CUSTOMER_CARE_PHONES="919111111111";
  await tap("Need Help");await receive("Customer care needs to help me with a broken lid");
  assert.equal(rows('support_cases').length,1);
  assert.deepEqual(sent.filter(x=>x.template).map(x=>x.destination).sort(),['917005328132','919233054806']);
  assert.ok(sent.filter(x=>x.template).every(x=>x.template.params.length===5));
  await tap("MENU_TRACK");await receive("VALOUR-ABC123");assert.match(sent.at(-1).message.text,/VALOUR order update/);
  const before=sent.length;await api.dispatchWhatsappWebhook(tapPayload(`ADMIN_ORDER_${rows('orders')[0]._id}`,undefined,"919111111111"));
  assert.ok(!JSON.stringify(sent.slice(before)).includes("Private customer"));
});

test("tracking denies foreign references and recovery from another phone",async()=>{
  fresh();order({phone:"919000000000",orderNumber:"VALOUR-SECRET"});await tap("MENU_TRACK");await receive("VALOUR-SECRET");
  assert.match(sent.at(-1).message.text,/could not find/);
  await receive("HELP");assert.equal(session().current_state,"tracking_awaiting_lookup_details");
  await receive("9000000000, 799003");assert.match(sent.at(-1).message.content.text,/privacy/);
  assert.ok(!JSON.stringify(sent).includes('VALOUR order update'));
});

test("lid button interrupts support; media rejection yields an actionable fallback",async()=>{
  fresh();await tap("Need Help");await tap("How to open the lid? 🫙");assert.equal(sent.at(-1).message.url,process.env.WHATSAPP_LID_OPENING_VIDEO_URL);
  failure=p=>p.message?.type==='image'?{data:{status:'error'}}:null;
  await tap("MENU_EXPLORE");assert.equal(sent.at(-2).message.type,"text");assert.equal(sent.at(-1).message.type,"quick_reply");
  failure=p=>p.message?.type==='video'?{data:{status:'error'}}:null;
  await tap("VIDEO");assert.match(sent.at(-1).message.text,/temporarily unavailable/);
});

test("admin recent list, selected order, return and support commands authorize each sender",async()=>{
  fresh();const own=order();const admin="917005328132";
  await api.dispatchWhatsappWebhook(textPayload("orders",undefined,admin));assert.equal(sent.at(-1).message.msgid,'valour_admin_recent_orders');
  await api.dispatchWhatsappWebhook(tapPayload(`ADMIN_ORDER_${own._id}`,undefined,admin));assert.match(sent.at(-1).message.content.text,/VALOUR order details/);
  await api.dispatchWhatsappWebhook(tapPayload('ADMIN_RECENT_ORDERS',undefined,admin));assert.equal(sent.at(-1).message.msgid,'valour_admin_recent_orders');
  rows('support_cases').push({_id:new ObjectId(),case_id:'VLR-TEST123',status:'open',phone,details:'Damaged jar'});
  await api.dispatchWhatsappWebhook(textPayload('DONE VLR-TEST123',undefined,admin));assert.equal(rows('support_cases')[0].status,'resolved');
  await api.dispatchWhatsappWebhook(textPayload('REOPEN VLR-TEST123',undefined,'919111111111'));assert.equal(rows('support_cases')[0].status,'resolved');
});

test("template IDs/counts and sanitization protect signed links",async()=>{
  fresh();assert.equal(api.getGupshupTemplateId('1071618388950122','en_US'),'680c3021-6889-4c60-86b4-6ebb0c7d7b1b');
  assert.throws(()=>api.getGupshupTemplateId('1234567890123','en_US'),/internal/);
  const link='https://liquidspice.in/track?t=ab%2Bcd.X_y-9&v=1';
  assert.equal(api.sanitizeWhatsappTemplateParameter(link),link);
  await api.sendTemplateMessage(phone,'valour_cooking_reminder','en_US',['Hello\n\t  world']);assert.deepEqual(sent.at(-1).template.params,['Hello world']);
  await assert.rejects(api.sendTemplateMessage(phone,'valour_cooking_reminder','en_US',[]),/requires 1/);
});

test("admin dashboard sends only configured templates with validation, idempotency and callback tracking",async()=>{
  fresh();const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/admin/whatsapp/templates`;
  const headers={'content-type':'application/json','x-admin-token':'test-admin'};
  try {
    assert.equal((await fetch(base)).status,401);
    const catalogResponse=await fetch(base,{headers});assert.equal(catalogResponse.status,200);
    const catalog=await catalogResponse.json();
    assert.ok(catalog.templates.some(item=>item.key==='cooking_reminder'&&item.available&&item.parameterCount===1));
    assert.match(catalog.templates.find(item=>item.key==='cod_prepaid_confirmation').bodyText,/No payment will be collected at delivery/);
    const invalid=await fetch(`${base}/send`,{method:'POST',headers,body:JSON.stringify({requestId:'manual-invalid-1',templateKey:'cooking_reminder',phone:'123',parameters:['Butter Chicken']})});
    assert.equal(invalid.status,400);
    const payload={requestId:'manual-send-123',templateKey:'cooking_reminder',phone:'+91 98765 43210',parameters:['Butter Chicken']};
    const first=await fetch(`${base}/send`,{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(first.status,201);
    const firstBody=await first.json();assert.equal(firstBody.send.status,'submitted');assert.equal(sent.length,1);
    assert.equal(rows('admin_template_sends')[0].phone,phone);
    const duplicate=await fetch(`${base}/send`,{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(duplicate.status,200);
    assert.equal((await duplicate.json()).duplicate,true);assert.equal(sent.length,1);
    await api.recordWhatsappJobStatus({id:firstBody.send.providerMessageId,status:'delivered',timestamp:Date.now()});
    assert.equal(rows('admin_template_sends')[0].status,'delivered');
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test("admin conversation list supports messages without a matching user profile",async()=>{
  fresh();
  rows('messages').push({
    _id:new ObjectId(),
    user_id:new ObjectId(),
    phone,
    role:'user',
    type:'text',
    content:'Hello',
    message_id:'orphan-profile-message',
    created_at:new Date(),
  });
  const server=api.app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/admin/whatsapp/conversations`,{
      headers:{'x-admin-token':'test-admin'},
    });
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.conversations.length,1);
    assert.equal(body.conversations[0].customerName,'WhatsApp customer');
    assert.equal(body.conversations[0].phone,phone);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test("atomic job claim, definite rejection retry, uncertainty quarantine and expired claim recovery",async()=>{
  fresh();await api.scheduleWhatsappJob({event:'cooking_reminder',phone,parameters:['Butter Chicken'],scheduledAt:new Date(Date.now()+60000)});
  const job=rows('message_jobs')[0];job.scheduledAt=new Date(0);
  await Promise.all([api.processDueWhatsappJobs(),api.processDueWhatsappJobs()]);assert.equal(sent.length,1);
  assert.equal(job.status,'submitted');
  await api.scheduleWhatsappJob({event:'cooking_reminder',phone,parameters:['Butter Chicken'],occurrence:'timeout',scheduledAt:new Date(Date.now()+60000)});
  const uncertain=rows('message_jobs')[1];uncertain.scheduledAt=new Date(0);
  failure=()=>{throw Object.assign(new Error('timeout'),{code:'ETIMEDOUT',request:{}});};
  await api.processDueWhatsappJobs();assert.equal(uncertain.status,'delivery_unknown');
  const old=new Date(Date.now()-11*60000);
  rows('message_jobs').push({_id:new ObjectId(),status:'processing',processingStartedAt:old,providerMessageId:null});
  rows('message_jobs').push({_id:new ObjectId(),status:'processing',processingStartedAt:old,submissionStartedAt:old});
  await api.recoverStuckWhatsappJobs();assert.equal(rows('message_jobs')[2].status,'scheduled');assert.equal(rows('message_jobs')[3].status,'delivery_unknown');
});

test("callbacks arriving before persistence reconcile; out-of-order statuses never regress",async()=>{
  fresh();await api.recordWhatsappJobStatus({id:'early',status:'read',timestamp:Date.now()});
  rows('message_jobs').push({_id:new ObjectId(),providerMessageId:'early',status:'submitted'});
  rows('messages').push({_id:new ObjectId(),provider_message_id:'early',direction:'outbound',delivery_status:'submitted'});
  await api.recordWhatsappJobStatus({id:'early',status:'read',timestamp:Date.now()});
  await api.recordWhatsappJobStatus({id:'early',status:'sent',timestamp:Date.now()});
  assert.equal(rows('message_jobs')[0].status,'read');assert.equal(rows('messages')[0].delivery_status,'read');assert.equal(rows('whatsapp_status_events').length,2);
});

test("delivery callbacks also match the WhatsApp ID learned from enqueued status",async()=>{
  fresh();
  rows('message_jobs').push({_id:new ObjectId(),providerMessageId:'gupshup-1',status:'submitted'});
  rows('messages').push({_id:new ObjectId(),provider_message_id:'gupshup-1',direction:'outbound',delivery_status:'submitted'});
  await api.recordWhatsappJobStatus({id:'gupshup-1',whatsappMessageId:'wa-1',status:'enqueued',timestamp:Date.now()});
  await api.recordWhatsappJobStatus({id:'wa-1',status:'delivered',timestamp:Date.now()});
  assert.equal(rows('message_jobs')[0].status,'delivered');
  assert.equal(rows('messages')[0].delivery_status,'delivered');
});

test("checkout/payment, reorder and support quality gates cancel obsolete jobs",async()=>{
  fresh();const own=order();const base={templateName:'valour_cooking_reminder',parameters:['dish'],phone,orderId:own._id,createdAt:new Date(),kind:'transactional'};
  assert.equal((await api.runWhatsappQualityGate({...base,trigger:'checkout_reminder'})).reason,'payment_completed');
  assert.equal((await api.runWhatsappQualityGate({...base,trigger:'delivered_ready_to_cook'})).reason,'order_not_delivered');
  order({createdAt:new Date()});assert.equal((await api.runWhatsappQualityGate({...base,trigger:'reorder_reminder'})).reason,'customer_reordered');
});

test("new order alert uses six parameters, fixed UUID, both admins and no duplicate claims",async()=>{
  fresh();const own=order();await api.notifyWhatsappAdminsOfNewOrder(own);await api.notifyWhatsappAdminsOfNewOrder(own);
  assert.equal(sent.length,2);assert.ok(sent.every(p=>p.template.id==='680c3021-6889-4c60-86b4-6ebb0c7d7b1b'&&p.template.params.length===6));
});

test("dashboard Delivered schedules dedicated invitation at 15 minutes and reorder at 7 days",async()=>{
  fresh();const own=order();const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}/api/orders/${own.orderNumber}/shipping-status`;
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-admin-token':'test-admin'},body:JSON.stringify({shippingStatus:'Delivered',notifyWhatsapp:true})});
    assert.equal(response.status,200);const result=await response.json();assert.equal(result.whatsappUpdate.event,'delivered_ready_to_cook');
    assert.ok(!rows('message_jobs').some(j=>j.trigger==='order_status_update'));
    const invitation=rows('message_jobs').find(j=>j.trigger==='delivered_ready_to_cook');assert.ok(+invitation.scheduledAt>=Date.now()+14*60000);
    const reorder=rows('message_jobs').find(j=>j.trigger==='reorder_reminder');assert.ok(+reorder.scheduledAt>=Date.now()+7*86400000-1000);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("pending inbound survives restart; interrupted handlers are not replayed",async()=>{
  fresh();await api.persistWhatsappWebhook(textPayload('Hi','persisted'));
  assert.equal(sent.length,0);await api.drainWhatsappInbox();assert.equal(rows('whatsapp_inbox')[0].status,'completed');
  await api.drainWhatsappInbox();assert.equal(sent.length,1);
  rows('whatsapp_inbox').push({_id:new ObjectId(),eventId:'interrupted',phone,message:{id:'interrupted',from:phone,text:{body:'MENU'}},status:'processing',startedAt:new Date(Date.now()-180000)});
  await api.drainWhatsappInbox();assert.equal(rows('whatsapp_inbox')[1].status,'needs_review');assert.equal(sent.length,1);
});

test("definite template rejection permits fresh attempt; timeout does not resend",async()=>{
  fresh();const options={event:'cooking_reminder',phone,parameters:['Butter Chicken'],scheduledAt:new Date(Date.now()+60000)};
  await api.scheduleWhatsappJob(options);const job=rows('message_jobs')[0];job.scheduledAt=new Date(0);
  failure=()=>({data:{status:'error'}});await api.processDueWhatsappJobs();assert.equal(job.status,'failed');
  failure=null;await api.scheduleWhatsappJob(options);assert.equal(job.status,'scheduled');job.scheduledAt=new Date(0);await api.processDueWhatsappJobs();assert.equal(job.status,'submitted');
  const repeated=await api.scheduleWhatsappJob(options);assert.equal(repeated.scheduled,false);assert.equal(sent.length,1);
});

test("early delivery callback before send returns is correlated to direct outbound",async()=>{
  fresh();failure=async()=>{await api.recordWhatsappJobStatus({id:'race-provider',status:'delivered',timestamp:Date.now()});return {data:{status:'submitted',messageId:'race-provider'}};};
  await api.sendTemplateMessage(phone,'valour_cooking_reminder','en_US',['Butter Chicken']);
  assert.equal(rows('messages')[0].delivery_status,'delivered');
});

test("paid-order scheduling deduplicates and cancels checkout; COD/status/review contracts produce outbound payloads",async()=>{
  fresh();const own=order();
  await api.scheduleWhatsappJob({event:'checkout_reminder',phone,order:own,parameters:['dish','Rs. 350'],scheduledAt:new Date(Date.now()+3600000)});
  await api.schedulePaidOrderAutomation(own);await api.schedulePaidOrderAutomation(own);
  assert.equal(rows('message_jobs').filter(j=>j.trigger==='order_confirmation').length,1);
  assert.equal(rows('message_jobs').find(j=>j.trigger==='checkout_reminder').status,'cancelled');
  await api.sendTemplateMessage(phone,'valour_cod_confirmation','en_US',api.getCodTemplateParams({...own,paymentMethod:'cod',paymentStatus:'pending_cod'}));
  assert.equal(sent.at(-1).template.params.length,5);assert.equal(sent.at(-1).message.type,'image');
  await api.sendTemplateMessage(phone,'valour_order_status','en_US',api.getOrderStatusTemplateParams(own));assert.equal(sent.at(-1).template.params.length,6);
  await api.sendReviewRequestWhatsapp(own);assert.deepEqual(sent.at(-1).template.params,[]);
  // Drain immediate workers before the next isolated database is installed.
  await new Promise(resolve=>setImmediate(resolve));await api.processDueWhatsappJobs();
});

test("stale support list title and recovery Help can switch funnels",async()=>{
  fresh();await tap('MENU_EXPLORE');await api.dispatchWhatsappWebhook({type:'message',payload:{id:'old-list',source:phone,type:'list_reply',payload:{id:'opaque',title:'Return or refund'}}});
  assert.equal(session().current_state,'support_awaiting_order_id');assert.equal(session().support_category.key,'return_refund');
  await tap('MENU_TRACK');await tap('HELP');assert.equal(session().current_state,'tracking_awaiting_lookup_details');await tap('NEED_HELP');assert.equal(session().current_state,'support_awaiting_details');
});

test("dashboard status action fails closed without admin configuration",async()=>{
  fresh();const own=order();const token=process.env.ORDER_ADMIN_TOKEN;delete process.env.ORDER_ADMIN_TOKEN;
  const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/orders/${own.orderNumber}/shipping-status`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({shippingStatus:'Delivered'})});assert.equal(response.status,401);assert.equal(rows('message_jobs').length,0);}
  finally{process.env.ORDER_ADMIN_TOKEN=token;await new Promise(resolve=>server.close(resolve));}
});

test("support retries only the definitely failed admin and correlates each recipient callback",async()=>{
  fresh();failure=p=>p.destination==='917005328132'?{data:{status:'error'}}:null;
  await tap('Need Help');await receive('The jar arrived damaged and leaking');
  const support=rows('support_cases')[0];assert.equal(support.adminAlerts['917005328132'].status,'failed');assert.equal(support.adminAlerts['919233054806'].status,'submitted');
  failure=null;const previous=sent.length;await api.notifyCustomerCareAdmins({caseId:support.case_id,user:{},phone,details:support.details});
  assert.equal(sent.length,previous+1);assert.equal(sent.at(-1).destination,'917005328132');
  await api.recordWhatsappJobStatus({id:sent.at(-1).providerId,status:'delivered',timestamp:Date.now()});assert.equal(support.adminAlerts['917005328132'].status,'delivered');
});

test("typed video remains a navigation fallback inside support; exploratory reminders are cancelled",async()=>{
  fresh();await tap('MENU_EXPLORE');await tap('Need Help');await receive('VIDEO');assert.equal(session().current_state,'guided_cooking');
  assert.ok(rows('message_jobs').filter(j=>['product_demo','high_intent_followup'].includes(j.trigger)).every(j=>j.status==='cancelled'));
  await tap('Order online');assert.ok(rows('message_jobs').filter(j=>j.trigger==='post_cook_feedback').every(j=>j.status==='cancelled'));
});

test("missing provider ID is uncertain even when HTTP submission succeeds",async()=>{
  fresh();await api.scheduleWhatsappJob({event:'cooking_reminder',phone,parameters:['Butter Chicken'],scheduledAt:new Date(Date.now()+60000)});
  rows('message_jobs')[0].scheduledAt=new Date(0);failure=()=>({data:{status:'submitted'}});await api.processDueWhatsappJobs();assert.equal(rows('message_jobs')[0].status,'delivery_unknown');
});

test("signed payment captured webhook reaches paid-confirmation queue without claiming too early",async()=>{
  fresh();const own=order();const paymentId='order_mock123';rows('payment_attempts').push({_id:new ObjectId(),phone,razorpayOrderId:paymentId,completedOrderId:own._id});
  process.env.RAZORPAY_WEBHOOK_SECRET='isolated-webhook-secret';
  const body=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_mock123',order_id:paymentId}}}});
  const signature=require('crypto').createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/payment/webhook`,{method:'POST',headers:{'content-type':'application/json','x-razorpay-signature':signature},body});assert.equal(response.status,200);
    await new Promise(resolve=>setImmediate(resolve));await api.processDueWhatsappJobs();
    assert.equal(rows('message_jobs').filter(j=>j.trigger==='order_confirmation').length,1);assert.equal(rows('payment_attempts')[0].paymentStatus,'paid');
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("successful COD payment link uses the dedicated prepaid-conversion template",async()=>{
  fresh();
  const own=order({
    paymentStatus:'pending_cod', paymentMethod:'cod',
    paymentMethodLabel:'Cash on Delivery',
    paymentConversion:'cod_to_prepaid',
    razorpayPaymentLinkId:'plink_cod_conversion',
  });
  process.env.RAZORPAY_WEBHOOK_SECRET='isolated-webhook-secret';
  const body=JSON.stringify({
    event:'payment_link.paid',
    payload:{
      payment_link:{entity:{id:'plink_cod_conversion'}},
      payment:{entity:{id:'pay_cod_conversion',method:'upi'}},
    },
  });
  const signature=require('crypto').createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/payment/webhook`,{method:'POST',headers:{'content-type':'application/json','x-razorpay-signature':signature},body});
    assert.equal(response.status,200);
    await new Promise(resolve=>setImmediate(resolve));await api.processDueWhatsappJobs();
    assert.equal(own.paymentStatus,'paid');assert.equal(own.paymentMethod,'Prepaid');
    const conversion=rows('message_jobs').find(j=>j.trigger==='cod_prepaid_confirmation');
    assert.ok(conversion);assert.equal(conversion.templateName,'515b2202-ab03-4fb3-a2de-32f896d04953');
    assert.deepEqual(conversion.parameters.slice(0,2),['VALOUR-ABC123','Rs. 350']);
    assert.equal(conversion.parameters.length,3);
    assert.equal(api.readOrderTrackingToken(conversion.parameters[2]),String(own._id));
    assert.ok(!rows('message_jobs').some(j=>j.trigger==='order_confirmation'));
    const outbound=sent.find(item=>item.template?.id==='515b2202-ab03-4fb3-a2de-32f896d04953');
    assert.ok(outbound);assert.equal(outbound.template.params.length,3);assert.equal(outbound.message,null);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("phone lease prevents simultaneous handlers from separate server instances",async()=>{
  const database=createDatabase();const create=require('./whatsapp-inbox').createWhatsappInbox;
  let release, entered=0;const gate=new Promise(resolve=>release=resolve);
  const options={collection:name=>database.collection(name),log:()=>{},process:async()=>{entered++;await gate;}};
  const first=create(options),second=create(options);const a={id:'lease-a',from:phone},b={id:'lease-b',from:phone};await first.persist([a,b]);
  const running=first.run(a);await new Promise(resolve=>setImmediate(resolve));await second.run(b);assert.equal(entered,1);release();await running;await second.run(b);assert.equal(entered,2);
});

test("support admin STATUS, PENDING and REOPEN persist correct states",async()=>{
  fresh();const support={_id:new ObjectId(),case_id:'VLR-COMMANDS',status:'resolved',phone,details:'Damaged jar'};rows('support_cases').push(support);
  for(const [command,status] of [['PENDING','pending'],['REOPEN','open'],['STATUS','open']]){
    await api.dispatchWhatsappWebhook(textPayload(`${command} VLR-COMMANDS`,undefined,'919233054806'));assert.equal(support.status,status);
  }
});

test("Meta HTTP webhook batches messages and keeps delivery callbacks out of router",async()=>{
  fresh();const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const payload=textPayload('Hi','http-message');payload.entry[0].changes[0].value.statuses=[{id:'http-status',status:'sent',timestamp:Date.now()}];
    const response=await fetch(`http://127.0.0.1:${server.address().port}/webhook/gupshup?token=isolated-inbound-secret`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});assert.equal(response.status,200);
    await api.drainWhatsappInbox();assert.equal(rows('whatsapp_inbox').length,1);assert.equal(rows('whatsapp_status_events').length,1);assert.equal(sent.length,1);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("configured Gupshup V2 callbacks remain compatible without a custom header",async()=>{
  fresh();
  rows('message_jobs').push({_id:new ObjectId(),providerMessageId:'native-gs-id',status:'submitted'});
  const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const event={app:'mock',timestamp:Date.now(),version:2,type:'message-event',payload:{id:'native-gs-id',type:'failed',destination:phone,payload:{code:1008,reason:'User is not opted in'}}};
    const response=await fetch(`http://127.0.0.1:${server.address().port}/webhook/gupshup`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(event)});
    assert.equal(response.status,200);
    assert.equal(rows('message_jobs')[0].status,'failed');
    assert.equal(rows('message_jobs')[0].providerErrors.reason,'User is not opted in');
    const wrongApp=await fetch(`http://127.0.0.1:${server.address().port}/webhook/gupshup`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...event,app:'wrong-app'})});
    assert.equal(wrongApp.status,401);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("website events schedule product/demo and abandoned-checkout production delays",async()=>{
  fresh();const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    for(const [event,trigger,hours] of [['product_explored','product_demo',18],['recipe_video_clicked','high_intent_followup',24],['checkout_details_submitted','checkout_reminder',1]]){
      const before=Date.now();const response=await fetch(`http://127.0.0.1:${server.address().port}/api/customer-events`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event,eventId:`event-${event}`,phone,productId:'velvety-butter-chicken',productName:'Velvety Butter Chicken Liquid Spice',orderValue:'Rs. 350',cartId:'isolated-cart'})});
      assert.equal(response.status,200);const job=rows('message_jobs').find(j=>j.trigger===trigger);assert.ok(job);assert.ok(+job.scheduledAt>=before+hours*3600000);
    }
    const own=order();await api.schedulePaidOrderAutomation(own);assert.ok(rows('message_jobs').filter(j=>['checkout_reminder','product_demo','high_intent_followup'].includes(j.trigger)).every(j=>j.status==='cancelled'));
    await new Promise(resolve=>setImmediate(resolve));await api.processDueWhatsappJobs();
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("review buttons, reminders and exact commands survive stale support sessions",async()=>{
  fresh();order();await tap('Need Help');await tap('Rate VALOUR ⭐');assert.match(sent.at(-1).message.text,/review/);
  await api.scheduleWhatsappJob({event:'review_request',phone,parameters:[],scheduledAt:new Date(Date.now()+60000)});await tap('Not now');assert.equal(rows('message_jobs').find(j=>j.trigger==='review_request').status,'cancelled');
  await tap('Tomorrow');const reminder=rows('message_jobs').find(j=>j.trigger==='cooking_reminder');assert.ok(reminder);assert.equal(new Date(+reminder.scheduledAt+330*60000).getUTCHours(),10);
  await tap('MENU_COOK');assert.equal(reminder.status,'cancelled');
  assert.ok(rows('message_jobs').filter(j=>j.trigger==='post_cook_feedback'&&j.status==='scheduled').every(j=>+j.scheduledAt>=Date.now()+29*60000));
});

test("transient rejection backs off; cancelling a claimed job before submission prevents sending",async()=>{
  fresh();await api.scheduleWhatsappJob({event:'cooking_reminder',phone,parameters:['dish'],scheduledAt:new Date(Date.now()+60000)});const job=rows('message_jobs')[0];job.scheduledAt=new Date(0);
  failure=()=>{throw Object.assign(new Error('rate limited'),{response:{status:429,data:{message:'rate limited'}}});};await api.processDueWhatsappJobs();assert.equal(job.status,'scheduled');assert.equal(job.attemptCount,1);assert.ok(+job.scheduledAt>=Date.now()+4*60000);
  failure=null;job.scheduledAt=new Date(0);
  let release;const gate=new Promise(resolve=>release=resolve);const cases=db.collection('support_cases');const find=cases.findOne.bind(cases);cases.findOne=async(...args)=>{await gate;return find(...args);};
  const work=api.processDueWhatsappJobs();await new Promise(resolve=>setImmediate(resolve));await api.cancelWhatsappJobs({phone,trigger:'cooking_reminder'},'customer_started_cooking');release();await work;assert.equal(job.status,'cancelled');assert.equal(sent.length,0);
});

test("forged webhook cannot impersonate an allowed admin without ingress authentication",async()=>{
  fresh();order();const server=api.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    for(const route of ['/webhook','/webhook/gupshup']) {
      const response=await fetch(`http://127.0.0.1:${server.address().port}${route}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(textPayload('orders','forged','917005328132'))});assert.equal(response.status,401);
    }
    assert.equal(rows('whatsapp_inbox').length,0);assert.equal(sent.length,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
