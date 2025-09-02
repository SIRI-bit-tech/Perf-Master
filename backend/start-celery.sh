#!/bin/bash

# Start Celery worker
celery -A perfmaster worker --loglevel=info --concurrency=4 &

# Start Celery beat (scheduler)
celery -A perfmaster beat --loglevel=info &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
