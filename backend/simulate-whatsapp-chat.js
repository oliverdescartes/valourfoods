const readline = require("readline");
const { _test } = require("./server");

const MAIN_MENU = `Welcome to VALOUR.

Choose an option:

1. Start guided cooking
2. What is VALOUR?
3. Buy now
4. Help with an order

Reply MENU at any time.`;

const PRODUCT_EXPLORATION = `What interests you most about VALOUR?

1. Simpler cooking
2. Better flavour
3. Faster preparation
4. Less mess`;

const COOKING_SCENARIO = `When making mustard fish curry, which part usually takes the most effort?

1. Preparing ingredients
2. Getting the taste right
3. Cleaning up afterward
4. Finding all ingredients`;

function createSession() {
  return {
    current_state: "idle",
    selected_quantity: null,
    fishQuantity: null,
    active_flow: null,
    current_step_index: 0,
    cookingType: null,
    painPoint: null,
    desiredOutcome: null,
    purchaseIntent: null,
    leadScore: 0,
    segment: "new_lead",
    conversationStarted: false,
  };
}

function mergeDefined(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value !== undefined && value !== null && value !== "") {
      target[key] = value;
    }
  }
}

function startConversation(session) {
  const replies = [];

  if (!session.conversationStarted) {
    session.conversationStarted = true;
    session.leadScore += 2;
  }

  replies.push(MAIN_MENU);
  return replies;
}

function answerBrandQuestion(text, session) {
  const lower = text.trim().toLowerCase();
  const pain = session.painPoint;

  if (lower.includes("how") && lower.includes("cook")) {
    return "Choose your fish quantity, then follow VALOUR step by step. Milky Mustard gives the mustard-coconut base; you add fish, oil, and water.";
  }
  if (lower.includes("quantity")) {
    return "The guided Milky Mustard fish curry flow supports 250g, 500g, and 1kg fish. Reply with one of these quantities when you are ready to cook.";
  }
  if (lower.includes("ingredient")) {
    return "Milky Mustard contains the main mustard-coconut flavour base. You still add fish and basic kitchen staples like oil and water. Check the pack for exact ingredient details.";
  }
  if (lower.includes("restaurant") || lower.includes("taste")) {
    return "Milky Mustard is made for rich Bengali-style mustard flavour at home. It helps keep the base balanced, especially if restaurant-style taste matters to you.";
  }
  if (lower.includes("long") || lower.includes("time") || lower.includes("quick")) {
    return "VALOUR reduces grinding and prep. Cooking time still depends on the fish quantity, but the flavour base is already handled.";
  }
  if (lower.includes("price") || lower.includes("cost")) {
    return "Price can be shown on the order page. If you are ready, reply 3 and I will share the order link.";
  }
  if (lower.includes("deliver") || lower.includes("delivery")) {
    return "Delivery availability is checked during checkout using your pincode. Reply 3 when you want to order.";
  }
  if (lower.includes("what is") || lower.includes("valour")) {
    return "VALOUR creates Liquid Spice: concentrated cooking bases for restaurant-style dishes at home without grinding, complicated preparation, or unnecessary waste.";
  }
  if (pain === "ingredient_complexity") {
    return "VALOUR helps by giving you one balanced Liquid Spice base, so you do not have to manage mustard, coconut, and multiple prep steps separately.";
  }
  if (pain === "taste_inconsistency") {
    return "VALOUR helps keep the mustard-coconut base balanced, so the curry feels more consistent each time.";
  }
  if (pain === "time_consumption") {
    return "VALOUR reduces prep time by handling the flavour base before you start cooking.";
  }

  return "VALOUR helps make mustard fish easier with one concentrated Liquid Spice base. You still cook the dish, but the flavour foundation is already handled.";
}

function resumePrompt(session) {
  if (session.current_state === "product_exploration") {
    return "To continue, reply 1 Simpler cooking, 2 Better flavour, 3 Faster preparation, or 4 Less mess.";
  }
  if (session.current_state === "cooking_scenario") {
    return "To continue, reply 1 Preparing ingredients, 2 Getting taste right, 3 Cleaning up, or 4 Finding ingredients.";
  }
  if (session.current_state === "awaiting_quantity") {
    return "To continue, reply 1 for 250g, 2 for 500g, or 3 for 1kg.";
  }
  if (session.current_state === "guided_cooking") {
    return "Reply NEXT when ready, or REPEAT to see the step again.";
  }

  return "Reply MENU to see all options.";
}

