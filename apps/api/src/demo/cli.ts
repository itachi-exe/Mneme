import { seedSwarm } from "./swarm.js";

const endpoint = process.env.MNEME_API ?? "http://127.0.0.1:3011";
const r = await seedSwarm(endpoint);
console.log("demo wrote against", endpoint, r);
