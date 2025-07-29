# Using Podman

## Requirements

* `podman >=5.x`

## Steps

1. `podman build -t pokerogue -f Dockerfile .`
2. `podman run --rm -p 8000:8000 localhost/pokerogue`
3. Visit `http://localhost:8000/`
