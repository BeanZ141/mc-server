# Dockerfile for mc-panel
FROM python:3.12-slim

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Kolkata

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

# Create non-root user and runtime directories
RUN groupadd -g 1000 mcadmin && \
    useradd -u 1000 -g mcadmin -s /bin/sh -m mcadmin && \
    mkdir -p /data /server-data /stacks /run/mc-watch /run/mc-admin-helper /backups && \
    chown -R mcadmin:mcadmin /app /data

USER 1000:1000

EXPOSE 3555

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:3555/healthz',timeout=4).status==200 else 1)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3555", "--proxy-headers", "--forwarded-allow-ips=172.17.0.1"]
