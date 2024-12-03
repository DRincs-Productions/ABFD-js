import { ContainerOptions, SpriteOptions, TextOptions } from "pixi.js";
import { ContainerChild } from "../../classes/canvas/Container";
import { CanvasEventNamesType } from "../../types";
import { EventIdType } from "../../types/EventIdType";
import TextureMemory from "./TextureMemory";

/**
 * Interface for the canvas base memory
 */
export interface CanvasBaseItemMemory {
    pixivnId: string,
}

/**
 * Interface for the canvas container memory
 */
export interface ContainerMemory<C extends ContainerChild = ContainerChild> extends ContainerOptions<C>, CanvasBaseItemMemory {
    elements: CanvasBaseItemMemory[],
}

export interface SpriteBaseMemory extends SpriteOptions, CanvasBaseItemMemory {
    /**
     * @deprecated
     */
    textureImage?: TextureMemory,
    textureData: TextureMemory,
    onEvents: { [name: CanvasEventNamesType]: EventIdType }
}

/**
 * Interface for the canvas sprite memory
 */
export interface SpriteMemory extends SpriteBaseMemory { }

/**
 * Interface for the canvas text memory
 */
export interface TextMemory extends TextOptions, CanvasBaseItemMemory {
    onEvents: { [name: CanvasEventNamesType]: EventIdType }
}

/**
 * The memory of the image. It uses for save the state of the image.
 */
export interface ImageSpriteMemory extends SpriteBaseMemory {
    /**
     * @deprecated use SpriteBaseMemory.textureAlias
     */
    imageLink?: string,
}

/**
 * The memory of the video. It uses for save the state of the video.
 */
export interface VideoSpriteMemory extends ImageSpriteMemory {
    loop: boolean,
    paused: boolean,
    currentTime: number,
}
