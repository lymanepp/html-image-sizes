FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh .
COPY run.py .

RUN chmod +x entrypoint.sh

ENV PATH="/app:$PATH"

CMD ["/app/entrypoint.sh"]