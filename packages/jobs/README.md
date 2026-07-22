# Jobs

`@saas-template/jobs` owns the Node.js queue contract shared by API producers
and worker consumers. It defines queue and job names, validated payloads,
correlation context, lazy Redis configuration, and small BullMQ factories. It
has no NestJS, React, or database dependency.

The initial durable jobs are `EMAIL_SEND` and `NOTIFICATION_SEND`. Their worker
processors intentionally acknowledge validated work without contacting a
provider; a future provider integration must be added behind the relevant
processor without changing the transport envelope.

Importing this package does not read environment variables or connect to
Redis. `loadQueueConfig()` reads `REDIS_URL` only when a producer first
enqueues work or the worker starts its consumers. `QUEUE_PREFIX` is optional
and defaults to `saas-template`.

Each job carries a generated or propagated request ID and may carry user,
organization, and workspace IDs. It never carries a session ID, cookie,
password, or session token. Workers validate the complete envelope before
restoring this context.

`publishPlatformEvent()` in the API maps the two current event intents to the
same durable jobs. No separate unconsumed event queue exists in this
foundation.
