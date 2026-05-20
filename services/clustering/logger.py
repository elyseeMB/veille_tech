import logging
import os


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        level = (
            logging.DEBUG if os.getenv("ENVIRONMENT") != "production" else logging.INFO
        )
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s — %(message)s", datefmt="%H:%M:%S"
            )
        )
        logger.setLevel(level)
        logger.addHandler(handler)
    return logger
