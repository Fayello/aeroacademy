#!/bin/bash
# Lab Testing Script — tests each lab container can start, exec, and run commands
# Run from the server host

PASS=0
FAIL=0
SKIP=0
ERRORS=""

echo "Starting lab tests..."
echo "==================="

# Get all labs from DB
LABS=$(sudo docker compose -f /root/aeroacademy/docker-compose.yml exec -T db psql -U user -d aeroacademy -t -A -c "
SELECT l.id, l.title, l.\"dockerImage\", l.difficulty,
  (SELECT COUNT(*) FROM \"LabFlag\" f WHERE f.\"labId\" = l.id) as flag_count
FROM \"Lab\" l ORDER BY l.title
")

TOTAL=$(echo "$LABS" | wc -l)
INDEX=0

echo "$LABS" | while IFS='|' read -r ID TITLE IMAGE DIFFICULTY FLAGS; do
  INDEX=$((INDEX + 1))
  CONTAINER_NAME="test-$(echo $ID | cut -c1-8)"
  
  # Check if image exists locally
  if ! sudo docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "[$INDEX/$TOTAL] SKIP: $TITLE (image $IMAGE not local)"
    SKIP=$((SKIP + 1))
    continue
  fi
  
  # Detect service images (run their native CMD, don't override with tail)
  IMAGE_LOWER=$(echo "$IMAGE" | tr '[:upper:]' '[:lower:]')
  IS_SERVICE=0
  for SVC in juice-shop webgoat nodegoat dvwa vapi grafana prometheus nginx redis postgres mongo elasticsearch; do
    if echo "$IMAGE_LOWER" | grep -q "$SVC"; then
      IS_SERVICE=1
      break
    fi
  done

  # Start container — service images get their native CMD, others get tail -f
  if [ $IS_SERVICE -eq 1 ]; then
    CID=$(sudo docker run -d --name "$CONTAINER_NAME" --rm "$IMAGE" 2>&1)
  else
    CID=$(sudo docker run -d --name "$CONTAINER_NAME" --rm "$IMAGE" tail -f /dev/null 2>&1)
  fi
  if [ $? -ne 0 ]; then
    echo "[$INDEX/$TOTAL] FAIL: $TITLE — container start failed"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  - $TITLE: container start failed"
    continue
  fi
  
  # Wait for container — service images need more time to initialize
  if [ $IS_SERVICE -eq 1 ]; then
    sleep 5
  else
    sleep 2
  fi
  
  # Check running
  STATUS=$(sudo docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null)
  if [ "$STATUS" != "running" ]; then
    echo "[$INDEX/$TOTAL] FAIL: $TITLE — status=$STATUS"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  - $TITLE: not running (status=$STATUS)"
    sudo docker rm -f "$CONTAINER_NAME" 2>/dev/null
    continue
  fi
  
  # Test exec
  EXEC_OUT=$(sudo docker exec "$CONTAINER_NAME" echo "EXEC_OK" 2>&1)
  if echo "$EXEC_OUT" | grep -q "EXEC_OK"; then
    # Test whoami
    WHO=$(sudo docker exec "$CONTAINER_NAME" whoami 2>&1)
    if [ -n "$WHO" ]; then
      echo "[$INDEX/$TOTAL] PASS: $TITLE (image=$IMAGE, flags=$FLAGS, diff=$DIFFICULTY)"
      PASS=$((PASS + 1))
    else
      echo "[$INDEX/$TOTAL] FAIL: $TITLE — whoami empty"
      FAIL=$((FAIL + 1))
      ERRORS="$ERRORS\n  - $TITLE: whoami empty"
    fi
  else
    echo "[$INDEX/$TOTAL] FAIL: $TITLE — exec failed"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  - $TITLE: exec failed"
  fi
  
  # Stop container
  sudo docker rm -f "$CONTAINER_NAME" 2>/dev/null
done

echo ""
echo "==================="
echo "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"
echo "Total: $TOTAL"
if [ -n "$ERRORS" ]; then
  echo -e "\nFailed labs:$ERRORS"
fi
