# SDD 115: MR0-001 Provider Ownership and Tenant Register

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 111 `MR0-001`

---

## 1. Ownership Register

| Provider / Surface                | Business Owner                        | Technical Owner                | Tenant / Account Identifier | Current State                                        | Required Confirmation                              |
| --------------------------------- | ------------------------------------- | ------------------------------ | --------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Monday.com                        | Clint Phillips (operator)             | Council / platform engineering | `PENDING_OPERATOR_INPUT`    | Ownership identified, account id pending             | Monday workspace/account id and environment        |
| RightSignature (ShareFile)        | Clint Phillips (operator)             | Council / platform engineering | `PENDING_OPERATOR_INPUT`    | Ownership identified, entitlement/account id pending | ShareFile account id, environment, API entitlement |
| Microsoft Graph (Olumie profile)  | Clint Phillips / Olumie tenant admin  | Council / platform engineering | `PENDING_OPERATOR_INPUT`    | Existing P0-2/P0-4 dependency                        | tenant_id + client_id confirmation                 |
| Microsoft Graph (Everest profile) | Clint Phillips / Everest tenant admin | Council / platform engineering | `PENDING_OPERATOR_INPUT`    | Existing P0-2/P0-4 dependency                        | tenant_id + client_id confirmation                 |

---

## 2. Responsibility Split (Confirmed)

### Operator-side responsibilities (Clint)

1. Authorize provider accounts and consent scopes.
2. Confirm tenant/account identifiers.
3. Confirm RightSignature API entitlement status.

### Council/platform responsibilities

1. Implement connector runtime and governance controls.
2. Add admission policies, replay fixtures, and telemetry.
3. Gate production activation per SDD 112 rules.

---

## 3. Open Items Blocking MR-0 Closure

1. Monday workspace/account identifier not yet provided.
2. RightSignature account identifier and entitlement proof not yet provided.
3. Graph tenant/client identifiers not yet confirmed in this register (tracked under P0-2/P0-4).

---

## 4. MR0-001 Status

`IN_PROGRESS` - ownership split confirmed; identifiers pending operator confirmation.
