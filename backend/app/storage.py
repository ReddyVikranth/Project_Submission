import os, json

def _records_dir(data_dir):
    d = os.path.join(data_dir, "records")
    os.makedirs(d, exist_ok=True)
    return d

def save_file(data_dir, contract_id, upload_file):
    files_dir = os.path.join(data_dir, "files")
    os.makedirs(files_dir, exist_ok=True)
    dest = os.path.join(files_dir, f"{contract_id}.pdf")
    with open(dest, "wb") as f:
        f.write(upload_file.file.read())
    return dest

def create_record(data_dir, contract_id, filename):
    r = {"id": contract_id, "filename": filename, "status": "pending", "progress": 0, "file_path": os.path.join(data_dir, "files", f"{contract_id}.pdf")}
    path = os.path.join(_records_dir(data_dir), f"{contract_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(r, f)
    return r

def _record_path(data_dir, contract_id):
    return os.path.join(_records_dir(data_dir), f"{contract_id}.json")

def get_record(data_dir, contract_id):
    p = _record_path(data_dir, contract_id)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def update_record(data_dir, contract_id, patch: dict):
    r = get_record(data_dir, contract_id)
    if not r:
        return None
    r.update(patch)
    with open(_record_path(data_dir, contract_id), "w", encoding="utf-8") as f:
        json.dump(r, f)
    return r

def list_records(data_dir):
    d = _records_dir(data_dir)
    items = []
    for fn in sorted(os.listdir(d), reverse=True):
        if fn.endswith(".json"):
            with open(os.path.join(d, fn), "r", encoding="utf-8") as f:
                items.append(json.load(f))
    return items
