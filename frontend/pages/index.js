import React, {useState, useEffect} from 'react';
import Link from 'next/link';

export default function Home(){
  const [file, setFile] = useState(null);
  const [contractId, setContractId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recent, setRecent] = useState([]);

  useEffect(()=>{ fetchRecent() },[]);

  async function fetchRecent(){
    try{
      const r = await fetch('http://localhost:8000/contracts');
      const j = await r.json();
      setRecent(j.items || []);
    }catch(e){}
  }

  const upload = async () => {
    if(!file) return alert("Pick a PDF");
    setUploading(true); setProgress(5);
    const fd = new FormData();
    fd.append("file", file);
    try{
      const res = await fetch("http://localhost:8000/contracts/upload", {method:"POST", body: fd});
      const j = await res.json();
      setContractId(j.contract_id);
      setProgress(20);
      const id = j.contract_id;
      const start = Date.now();
      while(true){
        const s = await fetch(`http://localhost:8000/contracts/${id}/status`);
        const js = await s.json();
        setProgress(js.progress || 0);
        if(js.status === 'completed') break;
        if(js.status === 'failed') { alert('Processing failed'); break; }
        await new Promise(r => setTimeout(r, 800));
        if(Date.now() - start > 120000) break;
      }
      setUploading(false);
      setProgress(100);
      fetchRecent();
    }catch(e){
      alert('Upload failed: '+e.message);
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Contract Intelligence — Sample4</h1>
        <p className="text-sm text-gray-600 mb-4">Upload a PDF and view parsed contract details.</p>

        <div className="mb-4">
          <label className="label block mb-1">Select PDF</label>
          <input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} />
        </div>
        <div className="flex gap-3">
          <button className="btn" onClick={upload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload & Parse'}</button>
          {contractId && <Link href={`/contract/${contractId}`} className="btn-secondary">View Results</Link>}
        </div>

        {uploading && <div className="mt-4">
          <div className="text-sm text-gray-600">Processing: {progress}%</div>
          <div className="w-full bg-gray-200 rounded h-2 mt-2"><div style={{width: progress + '%'}} className="bg-indigo-600 h-2 rounded"></div></div>
        </div>}

      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Recent contracts</h2>
        <div className="grid grid-cols-1 gap-4">
          {recent.length===0 && <div className="card">No recent contracts found.</div>}
          {recent.map(r=>(
            <div key={r.id} className="card flex justify-between items-center">
              <div>
                <div className="font-medium">{r.filename}</div>
                <div className="text-sm text-gray-500">Status: {r.status} — {r.progress}%</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/contract/${r.id}`} className="btn-secondary">View</Link>
                <a className="btn" href={`http://localhost:8000/contracts/${r.id}/download`}>Download</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
