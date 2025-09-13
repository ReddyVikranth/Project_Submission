from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid, os, shutil, threading, time, json
from . import storage, processor, schemas

app = FastAPI(title="Contract Intelligence Parser - Sample4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000","*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.environ.get("DATA_DIR", "/data")
os.makedirs(DATA_DIR, exist_ok=True)

@app.post("/contracts/upload")
async def upload_contract(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted in this sample.")
    contract_id = str(uuid.uuid4())
    save_path = storage.save_file(DATA_DIR, contract_id, file)
    storage.create_record(DATA_DIR, contract_id, filename=file.filename)
    threading.Thread(target=processor.process_contract, args=(DATA_DIR, contract_id, save_path), daemon=True).start()
    return {"contract_id": contract_id}

@app.get("/contracts/{contract_id}/status")
def get_status(contract_id: str):
    record = storage.get_record(DATA_DIR, contract_id)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"status": record.get("status"), "progress": record.get("progress", 0), "error": record.get("error")}

@app.get("/contracts/{contract_id}")
def get_contract(contract_id: str):
    record = storage.get_record(DATA_DIR, contract_id)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")
    if record.get("status") != "completed":
        raise HTTPException(status_code=409, detail="Processing not completed")
    return record.get("data", {})

@app.get("/contracts")
def list_contracts(skip: int = 0, limit: int = 20):
    items = storage.list_records(DATA_DIR)
    return {"total": len(items), "items": items[skip:skip+limit]}

@app.get("/contracts/{contract_id}/download")
def download(contract_id: str):
    record = storage.get_record(DATA_DIR, contract_id)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")
    path = record.get("file_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=record.get("filename"))
