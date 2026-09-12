"use strict";
const fs = require("fs");

async function main() {
  const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
  const page = targets.find((target) => target.type === "page" && /admin-dashboard\.html/.test(target.url));
  if (!page) throw new Error("Admin dashboard browser target not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await call("Page.enable");
  await call("Runtime.evaluate", { expression: `
    document.querySelector('#login').hidden = true;
    document.querySelectorAll('section.panel').forEach((panel) => panel.hidden = true);
    document.querySelector('#templates-panel').hidden = false;
    document.querySelector('#metrics').innerHTML = [
      ['Total orders','184'], ['Orders today','7'], ['Pending fulfilment','12'], ['Delivered','156'], ['Paid revenue','₹64,500']
    ].map(([label,value]) => '<article class="metric"><span>'+label+'</span><strong>'+value+'</strong></article>').join('');
    whatsappTemplates = [{
      key:'cod_prepaid_confirmation', label:'COD converted to prepaid', templateName:'515b2202-ab03-4fb3-a2de-32f896d04953',
      templateId:'515b2202-ab03-4fb3-a2de-32f896d04953', languageCode:'en_US', parameterCount:3,
      parameterLabels:['Order number','Amount paid','Tracking button token'], mediaType:null, available:true, configurationError:''
      ,bodyText:'Your payment for VALOUR order {{1}} was successful.\n\nAmount paid: {{2}}\nPayment method: Online payment\n\nYour order has been updated from Cash on Delivery to Prepaid. No payment will be collected at delivery.\n\nUse the button below to track your order.', buttons:['Track order'], footerText:''
    }];
    recentTemplateSends = [{templateLabel:'Cooking reminder',templateName:'valour_cooking_reminder',phone:'919876543210',parameterCount:1,status:'delivered',providerMessageId:'provider-example',createdAt:new Date().toISOString()},{templateLabel:'COD converted to prepaid',templateName:'515b2202-ab03-4fb3-a2de-32f896d04953',phone:'919876500001',parameterCount:3,status:'submitted',providerMessageId:'provider-pending',createdAt:new Date().toISOString()}];
    document.querySelector('#template-select').innerHTML = '<option value="cod_prepaid_confirmation">COD converted to prepaid</option>';
    document.querySelector('#template-select').value = 'cod_prepaid_confirmation';
    activeTab = 'templates'; renderTemplateFields(); renderTemplateHistory();
    document.querySelector('#template-phone').value = '+91 98765 43210';
    [...document.querySelectorAll('[data-template-parameter]')].forEach((input,index) => input.value = ['VALOUR-ABC123','Rs. 350','signed_tracking_token'][index]);
  ` });
  for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 1000 }]) {
    await call("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 600 });
    const metrics = await call("Runtime.evaluate", { expression: `({innerWidth, bodyScrollWidth:document.body.scrollWidth, shellWidth:document.querySelector('.shell').getBoundingClientRect().width, panelWidth:document.querySelector('#templates-panel').getBoundingClientRect().width})`, returnByValue: true });
    const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.mkdirSync("output", { recursive: true });
    fs.writeFileSync(`output/admin-dashboard-${viewport.name}.png`, Buffer.from(shot.data, "base64"));
    console.log(viewport.name, JSON.stringify(metrics.result.value));
    if (viewport.name === "mobile") {
      await call("Runtime.evaluate", { expression: "scrollTo(0, 720)" });
      const lowerShot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync("output/admin-dashboard-mobile-form.png", Buffer.from(lowerShot.data, "base64"));
    }
  }
  socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
