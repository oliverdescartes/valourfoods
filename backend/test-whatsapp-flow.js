const assert = require("assert");
const { _test } = require("./server");

const idle = { current_state: "idle" };
const scenario = { current_state: "cooking_scenario" };

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test("guided cooking command starts the guided flow", () => {
  assert.equal(_test.isStartCookingIntent("Guidided cooking"), true);
  assert.equal(_test.getFirstAction("Guidided cooking"), "start_guided_cooking");
});

test("how to cook is treated as a brand/cooking question, not a shortcut", () => {
  assert.equal(_test.isStartCookingIntent("How to cook?"), false);
  assert.equal(_test.shouldTryBrandNLU(idle, "How to cook?"), true);
});

test("scenario state still allows natural brand questions", () => {
  assert.equal(_test.shouldTryBrandNLU(scenario, "Are all ingredients there?"), true);
  assert.equal(_test.shouldTryBrandNLU(scenario, "How long does it take?"), true);
  assert.equal(_test.shouldTryBrandNLU(scenario, "quantity of mustard fish"), true);
});

test("numeric scenario replies do not go to brand NLU", () => {
  assert.equal(_test.shouldTryBrandNLU(scenario, "1"), false);
  assert.equal(_test.getCookingScenarioChoice("1").painPoint, "ingredient_complexity");
});

test("quantity replies are recognized", () => {
  assert.equal(_test.parseQuantity("250g"), "250g");
  assert.equal(_test.parseQuantity("500 grams"), "500g");
  assert.equal(_test.parseQuantity("1 kg"), "1kg");
});

test("product exploration choices infer useful segments", () => {
  assert.deepEqual(_test.getProductExplorationChoice("1"), {
    painPoint: "ingredient_complexity",
    desiredOutcome: "simpler_cooking",
    segment: "fish_complexity",
  });
  assert.equal(_test.getProductExplorationChoice("Better flavour").segment, "fish_restaurant");
  assert.equal(_test.getProductExplorationChoice("Faster preparation").segment, "fish_time");
});

test("scenario choices return personalized acknowledgements", () => {
  const prep = _test.getCookingScenarioChoice("Preparing ingredients");
  assert.equal(prep.painPoint, "ingredient_complexity");
  assert.match(prep.response, /one balanced Liquid Spice base/);

  const taste = _test.getCookingScenarioChoice("Getting the taste right");
  assert.equal(taste.painPoint, "taste_inconsistency");
  assert.match(taste.response, /balanced/);
});

test("question analysis infers pain points", () => {
  assert.equal(_test.inferPainPoint("How many ingredients do I need?"), "ingredient_complexity");
  assert.equal(_test.inferPainPoint("Will it taste like restaurant food?"), "restaurant_style_desire");
  assert.equal(_test.inferPainPoint("How long does it take?"), "time_consumption");
  assert.equal(_test.inferPainPoint("Will it taste same every time?"), "taste_inconsistency");
});

test("purchase questions increase purchase intent and score", () => {
  assert.equal(_test.inferPurchaseIntent("What is the price?"), "high");
  assert.equal(_test.inferPurchaseIntent("Do you deliver here?"), "high");
  assert.equal(_test.getLeadScoreDelta("What is the price?"), 15);
  assert.equal(_test.getLeadScoreDelta("Do you deliver here?"), 15);
});

test("customer intelligence builds VALOUR segments", () => {
  const restaurant = _test.inferCustomerIntelligence("Will it taste like restaurant food?");
  assert.equal(restaurant.painPoint, "restaurant_style_desire");
  assert.equal(restaurant.desiredOutcome, "better_flavour");
  assert.equal(restaurant.segment, "fish_restaurant");

  assert.equal(
    _test.buildCustomerSegment({
      cookingType: "fish",
      painPoint: "time_consumption",
    }),
    "fish_time",
  );
});

test("fallback cooking guide exists for every supported fish quantity", () => {
  for (const quantity of ["250g", "500g", "1kg"]) {
    const flow = _test.getFallbackCookingFlow(quantity);
    assert.equal(flow.quantity, quantity);
    assert.ok(flow.steps.length >= 5);
    assert.match(flow.steps[0].text, /fish/);
  }
});

test("AI brand understanding validates only safe structured output", () => {
  const valid = {
    scope: "brand",
    intent: "ingredient_question",
    flowAction: "answer",
    cookingType: "fish",
    painPoint: "ingredient_complexity",
    desiredOutcome: "simpler_cooking",
    purchaseIntent: "medium",
    leadScoreDelta: 5,
    answer: "Milky Mustard handles the mustard-coconut base.",
    confidence: 0.86,
  };

  assert.equal(_test.isValidBrandUnderstanding(valid), true);
  assert.equal(
    _test.getBrandUnderstandingIntelligence(valid).segment,
    "fish_complexity",
  );
  assert.equal(
    _test.isValidBrandUnderstanding({ ...valid, scope: "random" }),
    false,
  );
  assert.equal(
    _test.isValidBrandUnderstanding({ ...valid, answer: "" }),
    false,
  );
});

test("reassurance text never leaks model identity", () => {
  const text = _test.sanitizeReassuranceText(
    "Hi there! I'm OWL, your calm cooking companion.",
  );

  assert.doesNotMatch(text, /\bOWL\b/i);
  assert.doesNotMatch(text, /\bAI assistant\b/i);
  assert.doesNotMatch(text, /\bchatbot\b/i);
  assert.match(text, /VALOUR|guided cooking protocol/);
});

if (!process.exitCode) {
  console.log("All WhatsApp flow tests passed.");
}
