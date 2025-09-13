import time, os, random
from . import storage

def _mock_extract(file_path):
    base = os.path.basename(file_path)
    return {
        "parties": [{"role": "customer", "name": "Acme Corp"}, {"role": "vendor", "name": "Example Solutions"}],
        "financials": {"currency": "USD", "total_value": 125000.00, "line_items": [{"desc":"Service A","qty":12,"unit_price":1000.0}]},
        "payment_terms": {"term": "Net 30", "schedule": "Monthly"},
        "sla": {"availability": "99.9%", "penalty": "5%"},
        "contacts": [{"type":"billing","email":"billing@acme.example"}],
    }

def process_contract(data_dir, contract_id, file_path):
    storage.update_record(data_dir, contract_id, {"status":"processing", "progress":5})
    try:
        for p in [15, 35, 60, 85]:
            time.sleep(0.5)
            storage.update_record(data_dir, contract_id, {"progress": p})
        extracted = _mock_extract(file_path)
        score = 0
        if extracted.get("financials"): score += 30
        if extracted.get("parties"): score += 25
        if extracted.get("payment_terms"): score += 20
        if extracted.get("sla"): score += 15
        if extracted.get("contacts"): score += 10
        confidence = min(100, score - random.randint(0,10))
        data = {"extracted": extracted, "score": confidence}
        storage.update_record(data_dir, contract_id, {"status":"completed", "progress":100, "data": data})
    except Exception as e:
        storage.update_record(data_dir, contract_id, {"status":"failed", "error": str(e)})
