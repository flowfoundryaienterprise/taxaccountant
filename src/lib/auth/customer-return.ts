/** Accept only the customer enquiry destination carried through sign-in. */
export function customerEnquiryReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/customer/dashboard?")) return null;
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || url.pathname !== "/customer/dashboard") return null;
    const professional = url.searchParams.get("professional");
    if (!professional || !/^[a-z0-9]{1,64}$/.test(professional)) return null;
    const service = url.searchParams.get("service");
    const serviceParam = service && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service) && service.length <= 80
      ? `&service=${encodeURIComponent(service)}` : "";
    return `/customer/dashboard?professional=${encodeURIComponent(professional)}${serviceParam}#enquiries`;
  } catch {
    return null;
  }
}
