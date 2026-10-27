/**
 * Client-side form validation for the CMS.
 *
 * ## Scope and a warning
 * These checks exist to give an editor immediate, accessible feedback while
 * typing. They are **not** a security boundary and are not the system of
 * record for validity. API.md section 1 is explicit: "Inputs validated
 * server-side using Convex validators and shared form validation; never
 * trust UI-only checks."
 *
 * When the authorized mutations land, the same rules must be re-expressed as
 * Convex validators, and the server's per-field error map (API.md section 3)
 * becomes the source of truth that these messages mirror.
 */

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult = { ok: true } | { ok: false; errors: FieldError[] };

/** Matches the slug shape every public route already uses. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LIMITS = {
  title: 120,
  slug: 80,
  summary: 300,
  excerpt: 320,
  seoTitle: 60,
  seoDescription: 160,
  altText: 160,
  blockText: 2000,
} as const;

export function validateRequired(field: string, value: string, label: string): FieldError[] {
  return value.trim() ? [] : [{ field, message: `${label} is required.` }];
}

export function validateMaxLength(
  field: string,
  value: string,
  max: number,
  label: string,
): FieldError[] {
  return value.length > max
    ? [{ field, message: `${label} must be ${max} characters or fewer (currently ${value.length}).` }]
    : [];
}

export function validateSlug(field: string, value: string, existingSlugs: string[] = []): FieldError[] {
  const slug = value.trim();
  if (!slug) return [{ field, message: "URL slug is required." }];

  if (!SLUG_PATTERN.test(slug)) {
    return [
      {
        field,
        message:
          "Use lowercase letters, numbers and single hyphens only — for example “international-tax-services”.",
      },
    ];
  }

  const lengthError = validateMaxLength(field, slug, LIMITS.slug, "URL slug");
  if (lengthError.length) return lengthError;

  /*
   * Uniqueness is checked against the slugs this screen was handed, which
   * is the set the public site currently renders. It is an advisory check:
   * only the server can answer authoritatively, and it must re-check on
   * write (API.md section 3, "Validation: per-field error map").
   */
  if (existingSlugs.includes(slug)) {
    return [{ field, message: `“${slug}” is already in use. Slugs must be unique.` }];
  }

  return [];
}

export interface PageFormValues {
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
}

export function validatePageForm(
  values: PageFormValues,
  existingSlugs: string[] = [],
): ValidationResult {
  const errors: FieldError[] = [
    ...validateRequired("title", values.title, "Page title"),
    ...validateMaxLength("title", values.title, LIMITS.title, "Page title"),
    ...validateSlug("slug", values.slug, existingSlugs),
    ...validateMaxLength("summary", values.summary, LIMITS.summary, "Page summary"),
    ...validateMaxLength("seoTitle", values.seoTitle, LIMITS.seoTitle, "SEO title"),
    ...validateMaxLength(
      "seoDescription",
      values.seoDescription,
      LIMITS.seoDescription,
      "Meta description",
    ),
  ];

  return errors.length ? { ok: false, errors } : { ok: true };
}

export interface ArticleFormValues extends PageFormValues {
  excerpt: string;
  category: string;
  imageAlt: string;
  hasImage: boolean;
}

export function validateArticleForm(
  values: ArticleFormValues,
  existingSlugs: string[] = [],
): ValidationResult {
  const base = validatePageForm(values, existingSlugs);
  const errors: FieldError[] = base.ok ? [] : [...base.errors];

  errors.push(...validateMaxLength("excerpt", values.excerpt, LIMITS.excerpt, "Excerpt"));
  errors.push(...validateRequired("category", values.category, "Category"));

  /*
   * An image without alt text is an accessibility defect, so it is a
   * validation error rather than a warning (DESIGN.md section 10, WCAG 2.2
   * AA). Alt text with no image is simply ignored.
   */
  if (values.hasImage) {
    errors.push(...validateRequired("imageAlt", values.imageAlt, "Image alt text"));
    errors.push(...validateMaxLength("imageAlt", values.imageAlt, LIMITS.altText, "Image alt text"));
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Pulls the message for one field out of a result, for inline display. */
export function errorFor(result: ValidationResult | undefined, field: string): string | undefined {
  if (!result || result.ok) return undefined;
  return result.errors.find((error) => error.field === field)?.message;
}
