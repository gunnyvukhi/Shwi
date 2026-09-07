FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if required by any python packages (like mysqlclient)
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

# Using gunicorn is better for production, but using app.py for simplicity
CMD ["python", "app.py"]
