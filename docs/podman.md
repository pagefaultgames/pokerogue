# Using Podman

## Requirements

* `podman >=5.x`

## Steps

1. `podman build -t pokerogue -f Dockerfile .`
2. `podman run --rm -p 8000:8000 -v $(pwd):/app:Z --userns=keep-id -u $(id -u):$(id -g) localhost/pokerogue`
3. Visit `http://localhost:8000/`

Note: `podman run` may take a couple of minutes to mount the working directory