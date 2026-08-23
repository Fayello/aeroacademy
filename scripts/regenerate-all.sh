#!/bin/bash
# Map old lab UUIDs to new ones and generate all flag SQL

cd "$(dirname "$0")"

# Create temp copies with replaced IDs
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Old → New mapping
declare -A MAP
# expand-labs.js
MAP['08587d88-0e1c-4858-8e4f-03c79c619559']='322a1e1c-b550-4cdb-b3f2-b7d59f9f503a'  # Ubuntu CLI
MAP['f74e1aaf-05e3-4793-aeea-c7eee726375c']='def2c670-6ec3-4a82-8df9-e1b74237df6e'  # File Permissions
MAP['3f3af78b-3f18-4278-8bf8-bc42181f0d24']='e5b52cdf-1435-4b77-896a-41a270c88021'  # Text Processing
MAP['88ca76ae-9628-4095-b15d-3e0a9f33037e']='989bd7ac-13fd-4e6f-b502-3ff3b334c350'  # Process & Service

# gen-batch2.js
MAP['8686b9c7-89cc-4e1f-b698-b61fc113511f']='d4eb2f04-7abb-485c-94ae-d6aa46e99935'  # Storage & Filesystems
MAP['a654ad57-7a70-4644-b8a5-01ef8a04146f']='eb5f9027-80b5-4611-a37d-b3223cf314d2'  # Backup & Disaster Recovery
MAP['9bee7f1b-7afa-493a-9eec-31b006e07da1']='884ee166-21d8-4336-a519-6ccdf111068c'  # Network Security
MAP['174408c2-8db3-4dfc-80f0-ee27f14963f9']='e0decd06-4a2e-4f94-965a-79854928514d'  # DNS Server

# gen-batch3.js
MAP['4e2ae291-a334-4a47-ac1d-5401bfb786b8']='db2d2817-5c84-4d6e-b1a7-2e1051fee251'  # Git & Gitea
MAP['1c30ccdf-1ad5-41e0-adb5-5dcba2071a7b']='ea46a43d-c6a5-40e9-93bb-e7f40f2a8572'  # Ansible

# gen-batch4.js
MAP['db139ece-545f-4e2c-8b1d-df7107282748']='91168c5d-2af5-4998-b0aa-5480fa2b43da'  # Monitoring Stack
MAP['81f17397-99f6-4313-b3f8-85897ba428c5']='4a07684f-30df-4ece-b9bc-57a2727769d4'  # Centralized Logging
MAP['4e473789-f3ec-4fe2-9980-b0a400d9a8d4']='19796c88-1a0a-4c0c-ba7d-4422edecb4fe'  # Kubernetes

# gen-batch5.js
MAP['cf79bf69-769f-4d51-8adb-1011c9d64c4c']='39444481-c0f1-4af3-9ac9-7223c18963a7'  # CentOS
MAP['83fc5040-43df-4f8a-93b9-53595004d3ae']='f6d4f425-9d67-4506-ae35-c713d671e033'  # Debian Hardening
MAP['4511f517-8fdd-49b9-8e82-7be58e87f4b9']='8cb79cf7-a12b-4e99-a050-9f067f2b604d'  # Kernel Internals

# gen-docker*.js
MAP['c66a327d-7fa7-480c-ba2a-5b94d6216d6d']='8f5af76d-8355-42dd-bbd2-37a10a896dc1'  # Docker

# gen-mysql.js
MAP['a8fac5e7-9113-42af-87b9-3bcd48ac27e7']='11dc0358-43a4-4f7c-b6eb-e12274be5ff9'  # MySQL

# gen-nginx.js
MAP['8fa2d12b-24a6-4d3b-8c12-62e88f4a89dc']='50d6a493-7898-473d-8287-137229593da9'  # Nginx

# gen-postgres.js
MAP['993d7511-1cc8-48e1-a817-9a73b1425405']='88de7b45-d1c8-4d13-97df-66805199f591'  # PostgreSQL

echo "=== Updating script IDs ==="
for script in expand-labs.js gen-batch2.js gen-batch3.js gen-batch4.js gen-batch5.js gen-docker.js gen-mysql.js gen-nginx.js gen-postgres.js; do
  if [ -f "$script" ]; then
    cp "$script" "$TMPDIR/$script"
    for old in "${!MAP[@]}"; do
      new="${MAP[$old]}"
      sed -i "s/$old/$new/g" "$TMPDIR/$script"
    done
    echo "Updated: $script"
  fi
done

echo ""
echo "=== Running scripts and collecting SQL ==="
OUTPUT="../all-flags.sql"
echo "-- All expanded lab flags" > "$OUTPUT"
echo "-- Generated $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

TOTAL=0
for script in "$TMPDIR"/expand-labs.js "$TMPDIR"/gen-batch*.js "$TMPDIR"/gen-docker.js "$TMPDIR"/gen-mysql.js "$TMPDIR"/gen-nginx.js "$TMPDIR"/gen-postgres.js; do
  if [ -f "$script" ]; then
    COUNT=$(node "$script" 2>/dev/null | grep -c "INSERT INTO")
    node "$script" 2>/dev/null >> "$OUTPUT"
    TOTAL=$((TOTAL + COUNT))
    echo "  $(basename $script): $COUNT flags"
  fi
done

echo ""
echo "=== Total: $TOTAL new flags ==="
echo "=== SQL written to $OUTPUT ==="
