FROM python:3.14-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

ENV FLASK_APP=app.py

# Using gunicorn is better for production, but using app.py for simplicity
CMD ["python", "app.py"]
