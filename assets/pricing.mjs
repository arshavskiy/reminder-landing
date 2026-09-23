// Data is shared with the Vue app. Keep amounts and feature copy in the catalog.
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
}

export function billingTerms(plan, locale, symbol) {
    const amounts = plan.amounts[locale];
    if (!amounts.yearly) return "";
    const total = amounts.yearly.toLocaleString(locale === "he" ? "he-IL" : "en-US");
    return locale === "he"
        ? `בתשלום שנתי: ${symbol}${total} לשנה · או ${symbol}${amounts.monthly} בחיוב חודשי`
        : `Billed yearly: ${symbol}${total} per year · or ${symbol}${amounts.monthly} billed monthly`;
}

export function purchaseUrl(catalog, plan, locale) {
    if (plan.id === "trial") {
        return `https://app.remindocr.com/${locale === "en" ? "en/" : ""}login?tab=register`;
    }
    const copy = plan.copy[locale];
    const terms = billingTerms(plan, locale, catalog.locales[locale].symbol);
    const message = locale === "he"
        ? `שלום, אני מעוניין לרכוש את המסלול ${copy.name} של RemindOCR. ${terms}`
        : `Hi, I would like to purchase the RemindOCR ${copy.name} plan. ${terms}`;
    return `https://wa.me/${catalog.contactPhone}?text=${encodeURIComponent(message)}`;
}

export function renderPricing(catalog, locale, heading = "h2") {
    const headingTag = heading === "h3" ? "h3" : "h2";
    const labels = catalog.locales[locale];
    const cards = catalog.plans.map((plan) => {
        const copy = plan.copy[locale];
        const amount = plan.amounts[locale];
        const trial = plan.id === "trial";
        const monthly = amount.yearly ? amount.yearly / 12 : amount.monthly;
        return `<article class="plan${plan.highlighted ? " plan--highlighted" : ""}" data-plan="${escapeHtml(plan.id)}">
      ${plan.highlighted ? `<span class="plan__badge">${escapeHtml(labels.recommended)}</span>` : ""}
      <${headingTag} class="plan__name">${escapeHtml(copy.name)}</${headingTag}>
      <p class="plan__blurb">${escapeHtml(copy.blurb)}</p>
      <div class="plan__price"><strong>${escapeHtml(labels.symbol)}${monthly}</strong><span class="plan__price-period">${escapeHtml(trial ? labels.trialPeriod : labels.monthlyPeriod)}</span></div>
      <p class="plan__price-year">${escapeHtml(billingTerms(plan, locale, labels.symbol))}</p>
      <ul class="plan__features">${copy.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
      <a class="plan__cta ${trial ? "plan__cta--ghost" : "plan__cta--primary"}" href="${escapeHtml(purchaseUrl(catalog, plan, locale))}"${trial ? "" : ' target="_blank" rel="noopener noreferrer"'}>${escapeHtml(trial ? labels.startTrial : labels.purchase)}</a>
      ${trial ? "" : `<p class="plan__soon-note">${escapeHtml(labels.purchaseNote)}</p>`}
    </article>`;
    }).join("\n").replace(/[ \t]+(?=\n)/g, "");
    return `<div class="plans-grid">${cards}</div>
    <p class="plans-note">${escapeHtml(labels.trialNote)}</p>
    <p class="plans-note">${escapeHtml(labels.existingCustomerNote)}</p>`;
}

// The checked-in HTML is a usable no-JS/network fallback. Refresh from the same
// catalog used by Vue so standalone landing deployments need no build system.
if (typeof document !== "undefined") {
    const target = document.querySelector("[data-pricing-catalog]");
    if (target) {
        fetch(new URL("./pricing-catalog.json", import.meta.url), {cache: "no-cache"})
            .then((response) => {
                if (!response.ok) throw new Error(`Pricing catalog: ${response.status}`);
                return response.json();
            })
            .then((catalog) => {
                target.innerHTML = renderPricing(catalog, document.documentElement.lang === "en" ? "en" : "he", target.dataset.pricingHeading);
            })
            .catch((error) => {
                console.warn("Using published pricing snapshot.", error);
            });
    }
}
