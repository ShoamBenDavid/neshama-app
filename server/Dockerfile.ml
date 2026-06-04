FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV ML_LOAD_ON_STARTUP=1

COPY ml-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service ./ml-service
COPY src/assets ./src/assets

WORKDIR /app/ml-service

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--timeout", "180", "app:app"]
