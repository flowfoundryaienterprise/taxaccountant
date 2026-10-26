import { services, type ServiceItem } from "@/lib/home-content";

/**
 * Editorial content for the service discovery pages (`/services` and
 * `/services/[slug]`).
 *
 * ## Source and status
 * Slugs, titles, short descriptions and icons are re-used from
 * `@/lib/home-content` — the same vocabulary the Day 2 homepage cards, the
 * Day 3 directory `?service=` param and the header/footer menus already use,
 * so no screen can drift onto a second set of service identifiers.
 *
 * The long-form copy below is **generic, jurisdiction-neutral description of
 * what each category of work normally involves**. It is deliberately written
 * without:
 *  - prices, fee ranges, turnaround times or guarantees;
 *  - deadlines, thresholds, form numbers or rates for any country;
 *  - claims that a service, credential or professional is available in a
 *    given country;
 *  - anything that reads as advice for an individual's situation.
 *
 * In production this content belongs in `contentPages` (DATABASE.md section
 * 2: `kind: "page" | "country_service"`, `serviceId`, `locale`, `seo`,
 * reviewed `status`) and is served by `services:getBySlug` (API.md section
 * 2). Until that CMS route exists (IMPLEMENTATION_PLAN.md day 11 / 16-17),
 * this module is the single place to review and sign off the wording.
 */

export type ServiceAudience = "individual" | "business" | "both";

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceNeed {
  title: string;
  description: string;
}

export interface ServiceDetail {
  slug: string;
  /** One-sentence hero summary, longer than the card description. */
  overview: string;
  audience: ServiceAudience;
  /** Hero artwork. Must be a file that exists in `public/images`. */
  image: { src: string; alt: string };
  /** "About the service" body. */
  about: string[];
  whoBenefits: string[];
  /** Jurisdiction-specific limitations. Required on every service. */
  limitations: string[];
  commonNeeds: ServiceNeed[];
  /** Questions a customer may want to ask — never answers to them. */
  questionsToAsk: string[];
  faqs: ServiceFaq[];
}

const AUDIENCE_LABELS: Record<ServiceAudience, string> = {
  individual: "Individuals",
  business: "Businesses",
  both: "Individuals & businesses",
};

export const audienceLabel = (audience: ServiceAudience) => AUDIENCE_LABELS[audience];

/**
 * The limitation that applies to every category, so no page can omit it.
 * Kept separate from the per-service lists to avoid eight near-copies.
 */
export const UNIVERSAL_SERVICE_LIMITATION =
  "Which tax jurisdictions a professional may act in is set by that jurisdiction's own rules, not by this marketplace. A professional's location does not establish where they are authorized to practise — always confirm authorization for the jurisdiction you need before engaging anyone.";

