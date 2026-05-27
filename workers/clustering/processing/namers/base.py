from abc import ABC, abstractmethod
from json_repair import repair_json
import json
from typing import List, Union
from pydantic import BaseModel
from shared import Result, NamingResult, NamingResultGemini
from logger import get_logger

log = get_logger("processing.namers.base")


class NamingInput(BaseModel):
    titles: List[str]
    excerpts: List[str] = []


class ClusterInput(BaseModel):
    index: int
    titles: List[str]
    excerpts: List[str] = []


class BatchNamingInput(BaseModel):
    clusters: List[ClusterInput]


class BatchNamingResult(BaseModel):
    results: List[Union[NamingResultGemini, NamingResult]]


def extract_first_json(text: str) -> dict:
    repaired = repair_json(text)
    return json.loads(repaired)


class BaseNamer(ABC):
    @abstractmethod
    def generate(self, input: NamingInput) -> Result[NamingResult]:
        pass

    def generate_batch(self, input: BatchNamingInput) -> Result[BatchNamingResult]:
        results = []
        for cluster in input.clusters:
            result = self.generate(
                NamingInput(
                    titles=cluster.titles,
                    excerpts=cluster.excerpts,
                )
            )
            if not result.success:
                results.append(NamingResult(label="Unnamed Cluster", description=""))
            else:
                results.append(result.value)
        return Result.ok(BatchNamingResult(results=results))

    def _clean_label(self, label: str) -> str:
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix) :].strip()

        words = label.split()[:4]
        result = " ".join(words) if words else "Unnamed Cluster"
        result = result.lower()

        log.debug(f"_clean_label: '{label}' → '{result}'")

        return result
