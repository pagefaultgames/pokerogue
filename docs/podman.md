# Using with Podman

1. `podman build -t pokerogue:1.0 -f Dockerfile .`
2. `podman run --rm -p 8000:8000 localhost/pokerogue:1.0`
3. Visit `http://localhost:8000/`

