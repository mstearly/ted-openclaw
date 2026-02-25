# Intake Configuration Traceability — Clint (2026-02-20)

**SDD-Pack Document:** 40
**Generated:** 2026-02-22
**Purpose:** Trace each section of Clint's completed client intake questionnaire to its placement in the Ted configuration layer. Identifies gaps where infrastructure does not yet exist.

---

**Source:** `docs/ted-profile/client_intake_COMPLETED.md`
**Date placed:** 2026-02-22

## Config File Mapping

| Intake Section                        | Config File                                       | Key Fields                                               |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Section 0 (Metadata)                  | `config/operator_profile.json`                    | operator.name, timezone, contexts                        |
| Section 1 (Weekly outcomes)           | `config/autonomy_ladder.json`                     | success_criteria                                         |
| Section 2 (Pain points)               | `config/operator_profile.json`                    | contexts.entity_separation                               |
| Section 3 (Non-negotiable boundaries) | `config/hard_bans.json`                           | never_without_approval, never_do, hard_ban_strings       |
| Section 4 (Daily brief)               | `config/brief_config.json`                        | daily_briefs.personal, daily_briefs.work                 |
| Section 5 (Urgency rules)             | `config/urgency_rules.json`                       | urgency_definitions, urgency_signals                     |
| Section 6 (Contexts/entities)         | `config/operator_profile.json`                    | contexts.entity_separation                               |
| Section 7 (Error tolerance)           | `config/urgency_rules.json`                       | error_tolerance                                          |
| Section 8 (Low confidence)            | `config/urgency_rules.json`                       | low_confidence_behavior                                  |
| Section 9 (Draft style)               | `config/draft_style.json`                         | preferred_tone, style_rules, words_to_avoid              |
| Section 10 (Escalation)               | `config/urgency_rules.json`                       | escalation_triggers, escalation_config                   |
| Optional A (Systems)                  | `config/operator_profile.json`                    | (systems inventory tracked in intake, not yet in config) |
| Optional B (Autonomy)                 | `config/autonomy_ladder.json`                     | action_categories                                        |
| Optional C (Deal ops)                 | Pending — deal workflow engine not yet built      |
| Optional D (Isaac report)             | `config/brief_config.json`                        | isaac_nightly_report                                     |
| Optional E (Everest)                  | Pending — Everest monitoring engine not yet built |
| Optional F (Success criteria)         | `config/autonomy_ladder.json`                     | success_criteria                                         |
| Graph emails                          | `config/graph.profiles.json`                      | primary_email per profile                                |
| PHI/Privilege                         | `config/operator_profile.json`                    | confidentiality                                          |

## Not Yet Placed (Requires Additional Infrastructure)

| Intake Data                             | Why Not Placed                       | Dependency                      |
| --------------------------------------- | ------------------------------------ | ------------------------------- |
| Deal workflow stages (Section C)        | Deal workflow engine not implemented | New sidecar module needed       |
| Everest facility monitoring (Section E) | Monitoring engine not implemented    | External data source TBD        |
| Monday.com integration                  | Not yet connected                    | API integration needed          |
| DocuSign tracking                       | Not yet connected                    | API integration needed          |
| Zoom/Teams auto-join                    | Not yet connected                    | Meeting capture module needed   |
| PACER/CMS lookups                       | Not yet connected                    | Research module needed          |
| Voice training from sent emails         | Graph API access needed              | JC-056b (Azure AD credentials)  |
| OIG/state exclusion list checks         | Compliance module not implemented    | New sidecar module needed       |
| Everest facility health scores          | Data source unknown                  | Clint to identify test facility |

---

**Traceability note:** This document is authoritative for mapping intake responses to config placement. When new infrastructure is built to address items in the "Not Yet Placed" table, update this document and move the row to the "Config File Mapping" table with the target config file path.
