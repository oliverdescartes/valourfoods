require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const fs = require("fs");
const { createBrevoEmail } = require("./brevo-email");

function argumentsFrom(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === "--send") { options.send = true; continue; }
    if (!key.startsWith("--") || !argv[index + 1] || argv[index + 1].startsWith("--")) {
      throw new Error(`Expected a value after ${key}`);
    }
    options[key.slice(2)] = argv[++index];
  }
  return options;
}

async function main(argv = process.argv.slice(2)) {
  const options = argumentsFrom(argv);
  const brevo = createBrevoEmail();
  if (options.action === "utility") {
    if (!options.to) throw new Error("--to is required");
    const templateKey = options.template || "order_confirmation";
    const params = JSON.parse(options["data-file"] ? fs.readFileSync(options["data-file"], "utf8") : options.data || "{}");
    const preview = brevo.renderUtility(templateKey, params);
    if (!options.send) {
      console.log(JSON.stringify({ dryRun: true, to: options.to, templateKey, ...preview }, null, 2));
      return;
    }
    const result = await brevo.sendUtility({ to: options.to, templateKey, params });
    console.log(JSON.stringify({ submitted: true, ...result }, null, 2));
    return;
  }
  if (options.action === "marketing-enroll") {
    if (!options.to) throw new Error("--to is required");
    const request = { email: options.to, consentAt: options["consent-at"], consentSource: options["consent-source"] };
    if (!request.consentAt || !request.consentSource) throw new Error("--consent-at and --consent-source are required");
    if (!options.send) {
      console.log(JSON.stringify({ dryRun: true, category: "marketing", action: "enroll", email: options.to, listId: process.env.BREVO_MARKETING_LIST_ID, consentAt: request.consentAt, consentSource: request.consentSource }, null, 2));
      return;
    }
    console.log(JSON.stringify(await brevo.enrollMarketing(request), null, 2));
    return;
  }
  throw new Error("Use --action utility or --action marketing-enroll. Add --send to make a live Brevo request.");
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, argumentsFrom };
