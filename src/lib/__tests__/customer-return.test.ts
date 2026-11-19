import assert from "node:assert/strict";
import { test } from "node:test";
import { customerEnquiryReturnPath } from "@/lib/auth/customer-return";

test("enquiry destination retains the chosen professional and service", () => {
  assert.equal(
    customerEnquiryReturnPath("/customer/dashboard?professional=abc123&service=business-tax-services#enquiries"),
    "/customer/dashboard?professional=abc123&service=business-tax-services#enquiries",
  );
});

test("external or unrelated destinations are ignored", () => {
  assert.equal(customerEnquiryReturnPath("//evil.example/customer/dashboard?professional=abc"), null);
  assert.equal(customerEnquiryReturnPath("https://evil.example/customer/dashboard?professional=abc"), null);
  assert.equal(customerEnquiryReturnPath("/admin?professional=abc"), null);
  assert.equal(customerEnquiryReturnPath("/customer/dashboard?professional=abc%2Fdef"), null);
});
