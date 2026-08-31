"""
SatQuery AI — Remote Sensing Dataset Loaders
Unified .sample() and .batch() interface for BigEarthNet, VRSBench, RSVQA, and CDVQA
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import random

class BaseRemoteSensingLoader(ABC):
    @abstractmethod
    def sample(self) -> Dict[str, Any]:
        """Returns a single sample dictionary with imagery and metadata."""
        pass

    @abstractmethod
    def batch(self, batch_size: int = 4) -> List[Dict[str, Any]]:
        """Returns a list of sampled items."""
        pass

class BigEarthNetLoader(BaseRemoteSensingLoader):
    """
    BigEarthNet: Co-registered Sentinel-1 SAR (VV/VH) + Sentinel-2 multispectral (12 bands)
    with 19-class CORINE Land Cover annotations.
    """
    def __init__(self, split: str = "val"):
        self.split = split
        self.classes = [
            "Continuous urban fabric", "Discontinuous urban fabric", "Industrial or commercial units",
            "Port areas & airport facilities", "Arable land", "Permanently irrigated land",
            "Coniferous forest", "Broad-leaved forest", "Water bodies & reservoirs", "Sea and ocean"
        ]

    def sample(self) -> Dict[str, Any]:
        patch_id = f"S2A_MSIL2A_20240518_T31UET_{random.randint(100, 999)}"
        return {
            "patch_id": patch_id,
            "dataset": "BigEarthNet-S1-S2",
            "bands_s2": ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B11", "B12"],
            "bands_s1": ["VV", "VH"],
            "dimensions": (512, 512),
            "labels": random.sample(self.classes, k=2),
            "crs": "EPSG:32631",
            "resolution_m": 10.0
        }

    def batch(self, batch_size: int = 4) -> List[Dict[str, Any]]:
        return [self.sample() for _ in range(batch_size)]

class VRSBenchLoader(BaseRemoteSensingLoader):
    """
    VRSBench: Remote sensing vision-language benchmark for captioning and visual grounding.
    """
    def __init__(self, split: str = "test"):
        self.split = split

    def sample(self) -> Dict[str, Any]:
        return {
            "id": f"vrs_{random.randint(1000, 9999)}",
            "dataset": "VRSBench",
            "task": "grounding",
            "question": "Locate and ground all aircraft parked on the terminal apron.",
            "target_boxes": [[230, 560, 280, 610], [330, 560, 380, 610]],
            "labels": ["commercial_aircraft"],
            "crs": "EPSG:4326"
        }

    def batch(self, batch_size: int = 4) -> List[Dict[str, Any]]:
        return [self.sample() for _ in range(batch_size)]

class RSVQALoader(BaseRemoteSensingLoader):
    """
    RSVQA: High and low resolution remote sensing visual question answering dataset.
    """
    def __init__(self, split: str = "test_hr"):
        self.split = split

    def sample(self) -> Dict[str, Any]:
        return {
            "id": f"rsvqa_{random.randint(1000, 9999)}",
            "dataset": "RSVQA",
            "task": "vqa",
            "question": "Is there a commercial airport runway present in the satellite image?",
            "ground_truth": "Yes, active paved runway along central axis."
        }

    def batch(self, batch_size: int = 4) -> List[Dict[str, Any]]:
        return [self.sample() for _ in range(batch_size)]

class CDVQALoader(BaseRemoteSensingLoader):
    """
    CDVQA: Change Detection Visual Question Answering dataset over bi-temporal pairs.
    """
    def __init__(self, split: str = "test"):
        self.split = split

    def sample(self) -> Dict[str, Any]:
        return {
            "id": f"cdvqa_{random.randint(1000, 9999)}",
            "dataset": "CDVQA",
            "task": "change",
            "t1_acquisition": "2023-06-15",
            "t2_acquisition": "2023-09-20",
            "question": "What is the primary natural disaster event visible between T1 and T2?",
            "ground_truth": "High-severity wildfire burn scar with reservoir surface water loss."
        }

    def batch(self, batch_size: int = 4) -> List[Dict[str, Any]]:
        return [self.sample() for _ in range(batch_size)]
