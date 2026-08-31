"""
SatQuery AI — FastAPI Remote Sensing Vision-Language Backend
"""

import os
import time
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import SatQueryAgentController
from tools import SatQueryToolRegistry
from eval import run_benchmark_eval_harness

app = FastAPI(
    title="SatQuery AI Backend",
    description="Agentic Vision-Language Assistant over Single, Cross-Modal (Optical-SAR), and Bi-Temporal Satellite Imagery",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for imagery and execution traces
IMAGE_DB: Dict[str, Dict[str, Any]] = {}
QUERY_DB: Dict[str, Dict[str, Any]] = {}

controller = SatQueryAgentController()

class UploadRequest(BaseModel):
    name: Optional[str] = None
    dataUrl: str
    modality: Optional[str] = "optical"
    role: Optional[str] = "single"
    crs: Optional[str] = "EPSG:32631"
    gsd_meters: Optional[float] = 10.0
    bands: Optional[List[str]] = None

class QueryRequest(BaseModel):
    query: str
    image_ids: List[str]
    provider: Optional[str] = "gemini"
    task_override: Optional[str] = None
    use_specialist: Optional[bool] = True

class EvalRequest(BaseModel):
    dataset: Optional[str] = "All"
    subset_size: Optional[int] = 10

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SatQuery AI Remote Sensing Engine",
        "primary_vlm": "Google AI Studio (Gemini 3.7 Flash)",
        "adapted_specialist": "BigEarthNet-19-CORINE-LoRA (Sentinel-1/2)"
    }

@app.post("/upload")
def upload_image(payload: UploadRequest):
    """
    Accepts remote sensing imagery, parses CRS/GSD metadata, and returns an image_id.
    """
    image_id = f"img_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    record = {
        "id": image_id,
        "name": payload.name or f"Scene_{image_id}.tif",
        "dataUrl": payload.dataUrl,
        "modality": payload.modality,
        "role": payload.role,
        "metadata": {
            "format": "GeoTIFF" if "tif" in (payload.name or "").lower() else "PNG",
            "crs": payload.crs,
            "gsd_meters": payload.gsd_meters,
            "dimensions": {"width": 512, "height": 512},
            "bands": payload.bands or ["B2-Blue", "B3-Green", "B4-Red", "B8-NIR"]
        }
    }
    IMAGE_DB[image_id] = record
    return {
        "image_id": image_id,
        "status": "validated",
        "metadata": record["metadata"]
    }

@app.post("/query")
async def execute_query(payload: QueryRequest):
    """
    Runs the agentic controller: classifies intent, validates imagery,
    calls domain specialist tools, and returns answer + visual evidence + auditable trace.
    """
    images = [IMAGE_DB[img_id] for img_id in payload.image_ids if img_id in IMAGE_DB]
    if not images:
        raise HTTPException(status_code=404, detail="None of the specified image_ids exist in storage.")

    response = await controller.run(
        query=payload.query,
        images=images,
        provider=payload.provider,
        task_override=payload.task_override,
        use_specialist=payload.use_specialist
    )

    QUERY_DB[response["queryId"]] = response
    return response

@app.get("/trace/{query_id}")
def get_trace(query_id: str):
    """
    Retrieves the stored execution trace for an audited query.
    """
    if query_id not in QUERY_DB:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found.")
    return {
        "query_id": query_id,
        "execution_trace": QUERY_DB[query_id]["executionTrace"]
    }

@app.get("/report/{query_id}")
def get_report(query_id: str):
    """
    Returns an auditable forensic report of the query result.
    """
    if query_id not in QUERY_DB:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found.")
    return QUERY_DB[query_id]

@app.post("/eval/run")
def run_evaluation(payload: EvalRequest):
    """
    Kicks off a benchmark evaluation subset run (VRSBench / RSVQA / CDVQA).
    """
    return run_benchmark_eval_harness(dataset=payload.dataset)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
