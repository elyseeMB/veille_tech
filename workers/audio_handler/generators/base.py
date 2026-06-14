from abc import ABC, abstractmethod
from shared import Result


class AbstractNarrativeGenerator(ABC):
    @abstractmethod
    def generate(self, run_date: str, clusters: list) -> Result[str]: ...
