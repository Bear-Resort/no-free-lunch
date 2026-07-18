import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Free capacity slots when both players close their browsers. */
crons.interval(
  "sweep online presence",
  { minutes: 1 },
  internal.onlineCleanup.sweepStale,
);

export default crons;
