from pydantic import BaseModel
from typing import Any, Dict

class ContractData(BaseModel):
    extracted: Dict[str, Any]
    score: int
