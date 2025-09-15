# Using Podman

## Requirements

* `podman >=5.x`

## Steps

1. `podman build -t pokerogue -f Dockerfile .`
2. `podman create --name temp-pokerogue localhost/pokerogue`
3. `podman cp temp-pokerogue:/app/node_modules ./`
4. `podman cp temp-pokerogue:/app/public/locales ./public/`
5. `podman rm temp-pokerogue`
6. `podman run --rm -p 8000:8000 -v $(pwd):/app:Z --userns=keep-id -u $(id -u):$(id -g) localhost/pokerogue`
7. Visit `http://localhost:8000/`

Note: 

1. Steps 2,3,4 are required because mounting working directory without installed `node_modules/` and assets locally will be empty,
this way we prevent it by copying them from the container itself to local directory

2. `podman run` may take a couple of minutes to mount the working directory

### Running tests inside container

`podman run --rm -p 8000:8000 -v $(pwd):/app:Z --userns=keep-id -u $(id -u):$(id -g) localhost/pokerogue pnpm test:silent
`