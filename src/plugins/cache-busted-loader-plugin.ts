let manifest: object;

export default class CacheBustedLoaderPlugin extends Phaser.Loader.LoaderPlugin {
    constructor(scene: Phaser.Scene) {
        super(scene)
    }

    get manifest() {
        return manifest;
    }

    set manifest(manifestObj: object) {
        manifest = manifestObj;
    }

    addFile(file): void {
        if (!Array.isArray(file))
            file = [ file ];
    
        file.forEach(item => {
            if (manifest) {
                const timestamp = manifest[`/${item.url.replace(/\/\//g, '/')}` ];
                if (timestamp)
                    item.url += `?t=${timestamp}`;
            }
        });

        super.addFile(file);
    }
}