// Vercel serverless entrypoint
import { handler } from "../Server/server.js";
import serverless from "serverless-http";

export default serverless(handler);
