# "Ads-Readiness" for ChatGPT Ads: product brief for the simulation (2026-10-09)

## Market facts (official unless marked)
- ChatGPT Ads: contextual ads in ChatGPT. Matching uses the context and intent of the current chat; the system also considers the ad title,
  the copy, the landing page and advertiser "context hints" (ad-group level; broad thematic signals, not exact keywords). Optional
  personalization is not initially available in the EEA or Switzerland.
- Specs: title 16-24 characters recommended (50 max); copy 32-48 recommended (100 max); square image up to 1200x1200.
- Landing page must be reachable by the OAI-AdsBot crawler (robots.txt, WAF/CDN bot rules, CAPTCHA, login or app-only pages block review).
  Ad and landing page must describe the same offering. The most relevant subpage is preferred over the homepage.
- Policy: focus on consumer verticals (lifestyle, household goods, local services, travel, digital products, education). Finance,
  health and legal only for approved advertisers. Gambling, dating, alcohol/drugs, politics and jobs/housing are not allowed. No ads
  near sensitive chats or for minors.
- Germany plus 30 European markets live since late August 2026 (Free and Go users); self-serve Ads Manager since ~31 Aug 2026.
- Third-party, unconfirmed: CPC bidding next to CPM; CPM ~25-60 $, CPC ~2-8 $; reporting is basic (impressions, clicks, spend, CTR, CPC, CPM per day).
- Nobody outside OpenAI knows the ranking weights; there is no public ad library and no reporting API we can use.

## The product idea (exists as a code core; not yet a plugin)
Input: landing-page URL + offering description (+ optional draft ads).
Output, deterministic, no LLM needed for the checks:
1. Landing-page check: does OAI-AdsBot get through (robots.txt, HTTP status, bot wall, login, app-store link), language, homepage vs. subpage.
2. Ad linter: lengths, unsupported superlatives, shouting, policy-category flags, URL problems, keyword-style hints.
3. Consistency score: share of ad terms that appear on the landing page (our heuristic, not OpenAI's) and which terms are missing.
4. Intent clusters → descriptive context-hint sentences (discover / problem / compare / deadline / implement …), plus distinct ad angles.
5. Scenario math from stated assumptions (budget, CPC range, conversion range); a test plan with minimum sample sizes; diagnosis rules
   (delivery vs. copy vs. landing-page problem).
Channels being considered: ChatGPT app (free), web tool, agency tier (white-label report, many clients), later monitoring.
Price ideas to test: free check; 49 €/month self-serve; 199-399 €/month agency; one-off audit 290 €.
Proven on our own product: it found a missing robots.txt, a wrong page language and landing-page text that did not cover the ad terms.
Founder: one developer, early stage, EU hosting possible.
