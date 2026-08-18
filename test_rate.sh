#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@aeroacademy.com","password":"Admin123!"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
echo "Token: ${TOKEN:0:20}..."

echo "5 rapid progress (backend direct):"
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost:4000/progress/course/777a8fe3-5c6b-4036-869c-5ff311c7dad7 &
done
wait
echo

echo "5 rapid progress (via nginx):"
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/progress/course/777a8fe3-5c6b-4036-869c-5ff311c7dad7 &
done
wait
echo

echo "35 rapid mixed dashboard API (via nginx):"
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/courses/ &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/dashboard/user-stats &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/dashboard/activity &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/dashboard/active-labs &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/dashboard/global-activity &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/progress/course/777a8fe3-5c6b-4036-869c-5ff311c7dad7 &
  curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $TOKEN" http://localhost/progress/course/1403df83-3aed-4bea-9894-494218b86d45 &
done
wait
echo
