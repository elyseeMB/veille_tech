FROM public.ecr.aws/lambda/python:3.12

WORKDIR /var/task

ENV NUMBA_CACHE_DIR=/tmp/numba_cache

COPY requirements.txt .

RUN pip install -r requirements.txt --no-cache-dir && \
    python -m compileall -b /var/lang/lib/python3.12/site-packages || true

COPY shared.py      .
COPY container.py   .
COPY app.py         .
COPY articles/      articles/
COPY scraper/       scraper/
COPY processing/    processing/
COPY db/            db/


CMD ["app.handler"]