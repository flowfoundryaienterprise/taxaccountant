import { expect, test } from "vitest";
import { approvedBillingUrl } from "./billingUrls";
test("billing returns only to the configured application origin",()=>{
  expect(approvedBillingUrl("https://taxaccountant.com/professional/subscription?checkout=success","https://taxaccountant.com")).toContain("checkout=success");
  expect(()=>approvedBillingUrl("https://attacker.example/","https://taxaccountant.com")).toThrow();
  expect(()=>approvedBillingUrl("https://taxaccountant.com.attacker.example/","https://taxaccountant.com")).toThrow();
  expect(()=>approvedBillingUrl("https://taxaccountant.com/",undefined)).toThrow();
});
