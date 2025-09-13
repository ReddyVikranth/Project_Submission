from fastapi.testclient import TestClient
from backend.app.main import app
import io

client = TestClient(app)

def test_upload_and_status():
    data = {"file": ("contract.pdf", io.BytesIO(b"%PDF-1.4 sample"), "application/pdf")}
    r = client.post("/contracts/upload", files=data)
    assert r.status_code == 200
    j = r.json()
    cid = j["contract_id"]
    s = client.get(f"/contracts/{cid}/status")
    assert s.status_code == 200
    assert s.json()["status"] in ("pending","processing")
