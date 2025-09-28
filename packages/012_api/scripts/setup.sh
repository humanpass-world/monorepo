#!/bin/bash

# # Check if queue exists before creating
# if ! npx wrangler queues list | grep -q "review-analysis"; then
#     npx wrangler queues create review-analysis
# else
#     echo "Queue 'review-analysis' already exists, skipping creation"
# fi

# if ! npx wrangler queues list | grep -q "sync-review"; then
#     npx wrangler queues create sync-review
# else
#     echo "Queue 'sync-review' already exists, skipping creation"
# fi

# if ! npx wrangler queues list | grep -q "review-comment-gen"; then
#     npx wrangler queues create review-comment-gen
# else
#     echo "Queue 'review-comment-gen' already exists, skipping creation"
# fi

# if ! npx wrangler queues list | grep -q "sync-auth-data"; then
#     npx wrangler queues create sync-auth-data
# else
#     echo "Queue 'sync-auth-data' already exists, skipping creation"
# fi

# npx wrangler secrets-store secret create local \
#   --name 88-ai_openai_default \
#   --value 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 \
#   --scopes workers