function startCookingFlow(session) {
  session.current_state = "cooking_scenario";
  session.cookingType = "fish";
  session.purchaseIntent = session.purchaseIntent || "medium";
  session.segment = session.segment || "fish_guided_cooking";
  session.leadScore += 5;

  return [COOKING_SCENARIO];
}

function askQuantity(session) {
  session.current_state = "awaiting_quantity";
  session.selected_quantity = null;
  session.fishQuantity = null;
  session.active_flow = null;
  session.current_step_index = 0;

  return [`How much fish are you cooking?

1. 250g
2. 500g
3. 1kg

Reply MENU to go back.`];
}

function sendCookingStep(session) {
  const flow = session.active_flow;
  const step = flow.steps[session.current_step_index];

  return `Step ${session.current_step_index + 1}/${flow.steps.length}

${step.text}

Reply NEXT when ready.
You can also reply REPEAT, BACK, or MENU.`;
}

function handleQuantity(session, text) {
  const quantity = _test.parseQuantity(text);

  if (!quantity) {
    return [`Please choose one quantity:

1. 250g
2. 500g
3. 1kg

Reply MENU to go back.`];
  }

  session.current_state = "guided_cooking";
  session.selected_quantity = quantity;
  session.fishQuantity = quantity;
  session.active_flow = _test.getFallbackCookingFlow(quantity);
  session.current_step_index = 0;
  session.segment = "activated_cook";

  return [sendCookingStep(session)];
}

function handleGuidedCooking(session, text) {
  const lower = text.trim().toLowerCase();

  if (["repeat", "again", "current"].includes(lower)) {
    return [sendCookingStep(session)];
  }
  if (["back", "previous", "prev"].includes(lower)) {
    session.current_step_index = Math.max(0, session.current_step_index - 1);
    return [sendCookingStep(session)];
  }
  if (["next", "n", "done", "ready"].includes(lower)) {
    const nextIndex = session.current_step_index + 1;

    if (nextIndex >= session.active_flow.steps.length) {
      session.current_state = "post_cook_feedback";
      session.segment = "completed_cooking";
      return [`Cooking complete.

How did your curry feel?

1. Loved it
2. Too strong
3. Too mild
4. Need help`];
    }

    session.current_step_index = nextIndex;
    return [sendCookingStep(session)];
  }

  return [
    `${answerBrandQuestion(text, session)}

${resumePrompt(session)}`,
  ];
}

