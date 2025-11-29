# Load Test Plan

## Objective
Evaluate the waitlist application under concurrent traffic to quantify throughput, latency, and error rates. The goal is to understand the DigitalOcean droplet’s current capacity and identify potential bottlenecks before production scaling.

## Tooling
Use **k6** (https://k6.io) executed from a developer workstation or CI runner with outbound access to the staging or production endpoint.

## Scenario Overview
- **Virtual Users (VUs):** 100
- **Duration:** 30 seconds steady-state following a 10 second ramp-up
- **Target Endpoints:**
  - `GET /` – landing page access
  - `POST /waitlist` – form submission with representative payload
- **Data:** Form payload should mimic realistic values (e.g., `fullName`, `countryCode`, `phone`).

## Metrics to Capture
1. **Response Time (Latency):** Track average, median, and 95th percentile (p95) to detect high delay in the application layer.
2. **Throughput:** Requests-per-second (RPS) overall and per endpoint to judge capacity.
3. **Error Rate:** Non-2xx/3xx responses.
4. **System Metrics (via droplet monitoring):** CPU, memory, and network utilization for correlation with test spikes.

## Example k6 Script Skeleton
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const landing = http.get('https://gruppe20.app/');
  check(landing, {
    'GET / is 200': (res) => res.status === 200,
  });

  const payload = {
    fullName: 'Test User',
    countryCode: '+45',
    phone: '12345678',
  };

  const waitlist = http.post('https://gruppe20.app/waitlist', payload);
  check(waitlist, {
    'POST /waitlist redirects': (res) => res.status === 303,
  });

  sleep(1);
}
```

## Post-Test Analysis
- Review k6 summary for latency and RPS trends.
- Inspect Winston access logs and PM2/droplet metrics to correlate spikes.
- Document observed bottlenecks (e.g., CPU saturation, database locks) and propose mitigation steps (horizontal scaling, caching, query tuning).
