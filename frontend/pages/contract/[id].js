import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';

function Section({title, children}) {
  return <div className="card mb-4">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div>{children}</div>
  </div>
}

export default function Contract(){
  const router = useRouter();
  const {id} = router.query;
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!id) return;
    let stopped = false;
    async function poll(){
      setLoading(true);
      while(!stopped){
        const s = await fetch(`http://localhost:8000/contracts/${id}/status`);
        if(!s.ok) break;
        const js = await s.json();
        setStatus(js);
        if(js.status === 'completed'){
          const d = await fetch(`http://localhost:8000/contracts/${id}`);
          if(d.ok) setData(await d.json());
          break;
        }
        if(js.status === 'failed') break;
        await new Promise(r=>setTimeout(r,1000));
      }
      setLoading(false);
    }
    poll();
    return ()=>{ stopped = true; }
  },[id]);

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="btn-secondary">← Back</Link>
        <h1 className="text-2xl font-bold">Contract Results</h1>
        <a className="btn" href={`http://localhost:8000/contracts/${id}/download`}>Download PDF</a>
      </div>

      <div className="card mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Contract ID</div>
            <div className="font-mono text-sm">{id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium">{status ? status.status : '—'} {status && `— ${status.progress}%`}</div>
          </div>
        </div>
      </div>

      {loading && <div className="card">Processing... {status && `${status.progress}%`}</div>}

      {data && <>
        <Section title={"Confidence"}>
          <div className="text-xl font-semibold">{data.score}%</div>
        </Section>

        <Section title={"Parties"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.extracted.parties.map((p,idx)=>(
              <div key={idx} className="p-3 border rounded">
                <div className="text-sm text-gray-500">{p.role}</div>
                <div className="font-medium">{p.name}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={"Financials"}>
          <div>
            <div className="mb-2">Total: <strong>{data.extracted.financials.currency} {data.extracted.financials.total_value}</strong></div>
            <div className="text-sm text-gray-600">Line items:</div>
            <ul className="list-disc pl-5">
              {data.extracted.financials.line_items.map((li, i)=>(
                <li key={i}>{li.desc} — {li.qty} × {li.unit_price}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title={"Payment Terms"}>
          <div>Term: <strong>{data.extracted.payment_terms.term}</strong></div>
          <div className="text-sm text-gray-600">Schedule: {data.extracted.payment_terms.schedule}</div>
        </Section>

        <Section title={"SLA"}>
          <div>Availability: <strong>{data.extracted.sla.availability}</strong></div>
          <div>Penalty: {data.extracted.sla.penalty}</div>
        </Section>

        <Section title={"Contacts"}>
          <ul>
            {data.extracted.contacts.map((c,i)=>(
              <li key={i}>{c.type} — {c.email}</li>
            ))}
          </ul>
        </Section>

        <Section title={"Raw JSON"}>
          <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
        </Section>
      </>}

    </div>
  );
}