function processMessage(session, text) {
  const replies = [];
  const lower = text.trim().toLowerCase();
  const inferred = _test.inferCustomerIntelligence(text);
  const scoreDelta = _test.getLeadScoreDelta(text);

  mergeDefined(session, inferred);
  session.leadScore += scoreDelta;

  if (["hi", "hello", "hey"].includes(lower) || lower === "menu") {
    session.current_state = "idle";
    replies.push(...startConversation(session));
    return replies;
  }

  if (["restart", "start over", "stop", "cancel"].includes(lower)) {
    Object.assign(session, createSession(), { conversationStarted: true });
    replies.push(MAIN_MENU);
    return replies;
  }

  if (
    session.current_state === "idle" &&
    _test.isStartCookingIntent(text)
  ) {
    replies.push(...startCookingFlow(session));
    return replies;
  }

  if (_test.shouldTryBrandNLU(session, text)) {
    replies.push(`${answerBrandQuestion(text, session)}

${resumePrompt(session)}`);

    if (session.current_state === "idle" && session.purchaseIntent !== "high") {
      session.current_state = "cooking_scenario";
      replies.push(COOKING_SCENARIO);
    }

    return replies;
  }

  if (session.current_state === "guided_cooking") {
    return handleGuidedCooking(session, text);
  }

  if (session.current_state === "awaiting_quantity") {
    return handleQuantity(session, text);
  }

  if (session.current_state === "product_exploration") {
    const choice = _test.getProductExplorationChoice(text);

    if (choice) {
      mergeDefined(session, {
        ...choice,
        cookingType: "fish",
        purchaseIntent: session.purchaseIntent || "medium",
      });
      session.current_state = "cooking_scenario";
      replies.push(COOKING_SCENARIO);
      return replies;
    }
  }

  if (session.current_state === "cooking_scenario") {
    const choice = _test.getCookingScenarioChoice(text);

    if (choice) {
      const { response, ...intelligence } = choice;
      mergeDefined(session, {
        ...intelligence,
        cookingType: "fish",
        activationPreference: "guided_cooking",
        purchaseIntent: session.purchaseIntent || "medium",
      });
      replies.push(response);
      replies.push(...askQuantity(session));
      return replies;
    }

    const quantity = _test.parseQuantity(text);

    if (quantity) {
      return handleQuantity(session, text);
    }
  }

  if (session.current_state === "post_cook_feedback") {
    const feedbackType = _test.getFeedbackType?.(text);

    if (feedbackType) {
      session.feedbackType = feedbackType;
      session.current_state = "idle";
      replies.push("Thank you. Reply MENU whenever you want to cook again.");
      return replies;
    }
  }

  if (lower === "2" || lower.includes("what is valour") || lower.includes("what is milky mustard")) {
    session.current_state = "product_exploration";
    session.purchaseIntent = session.purchaseIntent || "medium";
    session.segment = "education_intent";
    replies.push(`VALOUR creates Liquid Spice - concentrated cooking bases for restaurant-style dishes at home.

Milky Mustard helps you cook rich mustard fish curry without grinding, complicated prep, or unnecessary waste.

${PRODUCT_EXPLORATION}`);
    return replies;
  }

  if (lower === "3" || lower.includes("buy") || lower.includes("order")) {
    session.purchaseIntent = "high";
    session.segment = "buyer_intent";
    session.leadScore += 20;
    replies.push(`You can order here:

https://yourwebsite.com

Reply MENU to return.`);
    return replies;
  }

  replies.push(MAIN_MENU);
  return replies;
}

function printBot(message) {
  console.log(`\nVALOUR:\n${message}\n`);
}

function printDebug(session) {
  console.log("STATE:", {
    current_state: session.current_state,
    fishQuantity: session.fishQuantity,
    painPoint: session.painPoint,
    desiredOutcome: session.desiredOutcome,
    purchaseIntent: session.purchaseIntent,
    leadScore: session.leadScore,
    segment: session.segment,
  });
}

function runMessages(messages, options = {}) {
  const session = createSession();

  printBot(MAIN_MENU);
  session.conversationStarted = true;
  session.leadScore += 2;

  for (const message of messages) {
    console.log(`YOU: ${message}`);
    for (const reply of processMessage(session, message)) {
      printBot(reply);
    }
    if (options.debug) printDebug(session);
  }

  return session;
}

const scripts = {
  questions: [
    "How to cook?",
    "Are all ingredients there?",
    "How long does it take?",
    "Will it taste like restaurant food?",
    "What is the price?",
  ],
  quantity: ["how to cook mustard fish", "quantity of mustard fish"],
  guided: ["Guidided cooking", "1", "250g", "next", "next", "repeat", "next"],
  discovery: ["2", "1", "1", "250g", "next"],
  purchase: ["Hi", "What is VALOUR?", "Better flavour", "restaurant taste?", "3"],
};

async function runInteractive() {
  const session = createSession();
  printBot(MAIN_MENU);
  session.conversationStarted = true;
  session.leadScore += 2;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "YOU: ",
  });

  console.log("Type messages as a WhatsApp user. Commands: /state, /quit");
  rl.prompt();

  rl.on("line", (line) => {
    const text = line.trim();

    if (text === "/quit") {
      rl.close();
      return;
    }
    if (text === "/state") {
      printDebug(session);
      rl.prompt();
      return;
    }

    for (const reply of processMessage(session, text)) {
      printBot(reply);
    }
    rl.prompt();
  });
}

const scenarioName = process.argv[2];
const debug = process.argv.includes("--debug");

if (scenarioName && scripts[scenarioName]) {
  runMessages(scripts[scenarioName], { debug });
} else if (scenarioName && scenarioName !== "interactive") {
  console.log(`Unknown scenario "${scenarioName}". Available: ${Object.keys(scripts).join(", ")}, interactive`);
  process.exitCode = 1;
} else {
  runInteractive();
}
