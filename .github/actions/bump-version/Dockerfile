FROM python:3.12-slim

# Set the working directory
WORKDIR /action/workspace

# Copy the script into the container
COPY . /action/workspace/

ENTRYPOINT ["/action/workspace/entrypoint.sh"]
