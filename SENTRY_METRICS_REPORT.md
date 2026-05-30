# Sentry Metrics Report - UniBite

## 1) Instrumentation Summary

### Frontend (Expo)

- SDK: @sentry/react-native
- Session tracking enabled for retention and release health.
- Engagement events:
  - login_success
  - login_failed
  - signup_success
  - signup_failed
  - home_feed_loaded
  - home_search_submitted
  - home_category_clicked
  - home_see_all_clicked
  - home_food_detail_opened
- Performance metrics:
  - login_flow_duration_ms
  - signup_flow_duration_ms
  - home_foods_fetch_duration_ms
  - api_request_duration_ms
  - api_request_retry_duration_ms
  - auth_refresh_duration_ms

### Backend (Express)

- SDK: @sentry/node
- Centralized error handler now reports exceptions to Sentry.
- Tags include service=unibite-be for filtering.

## 2) KPI Definitions

### Engagement

- Home feed interaction rate:
  - (home_search_submitted + home_category_clicked + home_food_detail_opened) / home_feed_loaded
- Login success rate:
  - login_success / (login_success + login_failed)
- Signup conversion rate:
  - signup_success / (signup_success + signup_failed)

### Retention

- Daily retention proxy:
  - count_unique(users with sessions on day N and N+1) / count_unique(users with sessions on day N)
- Weekly retention proxy:
  - count_unique(users with sessions on week W and W+1) / count_unique(users with sessions on week W)

### Performance

- p95 login_flow_duration_ms
- p95 signup_flow_duration_ms
- p95 home_foods_fetch_duration_ms
- p95 api_request_duration_ms by endpoint
- Retry ratio:
  - count(api_request_retry_duration_ms) / count(api_request_duration_ms)

## 3) How To Analyze In Sentry

### Discover filters

- environment: development/staging/production
- tags[category]: engagement or performance
- tags[service]: unibite-be (backend errors)

### Example queries

- Engagement by screen:
  - event.type:error or transaction
  - message:[home_search_submitted, home_category_clicked, home_food_detail_opened]
- Authentication funnel:
  - message:[login_success, login_failed, signup_success, signup_failed]
- Slow operations:
  - message:[home_foods_fetch_duration_ms, api_request_duration_ms]
  - sort by extra.durationMs desc

## 4) Initial Insights Baseline

The project now captures the event streams required to infer real usage patterns. After 7-14 days of production traffic, this report should be updated with:

- top interaction paths (screen-to-screen flow)
- drop-off points in auth funnel
- retention by user role (buyer/seller) using token-derived user metadata
- API and UI performance outliers (p95/p99)

## 5) Action Plan For Next Report Iteration

1. Add Sentry dashboards for engagement, retention, and performance.
2. Create weekly snapshots and compare deltas.
3. Correlate frontend failures with backend exceptions by release and timestamp.
4. Set alerts:
   - login_failed spike
   - crash-free sessions drop
   - p95 api_request_duration_ms regression

## 6) Immediate Verification Runbook

### Step A - Configure DSN

- Frontend: set EXPO_PUBLIC_SENTRY_DSN in fe/.env.
- Backend: set SENTRY_DSN in be/.env.

### Step B - Send test events safely

- Frontend startup test event:
  - Set EXPO_PUBLIC_SENTRY_SEND_TEST_EVENT=1 in fe/.env.
  - Start app and confirm event frontend_sentry_startup_test_event appears in Sentry.
  - Set EXPO_PUBLIC_SENTRY_SEND_TEST_EVENT back to 0 after verification.
- Backend test events:
  - Set SENTRY_ENABLE_DEBUG_ENDPOINT=1 in be/.env (non-production only).
  - Call GET /debug/sentry/message to send a non-error test message.
  - Call GET /debug/sentry/error to validate exception capture.
  - Set SENTRY_ENABLE_DEBUG_ENDPOINT back to 0 after verification.

### Step C - Confirm engagement and retention tracking

- Do one end-to-end user journey:
  - signup -> signin -> open home -> search -> open food detail.
- Verify events exist:
  - signup_success, login_success, home_feed_loaded, home_search_submitted, home_food_detail_opened.

## 7) Alert Rules (Recommended Defaults)

Create these in Sentry Alerts:

1. login_failed spike

- Condition: count(message=login_failed) > 20 in 10 minutes.
- Action: send Slack/email to on-call.

2. Crash-free sessions drop

- Condition: crash-free session rate < 99.0% for 15 minutes.
- Scope: production environment.

3. API latency regression

- Condition: p95(extra.durationMs where message=api_request_duration_ms) > 1200 for 15 minutes.
- Filter: environment=production.

4. Auth refresh instability

- Condition: count(message=auth_refresh_duration_ms and extra.result=failed) > 10 in 10 minutes.

5. Backend exception burst

- Condition: error events tagged service=unibite-be > 15 in 10 minutes.