const details: ServiceDetail[] = [
  {
    slug: "individual-tax-preparation",
    overview:
      "Preparing and submitting a personal tax return, for the jurisdictions in which you are required to file.",
    audience: "individual",
    image: {
      src: "/images/article-tax-documents.jpg",
      alt: "Tax return paperwork laid out on a desk beside a calculator",
    },
    about: [
      "Individual tax preparation covers the work of turning a year of personal financial activity — employment income, self-employment, investments, property, pensions and deductions — into a complete, submitted return.",
      "The scope of that work differs widely by jurisdiction. Some countries pre-fill most of a return and ask only for confirmation; others expect the filer to assemble every figure and supporting schedule. What a preparer is permitted to sign, submit or represent on also varies.",
      "Professionals listed in this directory describe the individual tax work they take on and the tax jurisdictions they are authorized for. Those are two separate facts, and the directory keeps them separate.",
    ],
    whoBenefits: [
      "Employees with income beyond a single salary — investments, rental property or side work",
      "Self-employed people and freelancers who report business income on a personal return",
      "People who moved country, changed tax residence, or hold income in more than one jurisdiction",
      "Anyone whose circumstances changed materially during the year and who wants the return reviewed by a professional",
    ],
    limitations: [
      "Filing obligations, allowable deductions, residence tests and return formats are set per jurisdiction and are not comparable between countries.",
      "Being authorized to prepare returns in one jurisdiction does not permit a professional to prepare or sign them in another.",
    ],
    commonNeeds: [
      {
        title: "A straightforward annual return",
        description:
          "Employment income with a small number of additional items, prepared and submitted on time.",
      },
      {
        title: "Self-employment or freelance income",
        description:
          "Business income and expenses reported through a personal return, with the records to support them.",
      },
      {
        title: "Investment, property or capital transactions",
        description:
          "Disposals, dividends, interest and rental income that need correct treatment and supporting schedules.",
      },
      {
        title: "A change in residence during the year",
        description:
          "A move between countries that affects which jurisdictions you file in, and in what capacity.",
      },
    ],
    questionsToAsk: [
      "Which tax jurisdictions are you authorized to prepare and submit returns for?",
      "What records and documents do you need from me, and by when?",
      "Who signs and submits the return, and who deals with follow-up questions from the tax authority?",
      "How do you handle a situation that falls outside the work you normally take on?",
    ],
    faqs: [
      {
        question: "Can one professional handle returns for two countries?",
        answer:
          "Only if they are authorized in both. Some professionals are; many are not. The directory lists the tax jurisdictions each professional states they cover, independently of where they are located, so you can check before you make contact.",
      },
      {
        question: "Is a listed professional's credential verified by TaxAccountant.com?",
        answer:
          "Not at this stage. Designations shown in the directory are self-declared and are labelled as unverified. Credential review is a later phase of this platform, and no badge is applied until a documented review has taken place.",
      },
      {
        question: "Does TaxAccountant.com file my return?",
        answer:
          "No. This is a discovery platform. The engagement, the work and the filing are between you and the professional you choose.",
      },
      {
        question: "What does it cost?",
        answer:
          "Fees are set by each professional and are not published here. No pricing, quoting or payment feature exists on the platform yet, so discuss fees directly with any professional you contact.",
      },
    ],
  },
  {
    slug: "business-tax-services",
    overview:
      "Corporate, partnership and other entity-level tax compliance, prepared for the jurisdictions your business files in.",
    audience: "business",
    image: {
      src: "/images/article-small-business.jpg",
      alt: "A business owner reviewing financial statements and receipts at a desk",
    },
    about: [
      "Business tax services cover the returns and supporting computations an entity is required to file — corporate income tax, partnership returns, indirect tax registrations and returns, and the schedules that accompany them.",
      "The entity's legal form, the jurisdictions it operates or is registered in, and its size all change what has to be filed and how often. A company trading in several jurisdictions commonly has obligations in each of them.",
      "Professionals in the directory describe the entity types and tax jurisdictions they work with. Authorization is per jurisdiction and is listed separately from where the professional is based.",
    ],
    whoBenefits: [
      "Companies and incorporated entities with a periodic tax filing obligation",
      "Partnerships and other pass-through entities whose returns feed into partner filings",
      "Businesses registered for an indirect tax such as VAT, GST or sales tax",
      "Groups with activity, registration or establishment in more than one jurisdiction",
    ],
    limitations: [
      "Entity types, filing frequencies, indirect-tax regimes and registration thresholds differ fundamentally between jurisdictions.",
      "A professional authorized for one entity type or jurisdiction is not necessarily authorized for another, even within the same country.",
    ],
    commonNeeds: [
      {
        title: "Annual corporate or entity return",
        description:
          "Preparing the computation and return for the entity's accounting period, with supporting schedules.",
      },
      {
        title: "Indirect tax registration and returns",
        description:
          "Periodic VAT, GST or sales-tax returns and the registration decisions behind them.",
      },
      {
        title: "Multi-jurisdiction filings",
        description:
          "Coordinating obligations where a business is registered or established in more than one place.",
      },
      {
        title: "Group or restructuring work",
        description:
          "Entity-level consequences of a change in structure, ownership or operating footprint.",
      },
    ],
    questionsToAsk: [
      "Which entity types and tax jurisdictions do you file for?",
      "What do you need from our bookkeeping, and in what format?",
      "Who is responsible for registration decisions and for monitoring filing obligations?",
      "How do you work alongside our existing bookkeeper or finance team?",
    ],
    faqs: [
      {
        question: "Can one professional cover every country my business operates in?",
        answer:
          "Rarely. Multi-jurisdiction compliance is usually handled by a professional or firm authorized in each jurisdiction, sometimes coordinating with local counterparts. Filter the directory by tax jurisdiction rather than by country to see who states coverage for each one.",
      },
      {
        question: "What is the difference between filtering by country and by tax jurisdiction?",
        answer:
          "Country is where a professional is located. Tax jurisdiction is a tax authority they state they are authorized to act for. They are independent, and the directory filters on them separately for exactly that reason.",
      },
      {
        question: "Does this service include bookkeeping?",
        answer:
          "Not necessarily. Many professionals offer both, but they are separate categories here. If you need ongoing records as well as filings, look for a professional who lists both.",
      },
    ],
  },
  {
    slug: "bookkeeping-accounting",
    overview:
      "Ongoing recording, reconciliation and reporting of financial activity, through to financial statements.",
    audience: "business",
    image: {
      src: "/images/article-accountant-calculator.jpg",
      alt: "Hands working through figures on a calculator next to a laptop and ledger",
    },
    about: [
      "Bookkeeping is the continuous work of recording transactions, reconciling accounts and keeping the underlying records in a state where reporting and tax filing can be done from them.",
      "Accounting builds on those records: period-end adjustments, management reporting and the preparation of financial statements in whatever framework applies to the entity.",
      "Reporting frameworks, statutory filing requirements and audit thresholds are set locally, so what a complete set of accounts looks like depends on where the entity is registered.",
    ],
    whoBenefits: [
      "Businesses without an in-house finance function",
      "Owners who want their records kept filing-ready rather than reconstructed at year end",
      "Entities with a statutory financial-statement obligation",
      "Teams needing regular management reporting rather than annual figures only",
    ],
    limitations: [
      "Applicable accounting frameworks, statutory filing requirements and audit thresholds vary by jurisdiction and entity type.",
      "Bookkeeping and tax filing are distinct engagements — a bookkeeper is not automatically authorized to prepare or sign tax returns.",
    ],
    commonNeeds: [
      {
        title: "Monthly or quarterly bookkeeping",
        description: "Transaction recording, bank and ledger reconciliation on a regular cycle.",
      },
      {
        title: "Catch-up and clean-up work",
        description:
          "Bringing records that have fallen behind back to a reliable, reconciled state.",
      },
      {
        title: "Financial statement preparation",
        description:
          "Period-end adjustments and statements prepared under the framework that applies to the entity.",
      },
      {
        title: "Management reporting",
        description:
          "Regular reporting on the figures that the business actually makes decisions on.",
      },
    ],
    questionsToAsk: [
      "Which accounting software and workflow do you work in?",
      "What is the agreed cycle, and what do you need from us each period?",
      "Do you also prepare statutory financial statements, or only the underlying records?",
      "How are records handed over if we change provider?",
    ],
    faqs: [
      {
        question: "Is bookkeeping the same as tax preparation?",
        answer:
          "No. Bookkeeping produces and maintains the records. Tax preparation uses those records to produce a return, and may require separate authorization. Some professionals offer both; the directory lists them as separate services.",
      },
      {
        question: "Can bookkeeping be done remotely?",
        answer:
          "It commonly is. The directory has a consultation-mode filter so you can narrow to professionals who state they work remotely, in person, or either.",
      },
      {
        question: "Do I need an accountant if I already use accounting software?",
        answer:
          "That depends on the entity and what it is required to file, which is a question for a professional familiar with your jurisdiction. Software and a professional engagement answer different parts of the problem.",
      },
    ],
  },
  {
    slug: "payroll-services",
    overview:
      "Processing employee pay, withholding and the related filings in each jurisdiction where staff are employed.",
    audience: "business",
    image: {
      src: "/images/cta-professionals.jpg",
      alt: "Two accounting professionals reviewing payroll documents together",
    },
    about: [
      "Payroll work covers calculating pay, applying withholding and social contributions, producing payslips, and making the periodic returns and payments the relevant authorities require.",
      "Payroll obligations attach to where the employee works and is taxed, which is not always where the employer is registered. A business with staff in several jurisdictions usually has a separate payroll obligation in each.",
      "Contribution regimes, reporting frequencies and employee-versus-contractor rules are all set locally and are among the most jurisdiction-specific areas in this list.",
    ],
    whoBenefits: [
      "Employers running payroll for staff in one or more jurisdictions",
      "Businesses taking on their first employees",
      "Organisations with remote staff who work in a different jurisdiction from the employer",
      "Employers who need payroll reporting to reconcile cleanly with their accounting records",
    ],
    limitations: [
      "Payroll withholding, social contribution and reporting rules are jurisdiction-specific and change frequently; coverage in one jurisdiction implies nothing about another.",
      "Worker classification rules differ by jurisdiction and are determined there, not by the engagement or by this marketplace.",
    ],
    commonNeeds: [
      {
        title: "Regular payroll runs",
        description: "Pay calculation, payslips and the associated periodic filings on a set cycle.",
      },
      {
        title: "Setting up payroll in a new jurisdiction",
        description:
          "Registration and the first cycles where a business begins employing somewhere new.",
      },
      {
        title: "Remote and cross-border employees",
        description:
          "Staff working in a different jurisdiction from the employing entity, with obligations in both.",
      },
      {
        title: "Year-end payroll reporting",
        description: "Annual statements and reconciliations required by the relevant authority.",
      },
    ],
    questionsToAsk: [
      "Which jurisdictions can you run payroll in?",
      "What are the deadlines in our cycle, and what do you need from us before each run?",
      "How are payroll figures handed to our bookkeeping or accounting records?",
      "Who deals with queries from the tax or social-security authority?",
    ],
    faqs: [
      {
        question: "We have one employee in another country. Does our usual provider cover that?",
        answer:
          "Not automatically. Payroll is generally handled per jurisdiction. Use the tax-jurisdiction filter in the directory to see who states coverage for the jurisdiction in question.",
      },
      {
        question: "Does payroll include employment law advice?",
        answer:
          "No. Payroll is the calculation, withholding and reporting of pay. Employment law is a separate discipline and is not a service category on this platform.",
      },
    ],
  },
  {
    slug: "tax-planning-advisory",
    overview:
      "Forward-looking advice on structure, timing and tax position, given by a professional authorized in the relevant jurisdiction.",
    audience: "both",
    image: {
      src: "/images/hero-accountant.jpg",
      alt: "A tax advisor working through planning scenarios on a laptop in an office",
    },
    about: [
      "Advisory work looks ahead rather than back. It deals with decisions that have not been made yet — how to structure an entity, when to realise a transaction, how a change in residence or ownership would be treated.",
      "Unlike compliance work, advisory output is specific to the facts. Generic guidance is not a substitute for advice on your circumstances from someone authorized in your jurisdiction.",
      "Nothing on this website, including these pages, is tax advice. These pages describe what the category of work involves so you can find someone qualified to advise you.",
    ],
    whoBenefits: [
      "Businesses considering a change in structure, ownership or operating footprint",
      "Individuals planning a move between countries or a change in tax residence",
      "Anyone facing a one-off transaction with a material tax consequence",
      "Organisations that want their compliance position reviewed before, rather than after, a decision",
    ],
    limitations: [
      "Advisory work is specific to the facts and to one or more named jurisdictions; it does not transfer to another jurisdiction or to another set of circumstances.",
      "Advice on a jurisdiction should come from a professional authorized there. Authorization is not implied by location, by a listing on this site, or by a professional's other credentials.",
    ],
    commonNeeds: [
      {
        title: "Entity and structure decisions",
        description: "How a proposed structure would be treated before it is put in place.",
      },
      {
        title: "Transaction planning",
        description:
          "The tax consequences of a disposal, acquisition or restructuring being considered.",
      },
      {
        title: "Residence and relocation",
        description:
          "How a change of residence would affect which jurisdictions you file in and in what capacity.",
      },
      {
        title: "Position review",
        description: "A second professional view on a position already taken or about to be taken.",
      },
    ],
    questionsToAsk: [
      "Which jurisdictions can you advise on, and in what capacity?",
      "What facts and documents do you need before you can give a view?",
      "Will the advice be given in writing, and what are its stated limitations?",
      "Where does your engagement end and another specialist's begin?",
    ],
    faqs: [
      {
        question: "Can I get tax advice from this website?",
        answer:
          "No. TaxAccountant.com helps you find professionals. It does not give tax advice, and no page here should be relied on for a decision about your own circumstances.",
      },
      {
        question: "How is advisory different from tax preparation?",
        answer:
          "Preparation reports what has already happened. Advisory considers something that has not happened yet. They are often provided by the same professional but are separate pieces of work with different scope.",
      },
      {
        question: "Can an advisor in one country advise on another?",
        answer:
          "Only where they are authorized and competent to do so. Some professionals hold authorization in more than one jurisdiction; the directory lists each professional's stated jurisdictions separately from their location.",
      },
    ],
  },
  {
    slug: "international-tax-services",
    overview:
      "Cross-border income, treaty positions and foreign reporting obligations, where more than one jurisdiction has a claim.",
    audience: "both",
    image: {
      src: "/images/article-international-globe.jpg",
      alt: "A hand placing a small marker flag on a world globe",
    },
    about: [
      "International tax work arises whenever more than one jurisdiction has a potential claim on the same income, entity or person — through residence, source, establishment or ownership.",
      "It typically involves reading two or more domestic regimes together with any treaty between them, and identifying the reporting obligations each side imposes. Those obligations frequently exist even where no tax is ultimately due.",
      "Because it spans jurisdictions, this is the category where the distinction between where a professional is located and where they are authorized matters most.",
    ],
    whoBenefits: [
      "People living in one country and earning in another",
      "Businesses with establishments, subsidiaries or customers across borders",
      "Individuals who have moved country and have obligations on both sides",
      "Anyone holding accounts, assets or entities outside their country of residence",
    ],
    limitations: [
      "Treaty positions depend on the specific pair of jurisdictions involved and on the facts; a position available between two countries may not exist between another two.",
      "Reporting obligations can apply in a jurisdiction even where no tax is payable there, and are determined by that jurisdiction alone.",
      "Cross-border work often requires authorized professionals on more than one side rather than a single adviser.",
    ],
    commonNeeds: [
      {
        title: "Income taxed in more than one place",
        description: "Employment, investment or business income with a claim from two jurisdictions.",
      },
      {
        title: "Moving between countries",
        description:
          "Split-year positions, exit and arrival obligations, and the filings each side expects.",
      },
      {
        title: "Foreign asset and account reporting",
        description: "Disclosure obligations that attach to holdings outside the country of residence.",
      },
      {
        title: "Cross-border business structures",
        description: "Establishment, subsidiary and intra-group questions spanning jurisdictions.",
      },
    ],
    questionsToAsk: [
      "Which jurisdiction pairs do you regularly work between?",
      "Are you authorized on both sides, or do you coordinate with a counterpart?",
      "What reporting obligations might apply even where no tax is due?",
      "What information do you need about my position in each jurisdiction?",
    ],
    faqs: [
      {
        question: "Do I need one professional or two?",
        answer:
          "It depends on the jurisdictions involved and on what each requires. Some professionals are authorized on both sides; others coordinate with a counterpart. Ask directly, and use the jurisdiction filter to see stated coverage.",
      },
      {
        question: "Does a professional based in my country cover my other jurisdiction?",
        answer:
          "Not automatically, and the directory never implies it. Location and authorization are stored and filtered as separate facts throughout this site.",
      },
      {
        question: "Is a treaty position always available?",
        answer:
          "No. Whether a treaty exists, and what it provides, depends on the specific pair of jurisdictions and on the facts. That is a question for an authorized professional, not for this page.",
      },
    ],
  },
  {
    slug: "irs-tax-audit-support",
    overview:
      "Support and, where permitted, representation during an enquiry, review or audit by a tax authority.",
    audience: "both",
    image: {
      src: "/images/article-tax-documents.jpg",
      alt: "Tax correspondence and supporting documents organised on a desk",
    },
    about: [
      "When a tax authority opens an enquiry, review or audit, the work involves understanding what has been asked, assembling the supporting records, and responding within the authority's process and deadlines.",
      "Who may speak to a tax authority on your behalf is controlled by that authority. In some jurisdictions representation requires a specific authorization or a filed appointment; in others the rules are different again.",
      "Professionals who list this service describe the jurisdictions they handle this work for. Confirm both the authorization and the scope before an engagement begins.",
    ],
    whoBenefits: [
      "Individuals or businesses that have received a formal query, notice or audit letter",
      "Filers who need previous records assembled and explained to an authority",
      "Anyone who wants an authorized professional to handle correspondence on their behalf",
      "Businesses under review on a specific area such as indirect tax or payroll",
    ],
    limitations: [
      "Representation rights before a tax authority are granted by that authority and differ between jurisdictions; not every professional may act in that capacity.",
      "Audit processes, deadlines, appeal routes and penalties are jurisdiction-specific and are not comparable between countries.",
      "Support with an enquiry is not legal representation; where a matter becomes a legal dispute, separate specialist advice may be required.",
    ],
    commonNeeds: [
      {
        title: "Responding to a notice or query",
        description: "Understanding what has been asked and preparing a complete, timely response.",
      },
      {
        title: "Document assembly",
        description: "Locating and organising the records that support positions already filed.",
      },
      {
        title: "Representation where permitted",
        description: "An authorized professional corresponding with the authority on your behalf.",
      },
      {
        title: "Review of a filed position",
        description: "A professional review of how a position was taken and how it is best explained.",
      },
    ],
    questionsToAsk: [
      "Are you authorized to represent me before this particular tax authority?",
      "What are the deadlines in this process, and what happens if they are missed?",
      "What records do you need from me, and how quickly?",
      "What falls outside your engagement if the matter escalates?",
    ],
    faqs: [
      {
        question: "Can any accountant deal with a tax authority for me?",
        answer:
          "No. Representation rights are set by the authority concerned and not every professional holds them. Ask explicitly, for the specific authority involved, before engaging anyone.",
      },
      {
        question: "Which tax authorities does this cover?",
        answer:
          "The category covers enquiry and audit support generally, not one country's authority. Each professional states the tax jurisdictions they act for, and the directory's jurisdiction filter shows those.",
      },
      {
        question: "Should I respond to a notice myself first?",
        answer:
          "That is a decision about your own situation, and this page cannot answer it. Deadlines in these processes are usually firm, so involving an authorized professional promptly is generally the practical constraint.",
      },
    ],
  },
  {
    slug: "amended-tax-returns",
    overview:
      "Correcting and resubmitting a return that has already been filed, where the jurisdiction permits an amendment.",
    audience: "both",
    image: {
      src: "/images/article-accountant-calculator.jpg",
      alt: "An accountant rechecking previously filed figures against supporting records",
    },
    about: [
      "An amendment corrects a return that has already been submitted — because a figure was wrong, something was omitted, or information arrived after filing.",
      "Whether an amendment is possible, how it is made, and how long after the original filing it remains available are all determined by the jurisdiction. Some require a specific amendment process; some reopen the original return; some have a fixed window.",
      "The work usually starts with establishing what was filed and why, before deciding whether an amendment is the right route at all.",
    ],
    whoBenefits: [
      "Filers who have identified an error or omission in a submitted return",
      "People who received a corrected income statement or document after filing",
      "Businesses whose records changed after a return was submitted",
      "Anyone wanting a previously filed position reviewed before an authority raises it",
    ],
    limitations: [
      "Whether an amendment is available, and for how long after the original filing, is set by each jurisdiction.",
      "An amendment is not always the correct route; some corrections are handled through a different process in a given jurisdiction.",
      "Amending a return may have consequences — including in other jurisdictions where the same figures were reported — that need to be considered first.",
    ],
    commonNeeds: [
      {
        title: "Correcting an error or omission",
        description: "A figure, schedule or disclosure that was wrong or missing on the original return.",
      },
      {
        title: "Late-arriving information",
        description: "A document or corrected statement received after the return was submitted.",
      },
      {
        title: "Reviewing a prior-year position",
        description: "Establishing what was filed before deciding whether any correction is warranted.",
      },
      {
        title: "Knock-on effects elsewhere",
        description: "Where the same figures were also reported to another jurisdiction.",
      },
    ],
    questionsToAsk: [
      "Is an amendment available in this jurisdiction for the period concerned?",
      "What do you need from the original filing and the supporting records?",
      "What are the likely consequences of amending, including in any other jurisdiction involved?",
      "How long does the process usually take in this jurisdiction?",
    ],
    faqs: [
      {
        question: "How long do I have to amend a return?",
        answer:
          "That is set by the jurisdiction and differs significantly between them. This page does not publish time limits for any country — confirm the position with a professional authorized there.",
      },
      {
        question: "Can the professional who filed the original return amend it?",
        answer:
          "Often, but not necessarily, and you are not required to go back to them. Any professional authorized for that jurisdiction may be able to take the work on.",
      },
      {
        question: "Will amending trigger an audit?",
        answer:
          "This page cannot answer that — it depends on the jurisdiction and the facts. Discuss the implications with an authorized professional before deciding.",
      },
    ],
  },
];

