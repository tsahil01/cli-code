import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL
const WORKER_URL = process.env.WORKER_URL

export { BACKEND_URL, WORKER_URL };
