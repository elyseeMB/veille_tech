from abc import ABC, abstractmethod
from shared import Result


class AbstractAudioSynthesizer(ABC):
    @abstractmethod
    def synthesize(self, text: str) -> Result[bytes]: ...
