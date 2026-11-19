import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/** Transactional limits. Network-layer IP limits remain an operator concern. */
export const rateLimits = new RateLimiter(components.rateLimiter, {
  publicMessageByEmail: { kind: "fixed window", rate: 3, period: HOUR },
  publicMessageGlobal: { kind: "fixed window", rate: 500, period: HOUR },
  enquiryByCustomer: { kind: "fixed window", rate: 5, period: HOUR },
  enquiryByProfessional: { kind: "fixed window", rate: 2, period: 10 * MINUTE },
});
