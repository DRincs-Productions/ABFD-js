import { tickerDecorator } from "../../decorators/TickerDecorator";
import { TickerProgrationType } from "../../interface/ITickerProgration";
import { GameWindowManager } from "../../managers/WindowManager";
import { CanvasSprite } from "../canvas/CanvasSprite";
import { TickerClass } from "./TickerClass";

/**
 * A ticker that rotates the children of the canvas.
 */
@tickerDecorator()
export class RotateTicker extends TickerClass<{ speed?: number, clockwise?: boolean, speedProgression?: TickerProgrationType, }> {
    /**
     * The method that will be called every frame to rotate the children of the canvas.
     * @param delta The delta time
     * @param args The arguments that are passed to the ticker
     * - speed: The speed of the rotation, default is 0.1
     * - clockwise: The direction of the rotation, default is true
     * - speedProgression: The progression of the speed
     * @param childTags The tags of the children that are connected to this ticker
     */
    override fn(
        delta: number,
        args: {
            speed?: number,
            clockwise?: boolean,
            speedProgression?: TickerProgrationType,
        },
        childTags: string[]
    ): void {
        let speed = args.speed || 0.1
        let clockwise = args.clockwise === undefined ? true : args.clockwise
        childTags.forEach((tag) => {
            let element = GameWindowManager.getChild(tag)
            if (element && element instanceof CanvasSprite) {
                if (clockwise)
                    element.rotation += speed * delta;
                else
                    element.rotation -= speed * delta;
            }
        })
        if (args.speed !== undefined
            && args.speedProgression
            && args.speed !== args.speedProgression.limit
        ) {
            if (args.speedProgression.type === "linear") {
                args.speed += args.speedProgression.amt
                if (args.speedProgression.limit !== undefined) {
                    if (args.speed > args.speedProgression.limit && args.speedProgression.amt > 0) {
                        args.speed = args.speedProgression.limit
                    }
                    else if (args.speed < args.speedProgression.limit && args.speedProgression.amt < 0) {
                        args.speed = args.speedProgression.limit
                    }
                }
            }
            else if (args.speedProgression.type === "exponential") {
                args.speed += args.speed * args.speedProgression.percentage
                if (args.speedProgression.limit !== undefined) {
                    if (args.speed > args.speedProgression.limit && args.speedProgression.percentage > 0) {
                        args.speed = args.speedProgression.limit
                    }
                    else if (args.speed < args.speedProgression.limit && args.speedProgression.percentage < 0) {
                        args.speed = args.speedProgression.limit
                    }
                }
            }
        }
    }
}
