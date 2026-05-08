FROM golang:1.25-bookworm

RUN apt-get update && apt-get install -y \
    git curl make zip unzip \
    postgresql-client python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws/

RUN pip3 install aws-sam-cli --break-system-packages

WORKDIR /workspace
