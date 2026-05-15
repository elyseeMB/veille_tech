FROM public.ecr.aws/lambda/python:3.12

WORKDIR /var/task

COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY shared.py      .
COPY container.py   .
COPY app.py         .
COPY articles/      articles/
COPY scraper/       scraper/
COPY processing/    processing/
COPY db/            db/

CMD ["app.handler"]
