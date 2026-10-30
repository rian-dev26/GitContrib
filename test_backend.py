"""Test backend connection and identify issues."""

import sys
import requests
import json

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TESTING GITCONTRIB BACKEND")
print("=" * 60)

# Test 1: Health check
print("\n[1/3] Health Check...")
try:
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"✓ Status: {resp.status_code}")
    print(f"  Response: {resp.json()}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Login
print("\n[2/3] Authentication (Login)...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "test", "password": "pass"},
        timeout=5
    )
    print(f"✓ Status: {resp.status_code}")
    data = resp.json()
    print(f"  Response: {json.dumps(data, indent=2)}")
    token = data.get("access_token")
except Exception as e:
    print(f"✗ Error: {e}")
    token = None

# Test 3: Analyze endpoint
print("\n[3/3] Analyze Repository...")
if token:
    try:
        resp = requests.post(
            f"{BASE_URL}/api/analyze",
            json={
                "repo_url": "https://github.com/octocat/Hello-World.git",
                "limit": 100
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        print(f"✓ Status: {resp.status_code}")
        data = resp.json()
        print(f"  Response: {json.dumps(data, indent=2)}")
        job_id = data.get("job_id")
        
        # Test status check
        if job_id:
            import time
            print(f"\n[Bonus] Checking job status...")
            for _ in range(10):
                time.sleep(1)
                resp2 = requests.get(f"{BASE_URL}/api/jobs/{job_id}", timeout=5)
                job_data = resp2.json()
                print(f"  Progress: {job_data.get('progress')}% - Status: {job_data.get('status')}")
                if job_data.get("status") in ["completed", "failed"]:
                    break
            
            if job_data.get("status") == "completed":
                print(f"\n[Bonus] Getting results...")
                resp3 = requests.get(f"{BASE_URL}/api/results/{job_id}", timeout=5)
                res_data = resp3.json()
                print(f"✓ Repo: {res_data.get('repo_name')}")
                print(f"  Total Contributors: {len(res_data.get('contributors', []))}")
                print(f"  Total Commits: {len(res_data.get('commits', []))}")
    except Exception as e:
        print(f"✗ Error: {e}")
else:
    print("✗ Skipped (no token)")

print("\n" + "=" * 60)
print("TESTING COMPLETE")
print("=" * 60)
