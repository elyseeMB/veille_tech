FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENTRYPOINT [ "/var/lang/bin/python", "-m", "awslambdaric" ]
CMD ["app.handler"]