export interface ServiceCatalogEntry extends ServiceItem, ServiceDetail {}

const detailBySlug = new Map(details.map((detail) => [detail.slug, detail]));

/**
 * Service list in homepage order, with each card's identity (slug, title,
 * description, icon) joined to its editorial detail. Built from
 * `home-content.services` so the eight categories can never diverge between
 * the homepage grid, the nav menus, `/services` and `/services/[slug]`.
 *
 * A service without detail content is dropped rather than rendered half
 * empty — a missing entry here is a content gap, not a page.
 */
export const serviceCatalog: ServiceCatalogEntry[] = services.flatMap((service) => {
  const detail = detailBySlug.get(service.slug);
  return detail ? [{ ...service, ...detail }] : [];
});

const catalogBySlug = new Map(serviceCatalog.map((entry) => [entry.slug, entry]));

export function getService(slug: string): ServiceCatalogEntry | undefined {
  return catalogBySlug.get(slug);
}

export const serviceCatalogSlugs = serviceCatalog.map((entry) => entry.slug);

export function servicesForAudience(audience: Exclude<ServiceAudience, "both">) {
  return serviceCatalog.filter(
    (entry) => entry.audience === audience || entry.audience === "both",
  );
}

/**
 * Related services shown at the foot of a detail page: same audience first,
 * then the rest, excluding the current service. Purely navigational — no
 * claim that they are offered together or by the same professional.
 */
export function relatedServices(slug: string, limit = 3): ServiceCatalogEntry[] {
  const current = catalogBySlug.get(slug);
  if (!current) return [];

  const others = serviceCatalog.filter((entry) => entry.slug !== slug);
  const sameAudience = others.filter((entry) => entry.audience === current.audience);
  const rest = others.filter((entry) => entry.audience !== current.audience);

  return [...sameAudience, ...rest].slice(0, limit);
}
