import express from "express";
import cors from "cors";
import loyaltyRouter from "./routes/loyalty";
import bookingsRouter from "./routes/bookings";
import agentforceRouter from "./routes/agentforce";
import personalizationRouter from "./routes/personalization";

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


// Global ping
app.get("/api/__ping", (_req, res) => res.json({ ok: true }));

// MOUNT ROUTERS (these create the final paths)
app.use("/api/loyalty", loyaltyRouter);  // -> POST /api/loyalty/journals/accrual-stay
app.use("/api/bookings", bookingsRouter); // -> POST /api/bookings
app.use("/api/agentforce", agentforceRouter);
app.use("/api/personalization", personalizationRouter); // -> POST /api/personalization

export default app;
