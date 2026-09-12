"use strict";
// Purpose-built Mongo double. No sockets, real credentials, or database startup.
const { ObjectId } = require("mongodb");
const get = (doc, key) => key.split(".").reduce((v, k) => v?.[k], doc);
const eq = (a, b) => a == null && b == null || (a instanceof ObjectId || b instanceof ObjectId ? String(a) === String(b) : a instanceof Date || b instanceof Date ? +a === +b : a === b);
function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, wanted]) => {
    if (key === "$or") return wanted.some(f => matches(doc, f));
    if (key === "$and") return wanted.every(f => matches(doc, f));
    const actual = get(doc, key);
    if (wanted && typeof wanted === "object" && !(wanted instanceof Date) && !(wanted instanceof ObjectId)) {
      return Object.entries(wanted).every(([op, v]) => {
        if (op === "$exists") return (actual !== undefined) === v;
        if (op === "$in") return v.some(item => eq(actual, item));
        if (op === "$nin") return !v.some(item => eq(actual, item));
        if (op === "$ne") return !eq(actual, v);
        if (op === "$not") return v instanceof RegExp ? !v.test(actual || "") : !matches({ value: actual }, { value: v });
        if (op === "$lt") return actual < v;
        if (op === "$lte") return actual <= v;
        if (op === "$gt") return actual > v;
        if (op === "$gte") return actual >= v;
        if (op === "$regex") return new RegExp(v, wanted.$options).test(actual || "");
        if (op === "$options") return true;
        throw new Error(`Unsupported test query ${op}`);
      });
    }
    return eq(actual, wanted);
  });
}
function set(doc, key, value, remove = false) {
  const keys = key.split("."); const last = keys.pop();
  for (const k of keys) doc = doc[k] ||= {};
  if (remove) delete doc[last]; else doc[last] = value;
}
function update(doc, operations, inserted = false) {
  for (const [op, fields] of Object.entries(operations)) for (const [key, value] of Object.entries(fields)) {
    if (op === "$set" || op === "$setOnInsert" && inserted) set(doc, key, value);
    else if (op === "$inc") set(doc, key, (get(doc, key) || 0) + value);
    else if (op === "$unset") set(doc, key, null, true);
    else if (op === "$push") set(doc, key, [...(get(doc, key) || []), value]);
    else if (op !== "$setOnInsert") throw new Error(`Unsupported test update ${op}`);
  }
}
class Collection {
  rows = [];
  constructor(name) { this.name = name; }
  checkUnique(doc) {
    if (this.name === "whatsapp_phone_locks" && this.rows.some(row=>row.phone===doc.phone)) throw Object.assign(new Error("duplicate phone lease"),{code:11000});
  }
  async insertOne(doc) {
    for (const key of ["message_id", "jobKey", "eventKey", "case_id", "requestId"]) if (doc[key] && this.rows.some(r => r[key] === doc[key])) throw Object.assign(new Error("duplicate"), { code: 11000 });
    doc = { ...doc, _id: doc._id || new ObjectId() }; this.rows.push(doc); return { insertedId: doc._id };
  }
  find(filter = {}) {
    let rows = this.rows.filter(row => matches(row, filter));
    const cursor = { sort(spec) { rows.sort((a, b) => { for (const [key, direction] of Object.entries(spec)) { const x=get(a,key), y=get(b,key); if(x>y)return direction;if(x<y)return -direction; } return 0; }); return cursor; },
      limit(n) { rows = rows.slice(0, n); return cursor; }, project() { return cursor; }, async toArray() { return rows.map(r => ({ ...r })); } };
    return cursor;
  }
  async findOne(filter, opts = {}) { return (await this.find(filter).sort(opts.sort || {}).limit(1).toArray())[0] || null; }
  async updateOne(filter, ops, opts = {}) {
    let doc = this.rows.find(row => matches(row, filter)); const inserted = !doc && opts.upsert;
    if (inserted) {
      doc = Object.fromEntries(Object.entries(filter).filter(([k,v])=>!k.startsWith("$") && (v == null || typeof v !== "object" || v instanceof ObjectId)));
      doc._id ||= new ObjectId(); this.checkUnique(doc); this.rows.push(doc);
    }
    if (!doc) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    update(doc, ops, inserted); return { matchedCount: inserted ? 0 : 1, modifiedCount: inserted ? 0 : 1, upsertedCount: inserted ? 1 : 0 };
  }
  async updateMany(filter, ops) { let n=0;for(const row of this.rows)if(matches(row,filter)){update(row,ops);n++;}return {matchedCount:n,modifiedCount:n}; }
  async findOneAndUpdate(filter, ops, opts = {}) {
    let doc = this.rows.find(row => matches(row, filter));
    if (!doc && opts.upsert) {
      doc = Object.fromEntries(Object.entries(filter).filter(([k,v])=>!k.startsWith("$") && (v == null || typeof v !== "object" || v instanceof ObjectId)));
      doc._id ||= new ObjectId(); this.checkUnique(doc); this.rows.push(doc); update(doc,ops,true);
    } else if(doc) update(doc,ops);
    return doc ? { ...doc } : null;
  }
  async countDocuments(filter) { return this.rows.filter(row=>matches(row,filter)).length; }
}
module.exports = { createDatabase() { const collections=new Map();return { collection(name) { if(!collections.has(name))collections.set(name,new Collection(name));return collections.get(name); } }; } };
