const spriteFragShader = `
#define SHADER_NAME PHASER_MULTI_FS

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler[%count%];

varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;

uniform vec4 tone;

const vec3 lumaF = vec3(.299, .587, .114);

void main ()
{
    vec4 texture;

    %forloop%

    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

    //  Multiply texture tint
    vec4 color = texture * texel;

    if (outTintEffect == 1.0)
    {
        //  Solid color + texture alpha
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    }
    else if (outTintEffect == 2.0)
    {
        //  Solid color, no texture
        color = texel;
    }

    /* Apply gray */
    float luma = dot(color.rgb, lumaF);
    color.rgb = mix(color.rgb, vec3(luma), tone.w);

    /* Apply tone */
    color.rgb += tone.rgb * (color.a / 255.0);

    gl_FragColor = color;
}
`;

export default class SpritePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline
{
    private _tone: number[];

    constructor(game: Phaser.Game) {
        super({
            game: game,
            name: 'sprite',
            fragShader: spriteFragShader
        });

        this._tone = [ 0, 0, 0, 0 ];
    }

    onPreRender(): void {
        this.set4f('tone', this._tone[0], this._tone[1], this._tone[2], this._tone[3]);
    }

    onBind(gameObject: Phaser.GameObjects.GameObject): void {
        super.onBind();

        const data = (gameObject as Phaser.GameObjects.Sprite).pipelineData;
        const tone = data['tone'] as number[];

        this.set4f('tone', tone[0], tone[1], tone[2], tone[3]);
    }

    onBatch(gameObject: Phaser.GameObjects.GameObject): void {
        if (gameObject) {
            this.flush();
        }
    }

    get tone(): number[] {
        return this._tone;
    }

    set tone(value: number[]) {
        this._tone = value;
    }
}